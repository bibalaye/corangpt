"""
Semantic search over the Quran + Hadith index.

Index layout (built by scripts/convert_legacy_index.py or scripts/build_index.py):
    data/index/manifest.json   model, dimension, row ranges per source
    data/index/vectors.npy     float16 matrix (N x 768), L2-normalised
    data/index/docs.json.gz    one document per row (texts + metadata)

At ~14k vectors, an exact numpy dot product takes a few milliseconds, so no
ANN library (FAISS) is needed. Memory: ~42 MB of float32 vectors instead of
~1 GB of Python float lists parsed from JSON.
"""

from __future__ import annotations

import gzip
import json
import logging
import threading
from pathlib import Path

import numpy as np
from django.conf import settings

from .embedder import E5OnnxEmbedder
from .model_assets import MODEL_ID
from .text_utils import normalize_text

logger = logging.getLogger(__name__)

SOURCE_FILTERS = ("both", "quran", "hadith")
RRF_K = 60  # standard Reciprocal Rank Fusion constant


def source_label(doc: dict) -> str:
    """Canonical short label shown everywhere in the UI and used by the LLM to cite: "2:153", "Bukhari 1302"."""
    meta = doc.get("metadata") or {}
    if doc.get("source_type") == "Hadith":
        return f"Bukhari {meta['hadith_number']}" if meta.get("hadith_number") else doc.get("reference", "")
    if meta.get("sourate") and meta.get("ayah"):
        return f"{meta['sourate']}:{meta['ayah']}"
    return doc.get("reference", "")


class VectorService:
    def __init__(self, index_dir: str | Path, embedder):
        index_dir = Path(index_dir)
        manifest = json.loads((index_dir / "manifest.json").read_text(encoding="utf-8"))

        if manifest.get("model") != MODEL_ID:
            logger.warning(
                "Index was built with %s but queries use %s — results will be poor.",
                manifest.get("model"), MODEL_ID,
            )

        self.vectors = np.load(index_dir / "vectors.npy").astype(np.float32)
        with gzip.open(index_dir / "docs.json.gz", "rt", encoding="utf-8") as f:
            self.docs: list[dict] = json.load(f)

        if len(self.docs) != self.vectors.shape[0]:
            raise ValueError("docs.json.gz and vectors.npy have different lengths")
        for doc in self.docs:
            doc.setdefault("label", source_label(doc))

        self._masks: dict[str, np.ndarray] = {}
        for name, rng in manifest["sources"].items():
            mask = np.zeros(len(self.docs), dtype=bool)
            mask[rng["start"]:rng["end"]] = True
            self._masks[name] = mask

        self.embedder = embedder
        logger.info(
            "Vector index loaded: %d docs, dim=%d (%s)",
            len(self.docs), self.vectors.shape[1],
            ", ".join(f"{k}={int(m.sum())}" for k, m in self._masks.items()),
        )

    def search(self, queries: str | list[str], top_k: int = 10, source_filter: str = "both") -> list[dict]:
        """
        Return the `top_k` most similar documents.

        Several query formulations (e.g. the user question + an LLM rewrite)
        are fused with Reciprocal Rank Fusion, which is robust to the
        different score scales of each formulation.
        """
        if isinstance(queries, str):
            queries = [queries]
        normalized = list(dict.fromkeys(q for q in (normalize_text(q) for q in queries) if q))
        if not normalized or top_k <= 0:
            return []

        query_vectors = self.embedder.embed_queries(normalized)       # (Q, d)
        sims = self.vectors @ query_vectors.T                         # (N, Q) cosine similarity

        mask = self._masks.get(source_filter) if source_filter != "both" else None
        allowed = int(mask.sum()) if mask is not None else len(self.docs)
        if mask is not None:
            sims[~mask] = -np.inf
        k = min(top_k, allowed)
        if k == 0:
            return []

        if sims.shape[1] == 1:
            col = sims[:, 0]
            idx = np.argpartition(-col, k - 1)[:k]
            idx = idx[np.argsort(-col[idx])]
        else:
            depth = min(max(k * 4, 50), allowed)
            fused: dict[int, float] = {}
            for j in range(sims.shape[1]):
                col = sims[:, j]
                cand = np.argpartition(-col, depth - 1)[:depth]
                cand = cand[np.argsort(-col[cand])]
                for rank, i in enumerate(cand.tolist()):
                    fused[i] = fused.get(i, 0.0) + 1.0 / (RRF_K + rank + 1)
            idx = np.array(sorted(fused, key=fused.__getitem__, reverse=True)[:k])

        scores = sims[idx].max(axis=1)
        return [dict(self.docs[i], score=round(float(s), 4)) for i, s in zip(idx.tolist(), scores)]


_vector_service: VectorService | None = None
_lock = threading.Lock()


def get_vector_service() -> VectorService:
    """Thread-safe lazy singleton (one per Gunicorn worker)."""
    global _vector_service
    if _vector_service is None:
        with _lock:
            if _vector_service is None:
                embedder = E5OnnxEmbedder(
                    settings.EMBEDDING_MODEL_DIR,
                    threads=settings.EMBEDDING_THREADS,
                )
                _vector_service = VectorService(settings.VECTOR_INDEX_DIR, embedder)
    return _vector_service

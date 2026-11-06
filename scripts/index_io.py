"""Shared writer for the compact vector index (see quran_api/services/vector_service.py)."""

from __future__ import annotations

import gzip
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from quran_api.services.model_assets import MODEL_ID, REPO, REVISION  # noqa: E402


def write_index(out_dir: Path, docs: list[dict], vectors: np.ndarray,
                ranges: dict[str, tuple[int, int, str]]) -> None:
    if len(docs) != vectors.shape[0]:
        raise ValueError("docs and vectors length mismatch")

    norms = np.linalg.norm(vectors, axis=1)
    if not np.allclose(norms, 1.0, atol=1e-2):
        print("  vectors are not unit-length — normalising")
        vectors = vectors / np.clip(norms[:, None], 1e-12, None)

    out_dir.mkdir(parents=True, exist_ok=True)
    np.save(out_dir / "vectors.npy", vectors.astype(np.float16))
    with gzip.open(out_dir / "docs.json.gz", "wt", encoding="utf-8", compresslevel=9) as f:
        json.dump(docs, f, ensure_ascii=False, separators=(",", ":"))

    manifest = {
        "format": 1,
        "model": MODEL_ID,
        "onnx_repo": REPO,
        "onnx_revision": REVISION,
        "dimension": int(vectors.shape[1]),
        "count": len(docs),
        "dtype": "float16",
        "normalization": "quran_api.services.text_utils.normalize_text",
        "sources": {k: {"start": s, "end": e, "label": label} for k, (s, e, label) in ranges.items()},
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    sizes = {p.name: f"{p.stat().st_size / 1e6:.1f} MB" for p in out_dir.iterdir()}
    print(f"Index written to {out_dir}: {sizes}")

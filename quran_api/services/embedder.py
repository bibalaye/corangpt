"""
Lightweight E5 text embedder running on ONNX Runtime (CPU).

Replaces sentence-transformers + PyTorch (several GB) with onnxruntime +
sentencepiece (~60 MB installed). Output matches sentence-transformers' E5
pipeline: XLM-R tokenisation, mean pooling over the attention mask, then
L2 normalisation.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

import numpy as np
import onnxruntime as ort
import sentencepiece as spm

from .model_assets import ensure_model

logger = logging.getLogger(__name__)

# XLM-RoBERTa vocabulary = fairseq specials + SentencePiece ids shifted by one
BOS_ID, EOS_ID, UNK_ID = 0, 2, 3
FAIRSEQ_OFFSET = 1


class E5OnnxEmbedder:
    QUERY_PREFIX = "query: "
    PASSAGE_PREFIX = "passage: "

    def __init__(self, model_dir: str | os.PathLike, max_length: int = 512, threads: int | None = None):
        model_dir = Path(ensure_model(model_dir))
        self.max_length = max_length

        options = ort.SessionOptions()
        # Measured against the fp32 reference model on 40 real questions: ENABLE_ALL
        # is both faster and slightly closer to fp32 rankings than ENABLE_BASIC.
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        options.intra_op_num_threads = threads or min(4, os.cpu_count() or 1)
        options.inter_op_num_threads = 1

        self.session = ort.InferenceSession(
            str(model_dir / "model.onnx"), sess_options=options, providers=["CPUExecutionProvider"]
        )
        self._input_names = {i.name for i in self.session.get_inputs()}
        self.sp = spm.SentencePieceProcessor(model_file=str(model_dir / "sentencepiece.bpe.model"))
        self.dimension = int(self.session.get_outputs()[0].shape[-1] or 768)

        # Optional trimmed vocabulary (scripts/trim_vocab.py): XLM-R id → row in the smaller matrix
        self._remap: np.ndarray | None = None
        kept_path = model_dir / "kept_ids.npy"
        if kept_path.exists():
            kept = np.load(kept_path)
            self._remap = np.full(self.sp.get_piece_size() + 2, -1, dtype=np.int64)
            self._remap[kept] = np.arange(len(kept))
            self._kept_pieces = {self.sp.id_to_piece(i - FAIRSEQ_OFFSET): i - FAIRSEQ_OFFSET
                                 for i in kept.tolist() if i > UNK_ID}
            self._max_piece_len = max(map(len, self._kept_pieces))
            self._resplit_cache: dict[int, list[int]] = {}

        logger.info("E5 ONNX embedder ready (%s threads, vocab %s)", options.intra_op_num_threads,
                    "full" if self._remap is None else f"trimmed to {len(self._kept_pieces) + 4}")

    def _resplit(self, spm_id: int) -> list[int]:
        """Viterbi re-segmentation of a dropped token into kept tokens (Unigram scores)."""
        if spm_id in self._resplit_cache:
            return self._resplit_cache[spm_id]
        piece = self.sp.id_to_piece(spm_id)
        best: list[tuple[float, int, int] | None] = [None] * (len(piece) + 1)  # (score, start, id)
        best[0] = (0.0, -1, -1)
        for end in range(1, len(piece) + 1):
            for start in range(max(0, end - self._max_piece_len), end):
                sub_id = self._kept_pieces.get(piece[start:end])
                if sub_id is not None and best[start] is not None:
                    score = best[start][0] + self.sp.get_score(sub_id)
                    if best[end] is None or score > best[end][0]:
                        best[end] = (score, start, sub_id)
        ids: list[int] = []
        pos = len(piece)
        while pos > 0 and best[pos] is not None:
            _, start, sub_id = best[pos]
            ids.append(sub_id)
            pos = start
        result = ids[::-1] if pos == 0 else [0]  # 0 = <unk> (unreachable: single chars are kept)
        self._resplit_cache[spm_id] = result
        return result

    def _token_ids(self, text: str) -> list[int]:
        spm_ids = self.sp.encode(text)
        if self._remap is not None:
            spm_ids = [j for i in spm_ids
                       for j in ((i,) if i == 0 or self._remap[i + FAIRSEQ_OFFSET] >= 0 else self._resplit(i))]
        ids = [i + FAIRSEQ_OFFSET if i != 0 else UNK_ID for i in spm_ids]
        ids = [BOS_ID, *ids[: self.max_length - 2], EOS_ID]
        return ids if self._remap is None else self._remap[ids].tolist()

    def _embed_one(self, text: str) -> np.ndarray:
        input_ids = np.array([self._token_ids(text)], dtype=np.int64)
        feeds = {"input_ids": input_ids, "attention_mask": np.ones_like(input_ids)}
        if "token_type_ids" in self._input_names:
            feeds["token_type_ids"] = np.zeros_like(input_ids)

        hidden = self.session.run(None, feeds)[0][0]  # (seq, dim)
        pooled = hidden.mean(axis=0)  # mean pooling (no padding with a single sequence)
        return (pooled / max(float(np.linalg.norm(pooled)), 1e-12)).astype(np.float32)

    def _embed(self, texts: list[str]) -> np.ndarray:
        # One sequence per run, never batched: dynamic int8 quantisation computes
        # activation scales over the whole batch, so batching texts together
        # would change each one's vector (measured: cosine drops to ~0.99).
        if not texts:
            return np.zeros((0, self.dimension), dtype=np.float32)
        return np.vstack([self._embed_one(t) for t in texts])

    def embed_queries(self, texts: list[str]) -> np.ndarray:
        return self._embed([self.QUERY_PREFIX + t for t in texts])

    def embed_passages(self, texts: list[str]) -> np.ndarray:
        return self._embed([self.PASSAGE_PREFIX + t for t in texts])

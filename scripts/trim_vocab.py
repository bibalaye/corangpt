"""
Shrink the E5 vocabulary to what this app needs (build-time step).

multilingual-e5-base embeds 250 002 tokens from ~100 languages: the token
embedding matrix alone is 192 MB of the 279 MB int8 model. The Quran + Hadith
corpus uses ~12k of them. We keep:
  - every token used by the corpus      → corpus texts tokenise identically
  - the N most frequent tokens overall  → common words of any question
  - every single-character token        → any other word can still be spelled
and drop the matrix rows of the others (exact: the quantisation scale is
per-tensor). At query time the embedder re-splits a dropped token into kept
sub-tokens (see E5OnnxEmbedder), so nothing ever maps to <unk>.

    pip install onnx numpy sentencepiece      # build-time only
    python scripts/trim_vocab.py models/full models/multilingual-e5-base [--top 40000]

Writes model.onnx (trimmed), sentencepiece.bpe.model and kept_ids.npy to DST.
"""

from __future__ import annotations

import argparse
import gzip
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import onnx
import sentencepiece as spm
from onnx import numpy_helper

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from quran_api.services.text_utils import normalize_arabic, normalize_french  # noqa: E402

EMBEDDING_INIT = "embeddings.word_embeddings.weight_quantized"
SPECIAL_IDS = [0, 1, 2, 3]  # <s> <pad> </s> <unk>


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("src", type=Path)
    parser.add_argument("dst", type=Path)
    parser.add_argument("--top", type=int, default=40000, help="most frequent tokens kept in addition to the corpus")
    parser.add_argument("--docs", type=Path, default=ROOT / "data" / "index" / "docs.json.gz")
    args = parser.parse_args()

    sp = spm.SentencePieceProcessor(model_file=str(args.src / "sentencepiece.bpe.model"))
    n_pieces = sp.get_piece_size()

    with gzip.open(args.docs, "rt", encoding="utf-8") as f:
        docs = json.load(f)
    keep: set[int] = set()
    for prefix in ("query: ", "passage: "):
        keep.update(sp.encode(prefix))
    for d in docs:
        keep.update(sp.encode(f"passage: {normalize_french(d['text_fr'])} {normalize_arabic(d['text_ar'])}"))
    corpus = len(keep)

    regular = [i for i in range(n_pieces) if not (sp.is_control(i) or sp.is_unknown(i) or sp.is_unused(i))]
    keep.update(i for i in regular if len(sp.id_to_piece(i).lstrip("▁")) <= 1)
    keep.update(sorted(regular, key=sp.get_score, reverse=True)[: args.top])
    keep.discard(0)  # spm <unk> → XLM-R <unk> (3), already a special id

    kept_ids = np.array(sorted(set(SPECIAL_IDS) | {i + 1 for i in keep}), dtype=np.int64)  # XLM-R ids

    model = onnx.load(str(args.src / "model.onnx"))
    init = next(t for t in model.graph.initializer if t.name == EMBEDDING_INIT)
    weights = numpy_helper.to_array(init)
    trimmed = numpy_helper.from_array(np.ascontiguousarray(weights[kept_ids]), name=EMBEDDING_INIT)
    init.CopyFrom(trimmed)

    args.dst.mkdir(parents=True, exist_ok=True)
    onnx.save(model, str(args.dst / "model.onnx"))
    np.save(args.dst / "kept_ids.npy", kept_ids)
    # copyfile, not copy: never carry over a restrictive source mode (the app runs as non-root)
    shutil.copyfile(args.src / "sentencepiece.bpe.model", args.dst / "sentencepiece.bpe.model")

    print(
        f"kept {len(kept_ids)}/{weights.shape[0]} tokens (corpus: {corpus}) — "
        f"embedding matrix {weights.nbytes / 1e6:.0f} MB → {weights[kept_ids].nbytes / 1e6:.0f} MB, "
        f"model.onnx {(args.dst / 'model.onnx').stat().st_size / 1e6:.0f} MB"
    )


if __name__ == "__main__":
    main()

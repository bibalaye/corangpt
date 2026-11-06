"""
Rebuild the vector index from the raw texts with the ONNX E5 model (no PyTorch).
Only needed when the source data changes — otherwise use convert_legacy_index.py.

    python scripts/build_index.py              # full rebuild (a few hours on CPU: long hadiths)
    python scripts/build_index.py --limit 50   # quick smoke test

Input : data/raw/quran_complet.json, data/raw/bukhari_complet.json
Output: data/index/{manifest.json, vectors.npy, docs.json.gz}
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from quran_api.services.embedder import E5OnnxEmbedder  # noqa: E402
from quran_api.services.text_utils import normalize_arabic, normalize_french  # noqa: E402
from scripts.index_io import write_index  # noqa: E402

RAW = ROOT / "data" / "raw"


def quran_docs(limit: int | None) -> list[dict]:
    data = json.loads((RAW / "quran_complet.json").read_text(encoding="utf-8"))[:limit]
    return [{
        "id": f"v_{v['sourate']}_{v['ayah']}",
        "source_type": "Coran",
        "reference": f"Sourate {v['sourate']} ({v['sourate_name']}), Verset {v['ayah']}",
        "text_ar": v["text_ar"],
        "text_fr": v["text_fr"],
        "metadata": {"sourate": v["sourate"], "ayah": v["ayah"], "sourate_name": v["sourate_name"]},
    } for v in data]


def hadith_docs(limit: int | None) -> list[dict]:
    data = json.loads((RAW / "bukhari_complet.json").read_text(encoding="utf-8"))[:limit]
    return [{
        "id": f"h_{h['collection']}_{h['book_number']}_{h['hadith_number']}",
        "source_type": "Hadith",
        "reference": f"{h['collection']}, Livre {h['book_number']}, Hadith {h['hadith_number']} ({h['grade']})",
        "text_ar": h["text_ar"],
        "text_fr": h["text_fr"],
        "metadata": {
            "collection": h["collection"], "book_number": h["book_number"],
            "hadith_number": h["hadith_number"], "grade": h["grade"],
        },
    } for h in data]


def embed_all(embedder: E5OnnxEmbedder, docs: list[dict]) -> np.ndarray:
    texts = [f"{normalize_french(d['text_fr'])} {normalize_arabic(d['text_ar'])}" for d in docs]
    out = np.zeros((len(texts), embedder.dimension), dtype=np.float32)
    started = time.time()
    for i, text in enumerate(texts, 1):
        out[i - 1] = embedder.embed_passages([text])[0]
        if i % 200 == 0 or i == len(texts):
            print(f"  {i}/{len(texts)} ({time.time() - started:.0f}s)", flush=True)
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="index only the first N items per source")
    parser.add_argument("--out", type=Path, default=ROOT / "data" / "index")
    args = parser.parse_args()

    embedder = E5OnnxEmbedder(ROOT / "models" / "multilingual-e5-base")

    docs: list[dict] = []
    blocks: list[np.ndarray] = []
    ranges: dict[str, tuple[int, int, str]] = {}
    for key, label, loader in (("quran", "Coran", quran_docs), ("hadith", "Hadith", hadith_docs)):
        items = loader(args.limit)
        print(f"Embedding {len(items)} {key} documents ...")
        start = len(docs)
        blocks.append(embed_all(embedder, items))
        docs.extend(items)
        ranges[key] = (start, len(docs), label)

    write_index(args.out, docs, np.vstack(blocks), ranges)


if __name__ == "__main__":
    main()

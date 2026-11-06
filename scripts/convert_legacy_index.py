"""
Convert the legacy JSON indexes (quran_indexed.zip / hadith_indexed.zip, with
embeddings stored as JSON float lists) into the compact index format used by
the API — without recomputing any embedding.

    python scripts/convert_legacy_index.py

Input  (repo root): quran_indexed.{zip,json}, hadith_indexed.{zip,json}
Output: data/index/{manifest.json, vectors.npy, docs.json.gz}
"""

from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.index_io import write_index  # noqa: E402

SOURCES = [
    ("quran", "Coran", "quran_indexed"),
    ("hadith", "Hadith", "hadith_indexed"),
]


def _load_legacy(stem: str) -> list[dict]:
    json_path = ROOT / f"{stem}.json"
    zip_path = ROOT / f"{stem}.zip"
    if json_path.exists():
        with open(json_path, encoding="utf-8") as f:
            return json.load(f)
    if zip_path.exists():
        with zipfile.ZipFile(zip_path) as zf, zf.open(f"{stem}.json") as f:
            return json.load(f)
    raise FileNotFoundError(f"Neither {json_path.name} nor {zip_path.name} found")


def main() -> None:
    docs: list[dict] = []
    blocks: list[np.ndarray] = []
    ranges: dict[str, tuple[int, int, str]] = {}

    for key, label, stem in SOURCES:
        print(f"Reading {stem} ...")
        items = _load_legacy(stem)
        start = len(docs)
        vectors = np.asarray([item["embedding"] for item in items], dtype=np.float32)
        for item in items:
            docs.append({
                "id": item["id"],
                "source_type": label,
                "reference": item["reference"],
                "text_ar": item["text_ar"],
                "text_fr": item["text_fr"],
                "metadata": item.get("metadata", {}),
            })
        blocks.append(vectors)
        ranges[key] = (start, len(docs), label)
        del items
        print(f"  {key}: {vectors.shape[0]} vectors, dim={vectors.shape[1]}")

    write_index(ROOT / "data" / "index", docs, np.vstack(blocks), ranges)


if __name__ == "__main__":
    main()

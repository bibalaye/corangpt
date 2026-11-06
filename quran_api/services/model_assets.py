"""
Embedding model assets (stdlib only, no Django import).

The query embedder is `intfloat/multilingual-e5-base` exported to ONNX and
quantized to int8 (≈ 279 MB instead of ≈ 1.1 GB, and no PyTorch needed).
It is the same model the existing index was built with, so the stored
document vectors stay compatible.

Files are pinned to an exact Hugging Face revision and verified by SHA-256,
so builds are reproducible and a tampered download is rejected.

Usage (Docker build or first local run):
    python -m quran_api.services.model_assets models/multilingual-e5-base
"""

from __future__ import annotations

import hashlib
import os
import sys
import tempfile
import urllib.request
from pathlib import Path

MODEL_ID = "intfloat/multilingual-e5-base"
REPO = "Xenova/multilingual-e5-base"
REVISION = "1ec9243030a27d1a115d5c340572074c125b58b2"

# local filename -> (path in repo, sha256)
FILES: dict[str, tuple[str, str]] = {
    "model.onnx": (
        "onnx/model_quantized.onnx",
        "df7a9a29309e3ad491e1783adf8baee710262cc06079c7cbab63c630277fac94",
    ),
    # SentencePiece model: ~40 MB in RAM vs ~260 MB for the equivalent tokenizer.json
    "sentencepiece.bpe.model": (
        "sentencepiece.bpe.model",
        "cfc8146abe2a0488e9e2a0c56de7952f7c11ab059eca145a0a727afce0db2865",
    ),
}


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def ensure_model(target_dir: str | os.PathLike) -> Path:
    """Download the pinned model files into `target_dir` if missing. Idempotent."""
    target = Path(target_dir)
    target.mkdir(parents=True, exist_ok=True)

    for local_name, (remote_path, expected_sha) in FILES.items():
        dest = target / local_name
        if dest.exists():
            continue

        url = f"https://huggingface.co/{REPO}/resolve/{REVISION}/{remote_path}"
        print(f"[model] downloading {url}", file=sys.stderr, flush=True)

        fd, tmp_name = tempfile.mkstemp(dir=target, suffix=".part")
        os.close(fd)
        tmp = Path(tmp_name)
        try:
            with urllib.request.urlopen(url, timeout=60) as resp, open(tmp, "wb") as out:
                while chunk := resp.read(1 << 20):
                    out.write(chunk)
            actual = _sha256(tmp)
            if actual != expected_sha:
                raise RuntimeError(
                    f"Checksum mismatch for {remote_path}: expected {expected_sha}, got {actual}"
                )
            # mkstemp creates the file as 0600: make it readable by the non-root app user
            os.chmod(tmp, 0o644)
            tmp.replace(dest)
        finally:
            tmp.unlink(missing_ok=True)

    return target


if __name__ == "__main__":
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "models/multilingual-e5-base"
    path = ensure_model(out_dir)
    print(f"[model] ready in {path}", file=sys.stderr)

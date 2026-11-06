# syntax=docker/dockerfile:1
# ==============================================================
# iaCoran – Django backend (Render)
#   docker build -t iacoran-backend .
#   docker run -p 8000:8000 --env-file .env iacoran-backend
#
# Slim by design: no PyTorch, no compilers, no apt packages.
# The ONNX embedding model is prepared at build time (pinned, checksum-verified,
# vocabulary trimmed), so containers start without downloading anything.
# ==============================================================

# ---------- Stage 1: embedding model (build-time tools stay here) ----------
FROM python:3.13-slim AS model
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /build
RUN pip install onnx==1.23.2 numpy==2.5.4 sentencepiece==0.2.3

COPY quran_api/__init__.py quran_api/__init__.py
COPY quran_api/services/__init__.py quran_api/services/model_assets.py quran_api/services/text_utils.py quran_api/services/
RUN python -m quran_api.services.model_assets /build/full

# Keep every token of the corpus + the most frequent ones: 279 MB → ~130 MB model
ARG VOCAB_TOP=40000
COPY scripts/trim_vocab.py scripts/trim_vocab.py
COPY data/index/docs.json.gz data/index/docs.json.gz
RUN python scripts/trim_vocab.py /build/full /build/model --top "${VOCAB_TOP}" \
    && chmod -R a+rX /build/model

# ---------- Stage 2: runtime ----------
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
RUN useradd --create-home --uid 10001 appuser && chown appuser:appuser /app

# Dependencies — cached until requirements.txt changes
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY --from=model /build/model /app/models/multilingual-e5-base
COPY data/index/ data/index/

COPY manage.py gunicorn.conf.py entrypoint.sh ./
COPY core/ core/
COPY quran_api/ quran_api/

RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh \
    && DJANGO_SECRET_KEY=collectstatic-only python manage.py collectstatic --noinput

USER appuser
EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]

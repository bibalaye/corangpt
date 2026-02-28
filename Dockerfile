# ==============================================================
# Dockerfile – iaCoran Django Backend (Render deployment)
# ==============================================================
# Build:  docker build -t iacoran-backend .
# Run:    docker run -p 8000:8000 --env-file .env iacoran-backend
# ==============================================================

# ---------- Stage 1 : Builder (wheels + unzip data) ----------
FROM python:3.13-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ gfortran \
    libopenblas-dev liblapack-dev \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy and install Python dependencies as wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Unzip pre-built indexes (quran + hadith)
COPY quran_indexed.zip hadith_indexed.zip ./
RUN unzip -o quran_indexed.zip && unzip -o hadith_indexed.zip


# ---------- Stage 2 : Runtime ----------
FROM python:3.13-slim

# System dependencies needed at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopenblas0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home appuser

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy unzipped index files from builder
COPY --from=builder /build/quran_indexed.json /app/quran_indexed.json
COPY --from=builder /build/hadith_indexed.json /app/hadith_indexed.json

# Copy source data files needed for indexing
COPY quran_complet.json /app/quran_complet.json
COPY bukhari_complet.json /app/bukhari_complet.json

# Copy Django project source code
COPY manage.py /app/
COPY core/ /app/core/
COPY quran_api/ /app/quran_api/
COPY seed_plans.py /app/
COPY index_quran.py /app/
COPY index_hadith.py /app/

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create static files directory
RUN mkdir -p /app/staticfiles

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (Render uses $PORT, defaults to 8000)
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/')" || exit 1

# Entrypoint performs migrations, seeding, indexing, then starts Gunicorn
ENTRYPOINT ["/app/entrypoint.sh"]

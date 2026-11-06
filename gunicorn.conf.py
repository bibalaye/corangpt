"""
Gunicorn settings.

One worker + threads: the ONNX model (~300 MB in RAM) is loaded once instead
of once per process, and threads are ideal here because requests mostly wait
on the LLM API (I/O) and ONNX Runtime releases the GIL while embedding.
Scale with WEB_CONCURRENCY only if the instance has RAM to spare.
"""

import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
worker_class = "gthread"
threads = int(os.environ.get("GUNICORN_THREADS", "8"))
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "120"))  # streamed answers can take a while
graceful_timeout = 30
keepalive = 5
accesslog = "-"
errorlog = "-"


def post_worker_init(worker):
    """Load the model and index before accepting traffic (no slow first request)."""
    from quran_api.services.llm_service import get_llm_service
    from quran_api.services.vector_service import get_vector_service

    get_vector_service()
    get_llm_service()

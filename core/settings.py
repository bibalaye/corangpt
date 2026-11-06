import os
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def env_bool(name: str, default: bool = False) -> bool:
    return env(name, str(default)).lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in env(name, default).split(",") if item.strip()]


# ───────────────────────── Core ─────────────────────────

DEBUG = env_bool("DJANGO_DEBUG", False)

SECRET_KEY = env("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is false.")
    SECRET_KEY = "django-insecure-dev-only-key"

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS") or (["*"] if DEBUG else [])
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS")
if render_host := env("RENDER_EXTERNAL_HOSTNAME"):  # injected automatically by Render
    ALLOWED_HOSTS.append(render_host)
    CSRF_TRUSTED_ORIGINS.append(f"https://{render_host}")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "quran_api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# PostgreSQL via DATABASE_URL in production (Render), SQLite in development
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# Django ≥ 5.1 ignores the old STATICFILES_STORAGE setting — STORAGES is required.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ───────────────────────── Security (production) ─────────────────────────

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Auth uses a Token header (no cookies), so allowing all origins is acceptable;
# set CORS_ALLOWED_ORIGINS (comma-separated) to restrict it to your frontend.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_ALL_ORIGINS = not CORS_ALLOWED_ORIGINS

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": env("THROTTLE_ANON", "30/min"),
        "user": env("THROTTLE_USER", "60/min"),
    },
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"simple": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "simple"}},
    "root": {"handlers": ["console"], "level": "WARNING"},
    "loggers": {
        "quran_api": {"handlers": ["console"], "level": env("LOG_LEVEL", "INFO"), "propagate": False},
    },
}

# ───────────────────────── Retrieval (local, free) ─────────────────────────

VECTOR_INDEX_DIR = BASE_DIR / "data" / "index"
EMBEDDING_MODEL_DIR = Path(env("EMBEDDING_MODEL_DIR") or BASE_DIR / "models" / "multilingual-e5-base")
EMBEDDING_THREADS = int(env("EMBEDDING_THREADS", "0")) or None  # None = min(4, CPU count)

RAG_CONTEXT_K = int(env("RAG_CONTEXT_K", "8"))          # passages sent to the LLM
RAG_QUERY_REWRITE = env_bool("RAG_QUERY_REWRITE", True)  # extra keyword query (fast model)
RAG_MAX_FR_CHARS = int(env("RAG_MAX_FR_CHARS", "1200"))  # per passage, keeps prompts small
RAG_MAX_AR_CHARS = int(env("RAG_MAX_AR_CHARS", "400"))

# ───────────────────────── LLM (free tiers, OpenAI-compatible) ─────────────────────────
# Tried in order; a provider is enabled only when its API key is set.

LLM_PROVIDER_ORDER = env_list("LLM_PROVIDER_ORDER", "gemini,groq,cerebras")
LLM_TIMEOUT = float(env("LLM_TIMEOUT", "60"))
LLM_MAX_TOKENS = int(env("LLM_MAX_TOKENS", "2048"))

LLM_PROVIDERS = {
    "gemini": {  # https://aistudio.google.com/apikey
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key": env("GEMINI_API_KEY"),
        "model": env("GEMINI_MODEL", "gemini-3.8-flash"),
        "fast_model": env("GEMINI_FAST_MODEL", "gemini-3.5-flash-lite"),
        "reasoning_effort": env("GEMINI_REASONING_EFFORT", "low"),
    },
    "groq": {  # https://console.groq.com/keys
        "base_url": "https://api.groq.com/openai/v1",
        "api_key": env("GROQ_API_KEY"),
        "model": env("GROQ_MODEL", "openai/gpt-oss-120b"),
        "fast_model": env("GROQ_FAST_MODEL", "openai/gpt-oss-20b"),
        "reasoning_effort": env("GROQ_REASONING_EFFORT", "low"),
    },
    "cerebras": {  # https://cloud.cerebras.ai
        "base_url": "https://api.cerebras.ai/v1",
        "api_key": env("CEREBRAS_API_KEY"),
        "model": env("CEREBRAS_MODEL", "gpt-oss-120b"),
        "fast_model": env("CEREBRAS_FAST_MODEL", "gpt-oss-120b"),
        "reasoning_effort": env("CEREBRAS_REASONING_EFFORT", "low"),
    },
}

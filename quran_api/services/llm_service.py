"""
LLM access through free, OpenAI-compatible APIs with automatic fallback.

Providers are tried in order (LLM_PROVIDER_ORDER); only those with an API key
are enabled. When one fails — free-tier quota (429), outage, timeout — the
next one answers. One small SDK (`openai`) replaces google-generativeai and
its gRPC/protobuf/google-api stack.

    gemini   → Google AI Studio free tier   (gemini-3.8-flash / gemini-3.5-flash-lite)
    groq     → Groq free tier               (openai/gpt-oss-120b / openai/gpt-oss-20b)
    cerebras → Cerebras free tier           (gpt-oss-120b)
"""

from __future__ import annotations

import logging
import threading
from collections.abc import Iterator
from dataclasses import dataclass

from django.conf import settings
from openai import OpenAI

logger = logging.getLogger(__name__)


class LLMUnavailableError(RuntimeError):
    """Every configured provider failed (or none is configured)."""


@dataclass(frozen=True)
class Provider:
    name: str
    base_url: str
    api_key: str
    model: str
    fast_model: str
    reasoning_effort: str | None


def _delta_text(chunk) -> str:
    if not chunk.choices:
        return ""
    return chunk.choices[0].delta.content or ""


class LLMService:
    def __init__(self, providers: list[Provider], timeout: float = 60, max_tokens: int = 2048):
        self.providers = providers
        self.max_tokens = max_tokens
        # max_retries=1: retry a transient blip once, then let the next provider answer.
        self._clients = {
            p.name: OpenAI(api_key=p.api_key, base_url=p.base_url, timeout=timeout, max_retries=1)
            for p in providers
        }
        if providers:
            logger.info("LLM providers: %s", ", ".join(f"{p.name}({p.model})" for p in providers))
        else:
            logger.warning("No LLM provider configured — set GEMINI_API_KEY and/or GROQ_API_KEY.")

    @property
    def available(self) -> bool:
        return bool(self.providers)

    def _params(self, p: Provider, messages: list[dict], fast: bool, max_tokens: int | None) -> dict:
        params = {
            "model": p.fast_model if fast else p.model,
            "messages": messages,
            "max_tokens": max_tokens or self.max_tokens,
        }
        if p.reasoning_effort:
            params["reasoning_effort"] = p.reasoning_effort
        return params

    def complete(self, messages: list[dict], *, fast: bool = False, max_tokens: int | None = None) -> str:
        last_error: Exception | None = None
        for p in self.providers:
            params = self._params(p, messages, fast, max_tokens)
            try:
                resp = self._clients[p.name].chat.completions.create(**params)
                text = (resp.choices[0].message.content or "").strip() if resp.choices else ""
                if text:
                    return text
                last_error = RuntimeError("empty response")
            except Exception as e:  # noqa: BLE001 — any failure means "try the next provider"
                last_error = e
            logger.warning("LLM %s/%s failed: %s", p.name, params["model"], last_error)
        raise LLMUnavailableError("All LLM providers failed") from last_error

    def stream(self, messages: list[dict], *, max_tokens: int | None = None) -> Iterator[str]:
        """
        Yield text chunks. Falls back to the next provider as long as nothing
        has been sent to the client yet; after the first token we stay on the
        same provider (switching mid-answer would produce an incoherent text).
        """
        last_error: Exception | None = None
        for p in self.providers:
            params = self._params(p, messages, False, max_tokens)
            try:
                chunks = iter(self._clients[p.name].chat.completions.create(**params, stream=True))
                first = ""
                for chunk in chunks:
                    first = _delta_text(chunk)
                    if first:
                        break
                if not first:
                    raise RuntimeError("empty stream")
            except Exception as e:  # noqa: BLE001
                last_error = e
                logger.warning("LLM stream %s/%s failed: %s", p.name, params["model"], e)
                continue

            logger.info("Answer streamed by %s/%s", p.name, params["model"])
            yield first
            try:
                for chunk in chunks:
                    if text := _delta_text(chunk):
                        yield text
            except Exception as e:  # noqa: BLE001
                logger.warning("LLM stream %s interrupted: %s", p.name, e)
                yield "\n\n*(Réponse interrompue, veuillez réessayer.)*"
            return

        raise LLMUnavailableError("All LLM providers failed") from last_error


def providers_from_settings() -> list[Provider]:
    configs = settings.LLM_PROVIDERS
    providers = []
    for name in settings.LLM_PROVIDER_ORDER:
        cfg = configs.get(name)
        if not cfg:
            logger.warning("Unknown LLM provider '%s' in LLM_PROVIDER_ORDER", name)
            continue
        key = (cfg.get("api_key") or "").strip()
        if not key or key.lower() in {"none", "your_api_key"}:
            continue
        providers.append(Provider(
            name=name,
            base_url=cfg["base_url"],
            api_key=key,
            model=cfg["model"],
            fast_model=cfg.get("fast_model") or cfg["model"],
            reasoning_effort=cfg.get("reasoning_effort") or None,
        ))
    return providers


_llm_service: LLMService | None = None
_lock = threading.Lock()


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        with _lock:
            if _llm_service is None:
                _llm_service = LLMService(
                    providers_from_settings(),
                    timeout=settings.LLM_TIMEOUT,
                    max_tokens=settings.LLM_MAX_TOKENS,
                )
    return _llm_service

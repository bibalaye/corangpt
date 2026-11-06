"""
Retrieval-Augmented Generation pipeline: rewrite → retrieve → answer.
"""

from __future__ import annotations

import logging
from collections.abc import Iterator

from django.conf import settings

from .llm_service import LLMService, LLMUnavailableError, get_llm_service
from .vector_service import get_vector_service

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
Tu es un assistant islamique bienveillant et érudit. Tu aides les utilisateurs à \
comprendre l'Islam en t'appuyant UNIQUEMENT sur les extraits du Coran et des Hadiths \
fournis dans le message (section SOURCES).

Règles :
- N'utilise que les SOURCES fournies. N'invente jamais de verset, de hadith ni de référence.
- Cite chaque source utilisée avec sa référence exacte, telle qu'écrite dans les SOURCES \
(ex. « Sourate 2 (Al-Baqara), Verset 153 »).
- Explique le sens des textes de façon claire et pédagogique, en les reliant à la question.
- Si plusieurs sources se complètent, fais la synthèse ; ignore celles qui sont hors sujet.
- Si aucune source ne traite de la question, réponds exactement : \
« Je ne trouve pas de réponse claire dans les sources qui me sont fournies. »
- Pour une décision juridique personnelle (fatwa), rappelle avec douceur de consulter un savant qualifié.
- Réponds dans la langue de la question, avec un ton chaleureux et respectueux, en Markdown \
concis (paragraphes courts, listes si utile)."""

REWRITE_PROMPT = """\
Tu es un expert en recherche islamique. Transforme la question en mots-clés de recherche.
Règles : 3 à 8 mots-clés, uniquement les concepts religieux et thématiques essentiels, \
termes coraniques quand c'est possible (ex. « sawm » pour jeûne, « sabr » pour patience), \
en français ET en arabe si pertinent. Réponds UNIQUEMENT avec les mots-clés, sur une ligne.

Exemples :
Q: Peux-tu m'expliquer ce que dit le Coran sur les règles du jeûne pendant le Ramadan ?
R: jeûne Ramadan règles sawm صيام رمضان
Q: Quels sont les droits des parents dans l'Islam selon le Coran ?
R: droits parents respect obéissance والدين"""


def _truncate(text: str, limit: int) -> str:
    text = (text or "").strip()
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + " […]"


def format_sources(contexts: list[dict]) -> str:
    """Numbered, length-capped sources (some hadiths exceed 15 000 characters)."""
    blocks = []
    for i, ctx in enumerate(contexts, 1):
        blocks.append(
            f"[{i}] {ctx.get('source_type', 'Coran')} — {ctx['reference']}\n"
            f"Arabe : {_truncate(ctx.get('text_ar', ''), settings.RAG_MAX_AR_CHARS)}\n"
            f"Français : {_truncate(ctx.get('text_fr', ''), settings.RAG_MAX_FR_CHARS)}"
        )
    return "\n\n".join(blocks)


def build_messages(question: str, contexts: list[dict]) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"SOURCES :\n\n{format_sources(contexts)}\n\nQUESTION : {question}"},
    ]


class RagPipeline:
    def __init__(self, llm: LLMService, vectors):
        self.llm = llm
        self.vectors = vectors

    def rewrite_query(self, question: str) -> str | None:
        """Keyword reformulation with the fast model; None when skipped or failed."""
        if not settings.RAG_QUERY_REWRITE or not self.llm.available or len(question.split()) <= 6:
            return None
        try:
            text = self.llm.complete(
                [{"role": "system", "content": REWRITE_PROMPT}, {"role": "user", "content": f"Q: {question}\nR:"}],
                fast=True,
                max_tokens=300,  # reasoning models count thinking tokens here
            )
        except LLMUnavailableError:
            return None
        rewritten = text.strip().splitlines()[0].removeprefix("R:").strip() if text.strip() else ""
        if not rewritten or len(rewritten) > max(200, len(question)):
            return None
        logger.info("Query rewrite: %r → %r", question, rewritten)
        return rewritten

    def retrieve(self, question: str, source_filter: str = "both", top_k: int | None = None) -> list[dict]:
        queries = [question]
        if rewritten := self.rewrite_query(question):
            queries.append(rewritten)
        return self.vectors.search(queries, top_k=top_k or settings.RAG_CONTEXT_K, source_filter=source_filter)

    def answer(self, question: str, contexts: list[dict]) -> str:
        return self.llm.complete(build_messages(question, contexts))

    def answer_stream(self, question: str, contexts: list[dict]) -> Iterator[str]:
        return self.llm.stream(build_messages(question, contexts))


def get_rag_pipeline() -> RagPipeline:
    return RagPipeline(get_llm_service(), get_vector_service())

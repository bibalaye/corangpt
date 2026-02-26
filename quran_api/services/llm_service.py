import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Prompt for query rewriting — short, focused
_REWRITE_SYSTEM_PROMPT = (
    "Tu es un expert en recherche coranique. "
    "Ton rôle est de transformer une question utilisateur en mots-clés de recherche optimisés.\n\n"
    "Règles :\n"
    "- Extrais uniquement les concepts religieux et thématiques essentiels\n"
    "- Supprime les formules de politesse, les mots vides et le bruit\n"
    "- Garde 3 à 8 mots-clés maximum\n"
    "- Utilise les termes coraniques quand possible (ex: 'sawm' pour jeûne, 'sabr' pour patience)\n"
    "- Inclus les termes en français ET en arabe si pertinent\n"
    "- Réponds UNIQUEMENT avec les mots-clés, rien d'autre\n\n"
    "Exemples :\n"
    "Q: Peux-tu m'expliquer en détail ce que dit le Coran sur les règles du jeûne pendant le mois de Ramadan ?\n"
    "R: jeûne Ramadan règles sawm صيام رمضان\n\n"
    "Q: Quels sont les droits des parents dans l'Islam selon le Coran ?\n"
    "R: droits parents respect obéissance والدين\n\n"
    "Q: Que dit le Coran sur la patience dans les épreuves ?\n"
    "R: patience épreuves sabr صبر"
)


class LLMService:
    def __init__(self):
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if api_key and api_key.lower() not in ('none', ''):
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-3-flash-preview')
            logger.info(f"LLMService initialized with key {api_key[:8]}...{api_key[-4:]}")
        else:
            self.model = None
            logger.warning("GEMINI_API_KEY is not configured.")

    def rewrite_query(self, question: str) -> str:
        """
        Transform a long user question into concise search keywords.

        Uses Gemini to extract the core Islamic/Quranic concepts,
        producing an optimized query for vector search.
        Returns the original question if rewriting fails.
        """
        if not self.model:
            return question

        # Short questions (< 6 words) don't need rewriting
        if len(question.split()) <= 6:
            logger.debug(f"Query too short to rewrite: '{question}'")
            return question

        try:
            prompt = f"{_REWRITE_SYSTEM_PROMPT}\n\nQ: {question}\nR:"
            response = self.model.generate_content(prompt)
            rewritten = response.text.strip()

            # Sanity check: if rewrite is empty or too long, fallback
            if not rewritten or len(rewritten) > len(question):
                logger.warning(f"Query rewrite produced bad result, using original")
                return question

            logger.info(f"Query rewrite: '{question}' → '{rewritten}'")
            return rewritten

        except Exception as e:
            logger.warning(f"Query rewrite failed, using original: {e}")
            return question

    def generate_response(self, question: str, contexts: list):
        if not self.model:
            return "Désolé, le service LLM n'est pas configuré. Veuillez vérifier la présence de GEMINI_API_KEY."

        # Format context for the prompt
        context_str = ""
        for i, ctx in enumerate(contexts):
            context_str += f"- {ctx['reference']} :\n  Texte Arabe : {ctx['text_ar']}\n  Traduction Française : {ctx['text_fr']}\n\n"

        system_instruction = (
            "Tu es un assistant coranique bienveillant et érudit. "
            "Ta mission est d'aider les utilisateurs à comprendre le Coran "
            "en t'appuyant sur les versets qui te sont fournis en contexte.\n\n"
            "Comment répondre :\n"
            "- Utilise un langage naturel, fluide et chaleureux, comme un savant qui explique avec douceur.\n"
            "- Base tes réponses UNIQUEMENT sur les versets fournis dans le contexte ci-dessous.\n"
            "- Cite toujours la sourate et le numéro du verset entre parenthèses, par exemple (Sourate Al-Baqara, 2:153).\n"
            "- Explique le sens des versets de manière accessible, en les reliant à la question posée.\n"
            "- Tu peux reformuler, contextualiser et enrichir ta réponse pour la rendre pédagogique.\n"
            "- Si les versets fournis répondent clairement à la question, n'hésite pas à le dire avec assurance.\n"
            "- Si aucun verset du contexte ne traite du sujet demandé, réponds simplement :\n"
            "  \"Je ne trouve pas de réponse claire dans les versets qui me sont fournis.\"\n\n"
            "Garde toujours un ton respectueux, bienveillant et accessible."
        )

        prompt = (
            f"{system_instruction}\n\n"
            f"CONTEXTE :\n{context_str}\n"
            f"QUESTION : {question}\n\n"
            f"RÉPONSE :"
        )

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.exception(f"Erreur lors de l'appel à Gemini: {e}")
            return "Une erreur est survenue lors de la génération de la réponse."

    def generate_response_stream(self, question: str, contexts: list):
        """
        Generator that yields text chunks from Gemini streaming.

        Uses the same prompt as generate_response but streams
        the output token by token for real-time display.
        """
        if not self.model:
            yield "Désolé, le service LLM n'est pas configuré."
            return

        # Format context
        context_str = ""
        for ctx in contexts:
            context_str += (
                f"- {ctx['reference']} :\n"
                f"  Texte Arabe : {ctx['text_ar']}\n"
                f"  Traduction Française : {ctx['text_fr']}\n\n"
            )

        system_instruction = (
            "Tu es un assistant coranique bienveillant et érudit. "
            "Ta mission est d'aider les utilisateurs à comprendre le Coran "
            "en t'appuyant sur les versets qui te sont fournis en contexte.\n\n"
            "Comment répondre :\n"
            "- Utilise un langage naturel, fluide et chaleureux, comme un savant qui explique avec douceur.\n"
            "- Base tes réponses UNIQUEMENT sur les versets fournis dans le contexte ci-dessous.\n"
            "- Cite toujours la sourate et le numéro du verset entre parenthèses, par exemple (Sourate Al-Baqara, 2:153).\n"
            "- Explique le sens des versets de manière accessible, en les reliant à la question posée.\n"
            "- Tu peux reformuler, contextualiser et enrichir ta réponse pour la rendre pédagogique.\n"
            "- Si les versets fournis répondent clairement à la question, n'hésite pas à le dire avec assurance.\n"
            "- Si aucun verset du contexte ne traite du sujet demandé, réponds simplement :\n"
            "  \"Je ne trouve pas de réponse claire dans les versets qui me sont fournis.\"\n\n"
            "Garde toujours un ton respectueux, bienveillant et accessible."
        )

        prompt = (
            f"{system_instruction}\n\n"
            f"CONTEXTE :\n{context_str}\n"
            f"QUESTION : {question}\n\n"
            f"RÉPONSE :"
        )

        try:
            response = self.model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.exception(f"Streaming error: {e}")
            yield f"\n\n[Erreur: {str(e)}]"

# Singleton instance
_llm_service = None

def get_llm_service():
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


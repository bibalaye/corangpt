from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .services.vector_service import get_vector_service
from .services.llm_service import get_llm_service
import logging

logger = logging.getLogger(__name__)


class QuranSearchView(APIView):
    """
    Search Quranic verses by semantic similarity (FAISS).
    """
    def get(self, request):
        query = request.query_params.get('q', None)
        top_k = int(request.query_params.get('limit', 5))

        if not query:
            return Response(
                {"error": "Le paramètre de requête 'q' est obligatoire."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = get_vector_service()
            results = service.search(query, top_k)
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Erreur lors de la recherche FAISS: {e}")
            return Response(
                {"error": "Erreur interne lors de la recherche vectorielle."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuranAskView(APIView):
    """
    Ask a question about the Quran.

    Pipeline:
    1. Rewrite long questions into optimized search keywords (via LLM)
    2. Search for contexts via FAISS (top_k=10 for richer recall)
    3. Generate an expert answer with LLM using these contexts
    4. Return top sources to the user
    """
    # Always fetch more contexts than requested for better LLM recall
    SEARCH_TOP_K = 10

    def post(self, request):
        query = request.data.get('q', None)
        source_limit = int(request.data.get('limit', 5))

        if not query:
            return Response(
                {"error": "La question 'q' est obligatoire."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            llm_service = get_llm_service()
            vector_service = get_vector_service()

            # ── Step 1: Query Rewriting ──
            # For long questions, extract core concepts for better vector search
            optimized_query = llm_service.rewrite_query(query)

            # ── Step 2: Vector Search (extended top_k) ──
            # Fetch more results than the user asked for;
            # the LLM will see all of them for a richer answer
            contexts = vector_service.search(optimized_query, top_k=self.SEARCH_TOP_K)

            # ── Step 3: Generate Answer ──
            # Pass the ORIGINAL question (not the rewritten one) to the LLM
            # so the answer addresses what the user actually asked
            answer = llm_service.generate_response(query, contexts)

            # ── Step 4: Return trimmed sources ──
            # Only return the top N sources the user asked for
            user_sources = contexts[:source_limit]

            return Response({
                "question": query,
                "answer": answer,
                "sources": user_sources
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Erreur lors de la génération de la réponse: {e}")
            return Response(
                {"error": "Erreur lors de la génération de la réponse."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


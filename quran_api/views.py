from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .services.vector_service import get_vector_service
from .services.llm_service import get_llm_service
import json
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
    Ask a question about the Quran (non-streaming).
    """
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

            optimized_query = llm_service.rewrite_query(query)
            contexts = vector_service.search(optimized_query, top_k=self.SEARCH_TOP_K)
            answer = llm_service.generate_response(query, contexts)
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


@csrf_exempt
@require_POST
def quran_ask_stream(request):
    """
    Streaming endpoint for Quran Q&A.

    Protocol: Newline-delimited JSON (NDJSON)
    Events:
      {"type": "sources", "data": [...]}    — Quran verses used as context
      {"type": "token",   "data": "..."}    — Text chunk from LLM
      {"type": "done"}                      — Generation complete
      {"type": "error",   "data": "..."}    — Error message
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    query = data.get('q', '')
    if not query:
        return JsonResponse(
            {"error": "La question 'q' est obligatoire."}, status=400
        )

    source_limit = int(data.get('limit', 5))

    def event_stream():
        try:
            llm_service = get_llm_service()
            vector_service = get_vector_service()

            # Step 1: Query rewriting
            optimized_query = llm_service.rewrite_query(query)

            # Step 2: Vector search
            contexts = vector_service.search(optimized_query, top_k=10)

            # Step 3: Send sources first
            sources = []
            for ctx in contexts[:source_limit]:
                source = {k: v for k, v in ctx.items() if k != 'embedding'}
                sources.append(source)

            yield json.dumps(
                {"type": "sources", "data": sources}, ensure_ascii=False
            ) + "\n"

            # Step 4: Stream LLM response
            for chunk in llm_service.generate_response_stream(query, contexts):
                yield json.dumps(
                    {"type": "token", "data": chunk}, ensure_ascii=False
                ) + "\n"

            yield json.dumps({"type": "done"}) + "\n"

        except Exception as e:
            logger.exception(f"Streaming error: {e}")
            yield json.dumps(
                {"type": "error", "data": str(e)}, ensure_ascii=False
            ) + "\n"

    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/plain; charset=utf-8'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

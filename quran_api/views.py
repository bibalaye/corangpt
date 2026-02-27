from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from .services.vector_service import get_vector_service
from .services.llm_service import get_llm_service
from .models import ChatHistory
from .serializers import UserSerializer, ChatHistorySerializer
import json
import logging

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password:
            return Response({'error': 'Veuillez fournir un nom d\'utilisateur et un mot de passe.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Ce nom d\'utilisateur existe déjà.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Identifiants invalides.'}, status=status.HTTP_401_UNAUTHORIZED)


class ChatHistoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = ChatHistory.objects.filter(user=request.user)
        serializer = ChatHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuranSearchView(APIView):
    """
    Search Quranic verses by semantic similarity (FAISS).
    """
    permission_classes = [AllowAny] # Optionnel: restreindre si besoin

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
    Requires Authentication and uses quotas.
    """
    permission_classes = [IsAuthenticated]
    SEARCH_TOP_K = 10

    def post(self, request):
        # Vérification du quota
        profile = request.user.profile
        if not profile.can_make_request():
            from django.utils import timezone
            import datetime
            
            now = timezone.localtime()
            tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(days=1)
            diff = tomorrow - now
            hours_left = diff.seconds // 3600
            mins_left = (diff.seconds % 3600) // 60
            time_left = f"{hours_left}h {mins_left}m"
            
            return Response(
                {
                    "error": "Vous avez atteint votre limite quotidienne de requêtes pour votre abonnement.",
                    "error_code": "limit_reached",
                    "reset_time": time_left
                }, 
                status=status.HTTP_403_FORBIDDEN
            )

        query = request.data.get('q', None)
        source_limit = int(request.data.get('limit', 5))
        source_filter = request.data.get('source_filter', 'both')

        if not query:
            return Response(
                {"error": "La question 'q' est obligatoire."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            llm_service = get_llm_service()
            vector_service = get_vector_service()

            optimized_query = llm_service.rewrite_query(query)
            contexts = vector_service.search(optimized_query, top_k=self.SEARCH_TOP_K, source_filter=source_filter)
            answer = llm_service.generate_response(query, contexts)
            user_sources = contexts[:source_limit]

            # Déduction et sauvegarde
            profile.increment_request()
            ChatHistory.objects.create(
                user=request.user, 
                query=query, 
                response=answer,
                sources=user_sources
            )

            return Response({
                "question": query,
                "answer": answer,
                "sources": user_sources,
                "requests_today": profile.requests_today
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Erreur lors de la génération de la réponse: {e}")
            return Response(
                {"error": "Erreur lors de la génération de la réponse."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quran_ask_stream(request):
    """
    Streaming endpoint for Quran Q&A.
    """
    profile = request.user.profile
    if not profile.can_make_request():
        from django.utils import timezone
        import datetime
        now = timezone.localtime()
        tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(days=1)
        diff = tomorrow - now
        hours_left = diff.seconds // 3600
        mins_left = (diff.seconds % 3600) // 60
        time_left = f"{hours_left}h {mins_left}m"

        def limit_stream():
            yield json.dumps({
                "type": "error",
                "error_code": "limit_reached",
                "reset_time": time_left,
                "data": "Vous avez atteint votre limite quotidienne de requêtes pour votre abonnement."
            }, ensure_ascii=False) + "\n"
            
        response = StreamingHttpResponse(
            limit_stream(),
            content_type='text/plain; charset=utf-8'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

    try:
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.data
    except Exception:
        return JsonResponse({"error": "Invalid Data"}, status=400)

    query = data.get('q', '')
    if not query:
        return JsonResponse(
            {"error": "La question 'q' est obligatoire."}, status=400
        )

    source_limit = int(data.get('limit', 5))
    source_filter = data.get('source_filter', 'both')

    def event_stream():
        full_response = ""
        try:
            llm_service = get_llm_service()
            vector_service = get_vector_service()

            # Step 1: Query rewriting
            optimized_query = llm_service.rewrite_query(query)

            # Step 2: Vector search
            contexts = vector_service.search(optimized_query, top_k=10, source_filter=source_filter)

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
                full_response += chunk
                yield json.dumps(
                    {"type": "token", "data": chunk}, ensure_ascii=False
                ) + "\n"

            yield json.dumps({"type": "done"}) + "\n"
            
            # Quota processing & History keeping
            profile.increment_request()
            ChatHistory.objects.create(
                user=request.user, 
                query=query, 
                response=full_response,
                sources=sources
            )

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

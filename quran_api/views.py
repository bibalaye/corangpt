import json
import logging
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse, StreamingHttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatHistory, UserProfile
from .serializers import ChatHistorySerializer, UserSerializer
from .services.llm_service import LLMUnavailableError
from .services.rag import get_rag_pipeline
from .services.vector_service import SOURCE_FILTERS, get_vector_service

logger = logging.getLogger(__name__)

MAX_QUESTION_CHARS = 1000
HISTORY_LIMIT = 50
LIMIT_MESSAGE = "Vous avez atteint votre limite quotidienne de requêtes pour votre abonnement."
UNAVAILABLE_MESSAGE = (
    "Le service IA est momentanément saturé (quotas gratuits atteints). "
    "Réessayez dans quelques minutes."
)
GENERIC_ERROR = "Une erreur est survenue lors de la génération de la réponse."


# ───────────────────────── helpers ─────────────────────────

def _time_until_reset() -> str:
    now = timezone.localtime()
    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    seconds = int((tomorrow - now).total_seconds())
    return f"{seconds // 3600}h {(seconds % 3600) // 60}m"


def _limit_payload() -> dict:
    return {"error": LIMIT_MESSAGE, "error_code": "limit_reached", "reset_time": _time_until_reset()}


def _clamp_int(value, default: int, lo: int, hi: int) -> int:
    try:
        return max(lo, min(hi, int(value)))
    except (TypeError, ValueError):
        return default


def _parse_question(data) -> tuple[str | None, str, int, str | None]:
    """Return (question, source_filter, source_limit, error)."""
    question = str(data.get("q") or "").strip()
    source_filter = data.get("source_filter") or "both"
    source_limit = _clamp_int(data.get("limit"), 5, 1, 10)
    if not question:
        return None, source_filter, source_limit, "La question 'q' est obligatoire."
    if len(question) > MAX_QUESTION_CHARS:
        return None, source_filter, source_limit, f"La question est trop longue (max {MAX_QUESTION_CHARS} caractères)."
    if source_filter not in SOURCE_FILTERS:
        return None, source_filter, source_limit, "source_filter doit valoir 'both', 'quran' ou 'hadith'."
    return question, source_filter, source_limit, None


def _record_usage(user, question: str, answer: str, sources: list) -> None:
    UserProfile.for_user(user).increment_request()
    ChatHistory.objects.create(user=user, query=question, response=answer, sources=sources)


def _ndjson(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False) + "\n"


def _stream_response(iterator) -> StreamingHttpResponse:
    response = StreamingHttpResponse(iterator, content_type="application/x-ndjson; charset=utf-8")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response


# ───────────────────────── auth ─────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        email = (request.data.get("email") or "").strip()

        if not username or not password:
            return Response({"error": "Veuillez fournir un nom d'utilisateur et un mot de passe."},
                            status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username__iexact=username).exists():
            return Response({"error": "Ce nom d'utilisateur existe déjà."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(password, user=User(username=username, email=email))
        except ValidationError as e:
            return Response({"error": " ".join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = authenticate(username=request.data.get("username"), password=request.data.get("password"))
        if not user:
            return Response({"error": "Identifiants invalides."}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data}, status=status.HTTP_200_OK)


class ChatHistoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = ChatHistory.objects.filter(user=request.user)[:HISTORY_LIMIT]
        return Response(ChatHistorySerializer(history, many=True).data)


# ───────────────────────── search & ask ─────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([])
def health(request):
    """Liveness probe for Render — never loads the model."""
    return Response({"status": "ok"})


class QuranSearchView(APIView):
    """Semantic search over Quran + Hadith (no LLM call)."""
    permission_classes = [AllowAny]

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()[:MAX_QUESTION_CHARS]
        top_k = _clamp_int(request.query_params.get("limit"), 5, 1, 20)
        source_filter = request.query_params.get("source_filter") or "both"
        if not query:
            return Response({"error": "Le paramètre de requête 'q' est obligatoire."},
                            status=status.HTTP_400_BAD_REQUEST)
        if source_filter not in SOURCE_FILTERS:
            source_filter = "both"
        try:
            return Response(get_vector_service().search(query, top_k=top_k, source_filter=source_filter))
        except Exception:
            logger.exception("Vector search failed")
            return Response({"error": "Erreur interne lors de la recherche."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuranAskView(APIView):
    """Question → sourced answer (non-streaming). Counts against the daily quota."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = UserProfile.for_user(request.user)
        if not profile.can_make_request():
            return Response(_limit_payload(), status=status.HTTP_403_FORBIDDEN)

        question, source_filter, source_limit, error = _parse_question(request.data)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pipeline = get_rag_pipeline()
            contexts = pipeline.retrieve(question, source_filter, top_k=max(settings.RAG_CONTEXT_K, source_limit))
            answer = pipeline.answer(question, contexts[:settings.RAG_CONTEXT_K])
        except LLMUnavailableError:
            return Response({"error": UNAVAILABLE_MESSAGE, "error_code": "llm_unavailable"},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.exception("Ask failed")
            return Response({"error": GENERIC_ERROR}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        sources = contexts[:source_limit]
        _record_usage(request.user, question, answer, sources)
        profile.refresh_from_db(fields=["requests_today"])
        return Response({
            "question": question,
            "answer": answer,
            "sources": sources,
            "requests_today": profile.requests_today,
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def quran_ask_stream(request):
    """
    Streaming Q&A (NDJSON): {"type":"sources"} → {"type":"token"}* → {"type":"done"}.
    Errors are sent as {"type":"error"} so the client can display them in place.
    """
    if not UserProfile.for_user(request.user).can_make_request():
        payload = _limit_payload()
        return _stream_response(iter([_ndjson({"type": "error", "data": payload["error"], **payload})]))

    question, source_filter, source_limit, error = _parse_question(request.data)
    if error:
        return JsonResponse({"error": error}, status=400)

    user = request.user

    def event_stream():
        parts: list[str] = []
        sources: list[dict] = []
        try:
            pipeline = get_rag_pipeline()
            contexts = pipeline.retrieve(question, source_filter, top_k=max(settings.RAG_CONTEXT_K, source_limit))
            sources = contexts[:source_limit]
            yield _ndjson({"type": "sources", "data": sources})

            for chunk in pipeline.answer_stream(question, contexts[:settings.RAG_CONTEXT_K]):
                parts.append(chunk)
                yield _ndjson({"type": "token", "data": chunk})
            yield _ndjson({"type": "done"})
        except LLMUnavailableError:
            yield _ndjson({"type": "error", "error_code": "llm_unavailable", "data": UNAVAILABLE_MESSAGE})
        except Exception:
            logger.exception("Streaming failed")
            yield _ndjson({"type": "error", "data": GENERIC_ERROR})
        finally:
            # Also runs when the client disconnects mid-answer: what was generated is counted and saved.
            if parts:
                try:
                    _record_usage(user, question, "".join(parts), sources)
                except Exception:
                    logger.exception("Could not record usage")

    return _stream_response(event_stream())

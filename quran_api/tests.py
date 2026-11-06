import gzip
import io
import json
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

import numpy as np
from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import ChatHistory, SubscriptionPlan, UserProfile
from .services import rag
from .services.llm_service import LLMService, LLMUnavailableError, Provider
from .services.rag import RagPipeline
from .services.vector_service import VectorService

DOCS = [
    {"id": "v_2_153", "source_type": "Coran", "reference": "Sourate 2 (Al-Baqara), Verset 153",
     "text_ar": "يا أيها الذين آمنوا استعينوا بالصبر", "text_fr": "Cherchez secours dans l'endurance et la Salât.",
     "metadata": {"sourate": 2, "ayah": 153, "sourate_name": "Al-Baqara"}},
    {"id": "h_1", "source_type": "Hadith", "reference": "Sahih al-Bukhari, Livre 23, Hadith 1302 (Sahih)",
     "text_ar": "إنما الصبر عند الصدمة الأولى", "text_fr": "La vraie patience, c'est au premier choc.",
     "metadata": {}},
]


class FakeVectors:
    def __init__(self):
        self.calls = []

    def search(self, queries, top_k=10, source_filter="both"):
        self.calls.append((queries, top_k, source_filter))
        docs = [d for d in DOCS if source_filter == "both" or
                (source_filter == "quran") == (d["source_type"] == "Coran")]
        return [dict(d, score=0.9) for d in docs][:top_k]


class FakeLLM:
    available = True

    def __init__(self, fail=False):
        self.fail = fail

    def complete(self, messages, *, fast=False, max_tokens=None):
        if self.fail:
            raise LLMUnavailableError("down")
        return "patience sabr صبر" if fast else "Réponse complète (Sourate 2, Verset 153)."

    def stream(self, messages, *, max_tokens=None):
        if self.fail:
            raise LLMUnavailableError("down")
        yield "La patience "
        yield "est une vertu."


def _ndjson(response):
    body = b"".join(response.streaming_content).decode("utf-8")
    return [json.loads(line) for line in body.splitlines() if line.strip()]


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class ApiTestBase(TestCase):
    def setUp(self):
        call_command("seed_plans", stdout=io.StringIO())
        self.user = User.objects.create_user("amina", password="Un-mot-de-passe-solide-42")
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.create(user=self.user).key}")
        self.vectors = FakeVectors()
        self.llm = FakeLLM()
        patcher = mock.patch("quran_api.views.get_rag_pipeline", lambda: RagPipeline(self.llm, self.vectors))
        patcher.start()
        self.addCleanup(patcher.stop)


class AuthTests(ApiTestBase):
    def test_health(self):
        self.assertEqual(APIClient().get("/api/health/").json(), {"status": "ok"})

    def test_register_rejects_weak_password(self):
        r = APIClient().post("/api/auth/register/", {"username": "bob", "password": "123"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_register_and_login(self):
        r = APIClient().post("/api/auth/register/",
                             {"username": "bob", "email": "b@x.io", "password": "Tres-bon-mot-de-passe-7"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["user"]["profile"]["subscription_plan"]["name"], "free")

        r = APIClient().post("/api/auth/login/", {"username": "bob", "password": "Tres-bon-mot-de-passe-7"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("token", r.json())

        r = APIClient().post("/api/auth/login/", {"username": "bob", "password": "faux"}, format="json")
        self.assertEqual(r.status_code, 401)


class AskStreamTests(ApiTestBase):
    def test_requires_auth(self):
        r = APIClient().post("/api/ask/stream/", {"q": "patience"}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_stream_happy_path(self):
        r = self.client.post("/api/ask/stream/", {"q": "Que dit le Coran sur la patience dans les épreuves ?",
                                                   "limit": 1, "source_filter": "quran"}, format="json")
        events = _ndjson(r)
        self.assertEqual([e["type"] for e in events], ["sources", "token", "token", "done"])
        self.assertEqual(len(events[0]["data"]), 1)
        self.assertEqual(events[0]["data"][0]["source_type"], "Coran")

        # original question + keyword rewrite are both searched
        queries, _, source_filter = self.vectors.calls[0]
        self.assertEqual(queries[1], "patience sabr صبر")
        self.assertEqual(source_filter, "quran")

        self.assertEqual(UserProfile.objects.get(user=self.user).requests_today, 1)
        history = ChatHistory.objects.get(user=self.user)
        self.assertEqual(history.response, "La patience est une vertu.")
        self.assertEqual(events[-1]["history_id"], history.pk)

    def test_delete_history(self):
        mine = ChatHistory.objects.create(user=self.user, query="q", response="r")
        other = User.objects.create_user("autre", password="Encore-un-mot-de-passe-9")
        theirs = ChatHistory.objects.create(user=other, query="q", response="r")
        self.assertEqual(self.client.delete(f"/api/history/{theirs.pk}/").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/history/{mine.pk}/").status_code, 204)
        self.assertFalse(ChatHistory.objects.filter(pk=mine.pk).exists())
        self.assertTrue(ChatHistory.objects.filter(pk=theirs.pk).exists())

    def test_quota_reached(self):
        UserProfile.objects.filter(user=self.user).update(requests_today=5)
        events = _ndjson(self.client.post("/api/ask/stream/", {"q": "patience"}, format="json"))
        self.assertEqual(events[0]["error_code"], "limit_reached")
        self.assertRegex(events[0]["reset_time"], r"^\d+h \d+m$")

    def test_llm_unavailable_is_not_counted(self):
        self.llm.fail = True
        events = _ndjson(self.client.post("/api/ask/stream/", {"q": "patience"}, format="json"))
        self.assertEqual(events[-1]["error_code"], "llm_unavailable")
        self.assertEqual(UserProfile.objects.get(user=self.user).requests_today, 0)
        self.assertFalse(ChatHistory.objects.exists())

    def test_validation(self):
        self.assertEqual(self.client.post("/api/ask/stream/", {"q": ""}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/ask/stream/", {"q": "x", "source_filter": "bad"},
                                          format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/ask/stream/", {"q": "x" * 1001}, format="json").status_code, 400)


class AskTests(ApiTestBase):
    def test_ask(self):
        r = self.client.post("/api/ask/", {"q": "patience"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["requests_today"], 1)

    def test_ask_quota(self):
        UserProfile.objects.filter(user=self.user).update(requests_today=5)
        self.assertEqual(self.client.post("/api/ask/", {"q": "patience"}, format="json").status_code, 403)

    def test_unlimited_plan(self):
        UserProfile.objects.filter(user=self.user).update(
            requests_today=999, subscription_plan=SubscriptionPlan.objects.get(name="max"))
        self.assertEqual(self.client.post("/api/ask/", {"q": "patience"}, format="json").status_code, 200)


class SearchTests(ApiTestBase):
    def test_search(self):
        with mock.patch("quran_api.views.get_vector_service", lambda: self.vectors):
            self.assertEqual(APIClient().get("/api/search/").status_code, 400)
            r = APIClient().get("/api/search/", {"q": "patience", "limit": 999})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.vectors.calls[-1][1], 20)  # limit clamped


class _FakeEmbedder:
    """Maps a query to the matching document's vector (one-hot)."""

    def embed_queries(self, texts):
        out = np.zeros((len(texts), 3), dtype=np.float32)
        for i, t in enumerate(texts):
            out[i, 0 if "patience" in t else 1 if "priere" in t else 2] = 1.0
        return out


class VectorServiceTests(TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        d = Path(tmp.name)
        np.save(d / "vectors.npy", np.eye(3, dtype=np.float16))
        docs = [{"id": i, "source_type": s, "reference": str(i)} for i, s in enumerate(["Coran", "Coran", "Hadith"])]
        with gzip.open(d / "docs.json.gz", "wt", encoding="utf-8") as f:
            json.dump(docs, f)
        (d / "manifest.json").write_text(json.dumps({
            "model": "intfloat/multilingual-e5-base",
            "sources": {"quran": {"start": 0, "end": 2}, "hadith": {"start": 2, "end": 3}},
        }))
        self.vs = VectorService(d, _FakeEmbedder())

    def test_search_and_filters(self):
        self.assertEqual(self.vs.search("La Patience", top_k=1)[0]["id"], 0)  # normalised (case/accents)
        self.assertEqual({r["source_type"] for r in self.vs.search("patience", top_k=5, source_filter="hadith")},
                         {"Hadith"})
        self.assertEqual(len(self.vs.search("patience", top_k=5, source_filter="quran")), 2)

    def test_rrf_fusion(self):
        ids = [r["id"] for r in self.vs.search(["patience", "prière"], top_k=2)]
        self.assertEqual(sorted(ids), [0, 1])


def _completion(text):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=text))])


def _chunk(text):
    return SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content=text))])


class LLMServiceTests(TestCase):
    def _service(self, *behaviours):
        providers = [Provider(f"p{i}", "http://x", "k", "big", "small", None) for i in range(len(behaviours))]
        service = LLMService(providers)
        service._clients = {
            p.name: SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=b)))
            for p, b in zip(providers, behaviours)
        }
        return service

    def test_falls_back_on_error(self):
        def failing(**_):
            raise RuntimeError("429 quota")
        service = self._service(failing, lambda **kw: _completion(f"ok from {kw['model']}"))
        self.assertEqual(service.complete([], fast=True), "ok from small")

    def test_all_fail(self):
        def failing(**_):
            raise RuntimeError("down")
        with self.assertRaises(LLMUnavailableError):
            self._service(failing, failing).complete([])

    def test_stream_falls_back_before_first_token(self):
        def empty(**_):
            return iter([_chunk("")])
        service = self._service(empty, lambda **_: iter([_chunk("Bon"), _chunk("jour")]))
        self.assertEqual("".join(service.stream([])), "Bonjour")


@override_settings(RAG_MAX_FR_CHARS=20, RAG_MAX_AR_CHARS=10)
class PromptTests(TestCase):
    def test_sources_are_numbered_and_truncated(self):
        text = rag.format_sources([dict(DOCS[0], text_fr="mot " * 50)])
        self.assertTrue(text.startswith("[1] (2:153) Coran — Sourate 2"))
        self.assertIn("[…]", text)
        self.assertLess(len(text), 200)

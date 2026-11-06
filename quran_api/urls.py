from django.urls import path

from .views import (
    ChatHistoryListView,
    LoginView,
    QuranAskView,
    QuranSearchView,
    RegisterView,
    health,
    quran_ask_stream,
)

urlpatterns = [
    path('health/', health, name='health'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('history/', ChatHistoryListView.as_view(), name='chat_history'),
    path('search/', QuranSearchView.as_view(), name='quran_search'),
    path('ask/', QuranAskView.as_view(), name='quran_ask'),
    path('ask/stream/', quran_ask_stream, name='quran_ask_stream'),
]

from django.urls import path
from .views import QuranSearchView, QuranAskView, quran_ask_stream

urlpatterns = [
    path('search/', QuranSearchView.as_view(), name='quran_search'),
    path('ask/', QuranAskView.as_view(), name='quran_ask'),
    path('ask/stream/', quran_ask_stream, name='quran_ask_stream'),
]

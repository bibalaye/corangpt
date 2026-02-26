from django.urls import path
from .views import QuranSearchView, QuranAskView

urlpatterns = [
    path('search/', QuranSearchView.as_view(), name='quran_search'),
    path('ask/', QuranAskView.as_view(), name='quran_ask'),
]

from django.urls import path
from . import views

urlpatterns = [
    path('serre/', views.get_serre),
    path('last/', views.last_serre),
]
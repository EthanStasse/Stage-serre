from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('serre/', views.get_serre),
    path('last/', views.last_serre),
    path('toit/', views.toit_cmd),
]
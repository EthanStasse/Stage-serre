from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),
    path('api/serre/', views.get_serre),
    path('api/last/', views.last_serre),
    path('api/toit/', views.toit_cmd),
]
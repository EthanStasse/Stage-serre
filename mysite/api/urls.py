from django.urls import path
from . import views

irlpatterns = [
    path('blogposts/', views.blogpostListCreate.as_view(), name='blogpost-view-create'),
]       
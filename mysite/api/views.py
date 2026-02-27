from django.shortcuts import render
from rest_framework import generics
from .models import blogPost
from .serializers import blogPostSerializer

# Create your views here.

class blogpostListCreate(generics.ListCreateAPIView):
    queryset = blogPost.objects.all()
    serializer_class = blogPostSerializer

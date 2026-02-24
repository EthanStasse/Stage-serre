# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render
from .models import Serre
from .serializers import SerreSerializer

def index(request):
    """Page d'accueil avec rafraîchissement automatique"""
    return render(request, 'index.html')

@api_view(['GET'])
def get_serre(request):
    serre = Serre.objects.all().order_by('-created_at')[:10]
    serializer = SerreSerializer(serre, many=True)
    return Response(serializer.data)   

@api_view(['GET'])
def last_serre(request):
    lastserre = Serre.objects.latest('created_at')
    serializer = SerreSerializer(lastserre)
    return Response(serializer.data)

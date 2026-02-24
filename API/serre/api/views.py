# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Serre
from .serializers import SerreSerializer

@api_view(['GET'])
def get_serre(request):
    serre = Serre.objects.all().order_by('-created_at')[:50]
    serializer = SerreSerializer(serre, many=True)
    return Response(serializer.data)   

@api_view(['GET'])
def last_serre(request):
    lastserre = Serre.objects.latest('created_at')
    serializer = SerreSerializer(lastserre)
    return Response(serializer.data)

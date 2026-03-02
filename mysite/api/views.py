from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render
from .models import Serre
from .serializers import SerreSerializer
from datetime import datetime


CMD_FILE = '/tmp/serre_cmds.txt'

# 110 = fermé, 180 = ouvert
TOIT_CLOSED_ANGLE = 110
TOIT_OPEN_ANGLE = 180



@api_view(['POST'])
def sync_time(request):
    now = datetime.now()
    cmd = now.strftime("TIME:%H")

    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

def index(request):
    if request.method == "POST":
        valeur = request.POST.get("commande")
        if valeur:
            try:
                with open(CMD_FILE, 'a') as f:
                    f.write(valeur + '\n')
                print(f"[index] Command queued: {valeur}")
            except Exception as e:
                print(f"[index] Error: {e}")

    toit_ouvert = False
    try:
        latest = Serre.objects.latest('created_at')
        toit_ouvert = latest.servo >= TOIT_OPEN_ANGLE
    except Serre.DoesNotExist:
        pass

    return render(request, "index.html", {'toit': 1 if toit_ouvert else 0})


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


@api_view(['POST'])
def toit_cmd(request):
    action = request.data.get('action')

    if not action:
        return Response({'error': 'missing action'}, status=400)

    action = action.lower()
    if action not in ('open', 'close', 'stop'):
        return Response({'error': 'invalid action'}, status=400)

    cmd = f"TOIT:{action.upper()}"

    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
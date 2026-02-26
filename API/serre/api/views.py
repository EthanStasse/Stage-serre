from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render
from .models import Serre
from .serializers import SerreSerializer
import os

CMD_FILE = '/tmp/serre_cmds.txt'

# Simple variable to store roof state (0 = closed, 1 = open)
# In production, you might store this in DB or session
TOIT_STATE = 0


def index(request):
    global TOIT_STATE

    if request.method == "POST":
        valeur = request.POST.get("commande")
        if valeur:
            try:
                # Queue the command for Arduino
                with open(CMD_FILE, 'a') as f:
                    f.write(valeur + '\n')
                print(f"[index] Command queued: {valeur}")

                # Toggle the roof state
                if TOIT_STATE == 0:
                    TOIT_STATE = 1
                else:
                    TOIT_STATE = 0

            except Exception as e:
                print(f"[index] Error: {e}")

    # Pass the current roof state to the template
    return render(request, "index.html", {'toit': TOIT_STATE})


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
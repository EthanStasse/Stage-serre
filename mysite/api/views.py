from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Serre, Usr, Logs
from .serializers import SerreSerializer
from datetime import datetime
from django.contrib.auth.hashers import check_password
from .management.commands.logs import log
import json

CMD_FILE = '/tmp/serre_cmds.txt'

# 110 = fermé, 180 = ouvert
TOIT_CLOSED_ANGLE = 110
TOIT_OPEN_ANGLE = 180


# API pour synchroniser l'heure de l'Arduino avec celle du serveur
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


# Page de login pour accéder à l'interface de contrôle de la serre
@api_view(['GET', 'POST'])
def login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        raw_password = request.POST.get("password")
        try:
            user = Usr.objects.get(username=username)
            if check_password(raw_password, user.password):
                request.session['user_id'] = user.id
                request.session['username'] = user.username
                log(username, 'logged in')
                return redirect('index')
            else:
                raise Usr.DoesNotExist
        except Usr.DoesNotExist:
            return render(request, "login.html", {'error': 'Invalid username or password'})
    return render(request, "login.html")


# Page d'accueil qui affiche l'état du toit et permet d'envoyer des commandes à la serre
def index(request):
    # Check if user is logged in
    if 'user_id' not in request.session:
        return redirect('login')

    toit_ouvert = False
    led_state = False

    if request.method == "POST":
        # Handle JSON request from JS (toit open/close)
        if request.content_type == 'application/json':
            try:
                payload = json.loads(request.body.decode('utf-8'))
                action = payload.get('action', '').lower()
                if action not in ('open', 'close'):
                    return JsonResponse({'error': 'invalid action'}, status=400)
                if action == 'open':
                    log(request.session.get('username'), 'toit ouvert')
                    valeur = 'toit_1'
                else:
                    log(request.session.get('username'), 'toit fermé')
                    valeur = 'toit_0'
                with open(CMD_FILE, 'a') as f:
                    f.write(valeur + '\n')
                return JsonResponse({'status': 'queued', 'cmd': valeur})
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=500)

        # Handle form POST (buttons)
        valeur = request.POST.get("commande")
        if valeur:
            try:
                with open(CMD_FILE, 'a') as f:
                    f.write(valeur + '\n')
                print(f"[index] Command queued: {valeur}")
            except Exception as e:
                print(f"[index] Error: {e}")

    try:
        latest = Serre.objects.latest('created_at')
        toit_ouvert = latest.servo >= TOIT_OPEN_ANGLE
        led_state = (latest.led == 'ON')
    except Serre.DoesNotExist:
        pass

    # fetch recent logs
    recent_logs = Logs.objects.order_by('-created_at')[:10]
    # convert to simple strings for template
    log_lines = [
        f"{entry.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {entry.username} {entry.action}"
        for entry in recent_logs
    ]

    return render(request, "index.html", {
        'toit': 1 if toit_ouvert else 0,
        'led': 1 if led_state else 0,
        'log_lines': log_lines
    })


# API pour récupérer les données de la dernière mesure de la serre
@api_view(['GET'])
@permission_classes([AllowAny])
def last_serre(request):
    try:
        lastserre = Serre.objects.latest('created_at')
    except Serre.DoesNotExist:
        return Response({'error': 'no data yet'}, status=404)

    serializer = SerreSerializer(lastserre)

    # include recent log lines so the frontend can refresh the logs card
    recent_logs = Logs.objects.order_by('-created_at')[:10]
    log_lines = [
        f"{entry.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {entry.username} {entry.action}"
        for entry in recent_logs
    ]

    data = serializer.data
    data['logs'] = log_lines
    return Response(data)
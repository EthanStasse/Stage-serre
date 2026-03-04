from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render, redirect
from .models import Serre, Usr
from .serializers import SerreSerializer
from datetime import datetime
from django.contrib.auth.hashers import check_password
from .management.commands.logs import log
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
    
    if request.method == "POST":
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
    except Serre.DoesNotExist:
        pass

    # fetch recent logs
    from .models import Logs
    recent_logs = Logs.objects.order_by('-created_at')[:10]
    # convert to simple strings for template
    log_lines = [f"{log.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {log.username} {log.action}" for log in recent_logs]

    return render(request, "index.html", {'toit': 1 if toit_ouvert else 0, 'log_lines': log_lines})


# API pour récupérer les données de la dernière mesure de la serre
@api_view(['GET'])
def last_serre(request):
    lastserre = Serre.objects.latest('created_at')
    serializer = SerreSerializer(lastserre)

    # include recent log lines so the frontend can refresh the logs card
    from .models import Logs
    recent_logs = Logs.objects.order_by('-created_at')[:10]
    log_lines = [
        f"{log.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {log.username} {log.action}"
        for log in recent_logs
    ]

    data = serializer.data
    data['logs'] = log_lines
    return Response(data)


# API pour commander le toit de la serre (ouvrir, fermer)
@api_view(['POST'])
def toit_cmd(request):
    action = request.data.get('action')
    if action == "open":
        log(request.session.get('username'), 'toit ouvert')
    elif action == "close":
        log(request.session.get('username'), 'toit fermé')
    if not action:
        return Response({'error': 'missing action'}, status=400)

    action = action.lower()
    if action not in ('open', 'close'):
        return Response({'error': 'invalid action'}, status=400)
    # Arduino firmware expects 'toit_1' (open) and 'toit_0' (close)
    cmd_map = {'open': 'toit_1', 'close': 'toit_0'}
    cmd = cmd_map[action]

    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render, redirect
from .models import Serre, Usr
from .serializers import SerreSerializer
from datetime import datetime
from django.contrib.auth.hashers import check_password, make_password
from .management.commands.logs import log
from .models import Logs

CMD_FILE = '/tmp/serre_cmds.txt'

# 110 = fermé, 180 = ouvert
TOIT_CLOSED_ANGLE = 110
TOIT_OPEN_ANGLE = 180

CMD_MAP = {
    'led_on':  'led_1',
    'led_off': 'led_0',
    'toit_1':  'toit_1',
    'toit_0':  'toit_0',
}


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
            if valeur == 'led_on':
                log(request.session.get('username'), 'LED : on')
            elif valeur == 'led_off':
                log(request.session.get('username'), 'LED : off')
            elif valeur == 'toit_1':
                log(request.session.get('username'), 'toit ouvert')
            elif valeur == 'toit_0':
                log(request.session.get('username'), 'toit fermé')

            cmd = CMD_MAP.get(valeur, valeur)
            try:
                with open(CMD_FILE, 'a') as f:
                    f.write(cmd + '\n')
                print(f"[index] Command queued: {cmd}")
            except Exception as e:
                print(f"[index] Error: {e}")

    led_state = False
    try:
        latest = Serre.objects.latest('created_at')
        toit_ouvert = latest.servo >= TOIT_OPEN_ANGLE
        led_state = (latest.led == 'ON')
    except Serre.DoesNotExist:
        pass


    return render(request, "index.html", {
        'toit': 1 if toit_ouvert else 0,
        'led': 1 if led_state else 0,
    })

def logs(request):
    if 'user_id' not in request.session:
        return redirect('login')
    if request.session.get('username') != 'admin':
        if request.session.get('username'):
            log(request.session.get('username'), 'attempted to access logs')
            return redirect('index')
        else:
            return redirect('login')
            # fetch recent logs
    recent_logs = Logs.objects.order_by('-created_at')
    log_lines = [f"{log.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {log.username} {log.action}" for log in recent_logs]
    return render(request, "logs.html", {'logs': log_lines})

# API pour récupérer les données de la dernière mesure de la serre
@api_view(['GET'])
def last_serre(request):
    lastserre = Serre.objects.latest('created_at')
    serializer = SerreSerializer(lastserre)

    from .models import Logs
    recent_logs = Logs.objects.order_by('-created_at')
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
    cmd_map = {'open': 'toit_1', 'close': 'toit_0'}
    cmd = cmd_map[action]

    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# API pour commander la LED de la serre (allumer, éteindre)
@api_view(['POST'])
def led_cmd(request):
    action = request.data.get('action')
    if not action:
        return Response({'error': 'missing action'}, status=400)

    action = action.lower()
    if action not in ('on', 'off'):
        return Response({'error': 'invalid action'}, status=400)

    if action == 'on':
        log(request.session.get('username'), 'LED : on')
    else:
        log(request.session.get('username'), 'LED : off')

    cmd_map = {'on': 'led_1', 'off': 'led_0'}
    cmd = cmd_map[action]

    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def auto_manuel(request):
    mode = request.data.get('mode')
    if not mode:
        return Response({'error': 'missing mode'}, status=400)

    mode = mode.lower()
    if mode not in ('auto', 'manuel'):
        return Response({'error': 'invalid mode'}, status=400)

    if mode == 'auto':
        log(request.session.get('username'), 'mode auto')
        cmd = 'mode_auto'
    else:
        log(request.session.get('username'), 'mode manuel')
        cmd = 'mode_manuel'

    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
# Déconnexion de l'utilisateur
def logout(request):
    log(request.session.get('username'), 'logged out')
    request.session.flush()
    return redirect('login')

# Création de compte
def new_account(request):
    if request.method == "POST":
        username = request.POST.get("username")
        raw_password = request.POST.get("password")
        
        if not username or not raw_password:
            return render(request, "new_account.html", {'error': 'Username and password are required'})
        
        if Usr.objects.filter(username=username).exists():
            return render(request, "new_account.html", {'error': 'Username already exists'})
        
        password_hash = make_password(raw_password)
        Usr.objects.create(username=username, password=password_hash)
        log(username, 'account created')
        return redirect('login')
    
    return render(request, "new_account.html")  


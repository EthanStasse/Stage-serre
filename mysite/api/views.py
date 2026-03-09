from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render, redirect
from .models import Serre, Usr, Logs
from .serializers import SerreSerializer
from datetime import datetime
from django.contrib.auth.hashers import check_password, make_password
from .management.commands.logs import log

CMD_FILE = '/tmp/serre_cmds.txt'

TOIT_CLOSED_ANGLE = 110
TOIT_OPEN_ANGLE = 180
SESSION_TIMEOUT = 3600

CMD_MAP = {
    'led_on':  'led_1',
    'led_off': 'led_0',
    'toit_1':  'toit_1',
    'toit_0':  'toit_0',
}


def check_session(request):
    """Returns True if session is valid, False if expired or missing."""
    if 'user_id' not in request.session:
        return False
    login_time = request.session.get('login_time')
    if not login_time:
        return False
    elapsed = datetime.now().timestamp() - login_time
    if elapsed > SESSION_TIMEOUT:
        log(request.session.get('username'), 'session expired')
        request.session.flush()
        return False
    return True


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
                request.session['login_time'] = datetime.now().timestamp()
                log(username, 'logged in')
                return redirect('index')
            else:
                raise Usr.DoesNotExist
        except Usr.DoesNotExist:
            return render(request, "login.html", {'error': 'Invalid username or password'})
    return render(request, "login.html")


def index(request):
    if not check_session(request):
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
        'login_time': int(request.session.get('login_time', 0)),
    })


def logs(request):
    if not check_session(request):
        return redirect('login')
    if request.session.get('username') != 'admin':
        log(request.session.get('username'), 'attempted to access logs')
        return redirect('index')

    selected_user = request.GET.get('user_filter', '')
    users = Usr.objects.all()

    recent_logs = Logs.objects.order_by('-created_at')
    if selected_user:
        recent_logs = recent_logs.filter(username=selected_user)

    log_lines = [
        f"{l.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {l.username} {l.action}"
        for l in recent_logs
    ]

    return render(request, "logs.html", {
        'log_lines': log_lines,
        'users': users,
        'selected_user': selected_user,
    })


@api_view(['GET'])
def logs_api(request):
    if not check_session(request):
        return Response({'error': 'not authenticated'}, status=401)
    if request.session.get('username') != 'admin':
        return Response({'error': 'forbidden'}, status=403)

    selected_user = request.GET.get('user_filter', '')
    recent_logs = Logs.objects.order_by('-created_at')
    if selected_user:
        recent_logs = recent_logs.filter(username=selected_user)

    log_lines = [
        f"{l.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {l.username} {l.action}"
        for l in recent_logs
    ]
    return Response({'logs': log_lines})


@api_view(['GET'])
def last_serre(request):
    if not check_session(request):
        return Response({'error': 'not authenticated'}, status=401)
    lastserre = Serre.objects.latest('created_at')
    serializer = SerreSerializer(lastserre)

    recent_logs = Logs.objects.order_by('-created_at')[:10]
    log_lines = [
        f"{l.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {l.username} {l.action}"
        for l in recent_logs
    ]

    data = serializer.data
    data['logs'] = log_lines
    return Response(data)


@api_view(['POST'])
def toit_cmd(request):
    action = request.data.get('action')
    if not action:
        return Response({'error': 'missing action'}, status=400)

    action = action.lower()
    if action not in ('open', 'close'):
        return Response({'error': 'invalid action'}, status=400)

    if action == 'open':
        log(request.session.get('username', 'inconnu'), 'toit ouvert')
    else:
        log(request.session.get('username', 'inconnu'), 'toit fermé')

    cmd = {'open': 'toit_1', 'close': 'toit_0'}[action]
    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def led_cmd(request):
    action = request.data.get('action')
    if not action:
        return Response({'error': 'missing action'}, status=400)

    action = action.lower()
    if action not in ('on', 'off'):
        return Response({'error': 'invalid action'}, status=400)

    log(request.session.get('username', 'inconnu'), f'LED : {action}')

    cmd = {'on': 'led_1', 'off': 'led_0'}[action]
    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def pompe_cmd(request):
    action = request.data.get('action')
    if not action:
        return Response({'error': 'missing action'}, status=400)

    action = action.lower()
    if action not in ('on', 'off'):
        return Response({'error': 'invalid action'}, status=400)

    log(request.session.get('username', 'inconnu'), f'Pompe : {action}')

    cmd = {'on': 'pompe_on', 'off': 'pompe_off'}[action]
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

    log(request.session.get('username', 'inconnu'), f'mode {mode}')
    cmd = f'mode_{mode}'

    try:
        with open(CMD_FILE, 'a') as f:
            f.write(cmd + '\n')
        return Response({'status': 'queued', 'cmd': cmd})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


def logout(request):
    log(request.session.get('username'), 'logged out')
    try:
        with open(CMD_FILE, 'a') as f:
            f.write('mode_auto\n')
    except Exception as e:
        print(f"[logout] Error: {e}")
    request.session.flush()
    return redirect('login')


def new_account(request):
    if request.method == "POST":
        username = request.POST.get("username")
        raw_password = request.POST.get("password")

        if not username or not raw_password:
            return render(request, "new_account.html", {'error': 'Username and password are required'})

        if Usr.objects.filter(username=username).exists():
            return render(request, "new_account.html", {'error': 'Username already exists'})

        Usr.objects.create(username=username, password=make_password(raw_password))
        log(username, 'account created')
        return redirect('login')

    return render(request, "new_account.html")
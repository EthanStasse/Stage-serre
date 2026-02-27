import subprocess
import sys
import requests
import time

# --------------------------
# 1️⃣ Lancer la communication Arduino en local
# --------------------------
arduino_process = subprocess.Popen([sys.executable, "manage.py", "com_arduino"])
print("Arduino process started.")

# --------------------------
# 2️⃣ Vérifier que l'API Render est disponible
# --------------------------
API_URL = "https://serre-api.onrender.com"  # Remplace par ton URL Render

def wait_for_api(url, timeout=30):
    import requests
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url)
            if r.status_code == 200:
                print("API Render is online!")
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
    print("API Render not reachable.")
    return False

wait_for_api(API_URL)

# --------------------------
# 3️⃣ Lancer Django local (optionnel, pour tests locaux)
# --------------------------
# Si tu veux lancer Django en local, décommente :
# django_process = subprocess.Popen([sys.executable, "manage.py", "runserver", "0.0.0.0:8000"])
# django_process.wait()

# --------------------------
# 4️⃣ Stop Arduino proprement à la fin (si nécessaire)
# --------------------------
# arduino_process.terminate()
# arduino_process.wait()
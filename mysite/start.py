import subprocess
import sys

arduino = subprocess.Popen([sys.executable, "manage.py", "com_arduino"])
django = subprocess.Popen([sys.executable, "manage.py", "runserver", "0.0.0.0:8000"])

django.wait()
arduino.terminate()
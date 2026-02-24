# Stage-serre

python -m venv Path\venv
venv\Scripts\activate
python.exe -m pip install --upgrade pip
pip install pyserial
py -m pip install Django==6.0.2
django-admin startproject serre serre_API
dans serre_API : 
python manage.py runserver 0.0.0.0:8000

usr:pi
mdp:pi

ip Raspberry : 
http://192.168.0.10:8000/polls/
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install Django==6.0.2

python3 manage.py makemigrations
python3 manage.py migrate

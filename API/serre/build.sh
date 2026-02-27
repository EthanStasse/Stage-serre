#!/usr/bin/env bash

# Installer les dépendances
pip install -r requirements.txt

# Collecte des fichiers statiques
python manage.py collectstatic --noinput

# Appliquer les migrations
python manage.py migrate

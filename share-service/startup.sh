#!/bin/bash
set -e

echo ">>> INSTALL START"
python -m pip install --upgrade pip
python -m pip install --no-cache-dir -r requirements.txt

echo ">>> MIGRATE"
python manage.py migrate --noinput

echo ">>> RUN APP"
exec gunicorn share_service.wsgi:application --bind=0.0.0.0:8000
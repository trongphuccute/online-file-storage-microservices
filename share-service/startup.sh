#!/bin/bash
set -e

pip install -r requirements.txt

python manage.py migrate --noinput

gunicorn share_service.wsgi:application --bind=0.0.0.0:8000
``
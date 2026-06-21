#!/bin/sh
set -e
python manage.py migrate --noinput
gunicorn share_service.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120

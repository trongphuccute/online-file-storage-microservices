#!/bin/sh
set -e
mkdir -p media/uploads
python manage.py migrate --noinput
gunicorn file_service.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120

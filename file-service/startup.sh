#!/bin/sh
python manage.py migrate
gunicorn file_service.wsgi:application --bind 0.0.0.0:${PORT:-8000}

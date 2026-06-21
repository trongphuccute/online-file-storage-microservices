import sys
import os
from pathlib import Path

# Add auth-service to path and setup Django
sys.path.insert(0, str(Path("auth-service").resolve()))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "auth_service.settings")

import django
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# Generate token
user = User.objects.first()
if not user:
    user = User.objects.create_user(username="testuser_temp")
    print(f"Created temporary user: {user.username}")
else:
    print(f"Using existing user: {user.username}")

refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
print(f"Generated Token: {access_token}")

# Now switch settings and environment to file-service
# Remove auth-service path and insert file-service path
sys.path.remove(str(Path("auth-service").resolve()))
sys.path.insert(0, str(Path("file-service").resolve()))

# Reset django settings
from django.conf import settings
# We need to re-initialize settings for file-service
# In Django, settings cannot be easily reconfigured after they are loaded once,
# so we will run the validation phase in a separate subprocess, or we can just print the signing keys.
print("\n--- Keys comparison ---")
print("Auth Service SECRET_KEY:", settings.SECRET_KEY)

# Let's import the file-service settings directly by reading the file or using importlib
import importlib.util
spec = importlib.util.spec_from_file_location("file_settings", "file-service/file_service/settings.py")
file_settings = importlib.util.module_from_spec(spec)
spec.loader.exec_module(file_settings)
print("File Service SECRET_KEY:", file_settings.SECRET_KEY)
print("File Service SIMPLE_JWT SIGNING_KEY:", file_settings.SIMPLE_JWT.get("SIGNING_KEY"))

# Now let's try to decode using PyJWT directly with the file-service signing key
import jwt
print("\n--- Decoding with PyJWT directly ---")
try:
    decoded = jwt.decode(access_token, file_settings.SIMPLE_JWT.get("SIGNING_KEY"), algorithms=["HS256"])
    print("Decoded successfully! Claims:", decoded)
except Exception as e:
    print("Decoding failed with file-service key:", str(e), type(e))

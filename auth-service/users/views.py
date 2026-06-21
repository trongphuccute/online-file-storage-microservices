import os

import requests
from django.contrib.auth.models import User
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import UserProfile
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainSerializer,
    RegisterSerializer,
    UserSerializer,
)

FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://localhost:8002/api").rstrip("/")


def _require_admin(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    return profile.role == UserProfile.ROLE_ADMIN


def _admin_block():
    return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    return Response({"service": "auth-service", "status": "ok"})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def profile(request):
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
def logout(request):
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        return Response({"detail": "Token is invalid or already blacklisted."}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


@api_view(["POST"])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data["new_password"])
    request.user.save()
    return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


@api_view(["GET"])
def admin_users(request):
    if not _require_admin(request):
        return _admin_block()

    users = list(User.objects.select_related().all().order_by("username"))
    stats = {}
    try:
        response = requests.get(f"{FILE_SERVICE_URL}/admin/users/", headers={"Authorization": request.headers.get("Authorization", "")}, timeout=8)
        if response.status_code == 200:
            for item in response.json():
                stats[int(item["user_id"])] = item
    except Exception:
        pass

    DEFAULT_QUOTA = 1024 * 1024 * 1024  # 1 GB — matches file-service DEFAULT_USER_QUOTA_BYTES

    rows = []
    for user in users:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        item = stats.get(user.id, {})
        rows.append(
            {
                "id": user.id,
                "username": user.username,
                "role": profile.role,
                "image_count": int(item.get("image_count", 0)),
                "storage_used": int(item.get("storage_used", 0)),
                "storage_quota": int(item.get("storage_quota") or DEFAULT_QUOTA),
            }
        )
    return Response(rows)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainSerializer

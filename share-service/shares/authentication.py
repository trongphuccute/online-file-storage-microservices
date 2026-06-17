"""
Custom JWT authentication for share-service.
Không query DB User — dùng user_id trực tiếp từ JWT payload.
"""
from __future__ import annotations

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class VirtualUser:
    is_active = True
    is_staff = False
    is_superuser = False
    is_anonymous = False
    is_authenticated = True

    def __init__(self, user_id: int, username: str = ""):
        self.id = user_id
        self.pk = user_id
        self.username = username

    def __str__(self):
        return f"VirtualUser(id={self.id})"


class JWTAuthenticationFromPayload(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
        except KeyError:
            raise InvalidToken("Token contained no recognizable user identification")
        username = validated_token.get("username", "")
        return VirtualUser(user_id=int(user_id), username=username)

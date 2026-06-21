"""
Custom JWT authentication for file-service.

SimpleJWT mặc định tìm User trong DB sau khi verify token.
File-service không có bảng User (chỉ auth-service mới có).
Class này verify token hợp lệ rồi trả về một "virtual user" object
mang user_id từ JWT payload — không query DB.
"""
from __future__ import annotations

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class VirtualUser:
    """
    Lightweight user object built from JWT payload.
    Đủ interface để DRF permission classes hoạt động.
    Không map sang bất kỳ DB row nào.
    """

    is_active = True
    is_staff = False
    is_superuser = False
    is_anonymous = False
    is_authenticated = True

    def __init__(self, user_id: int, username: str = "", role: str = "user"):
        self.id = user_id
        self.pk = user_id
        self.username = username
        self.role = role
        self.is_staff = role == "admin"

    def __str__(self):
        return f"VirtualUser(id={self.id})"


class JWTAuthenticationFromPayload(JWTAuthentication):
    """
    Override get_user() để trả VirtualUser từ token payload
    thay vì query DB.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
        except Exception as e:
            print("--- JWT VALIDATION ERROR ---")
            print("Exception:", str(e), type(e))
            token_str = raw_token.decode('utf-8') if isinstance(raw_token, bytes) else raw_token
            print("Raw Token:", token_str)
            try:
                import jwt
                unverified = jwt.decode(token_str, options={"verify_signature": False})
                print("Unverified Payload:", unverified)
            except Exception as e2:
                print("Failed unverified decode:", str(e2))
            print("----------------------------")
            raise e
        return self.get_user(validated_token), validated_token

    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
        except KeyError:
            raise InvalidToken("Token contained no recognizable user identification")

        username = validated_token.get("username", "")
        role = validated_token.get("role", "user")
        return VirtualUser(user_id=int(user_id), username=username, role=role)

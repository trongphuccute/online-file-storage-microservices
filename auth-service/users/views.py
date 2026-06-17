from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    RegisterSerializer,
    UserSerializer,
)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    return Response({"service": "auth-service", "status": "ok"})


from rest_framework.decorators import throttle_classes
from rest_framework.throttling import AnonRateThrottle

class RegisterThrottle(AnonRateThrottle):
    scope = 'register'

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([RegisterThrottle])
def register(request):
    # Sanitize and trim request data
    data = {}
    for key, value in request.data.items():
        if isinstance(value, str):
            data[key] = value.strip()
        else:
            data[key] = value

    serializer = RegisterSerializer(data=data)
    if not serializer.is_valid():
        # Get first error message for descriptive message
        error_msg = "Validation failed."
        if serializer.errors:
            first_field = next(iter(serializer.errors))
            first_err = serializer.errors[first_field]
            error_msg = first_err[0] if isinstance(first_err, list) else str(first_err)
            
        return Response(
            {
                "success": False,
                "message": error_msg,
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    user = serializer.save()

    # Trả về JWT token ngay sau khi register, frontend không cần login lại
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "success": True,
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
    """
    Nhận refresh token, đưa vào blacklist để vô hiệu hoá.
    Body: { "refresh": "<refresh_token>" }
    """
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response(
            {"detail": "Refresh token is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        return Response(
            {"detail": "Token is invalid or already blacklisted."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


@api_view(["POST"])
def change_password(request):
    """
    Đổi mật khẩu khi đã đăng nhập.
    Body: { "old_password": "...", "new_password": "..." }
    """
    serializer = ChangePasswordSerializer(
        data=request.data, context={"request": request}
    )
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data["new_password"])
    request.user.save()
    return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login view trả thêm username và email vào response."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            from django.contrib.auth.models import User
            username = request.data.get("username", "")
            try:
                user = User.objects.get(username=username)
                response.data["username"] = user.username
                response.data["email"] = user.email
                response.data["user_id"] = user.id
            except User.DoesNotExist:
                pass
        return response

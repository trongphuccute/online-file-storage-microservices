from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .serializers import RegisterSerializer, UserSerializer


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
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def profile(request):
    return Response(UserSerializer(request.user).data)

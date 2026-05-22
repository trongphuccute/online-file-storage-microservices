from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import ShareLink
from .serializers import ShareLinkSerializer


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    return Response({"service": "share-service", "status": "ok"})


@api_view(["POST"])
def create_share_link(request):
    serializer = ShareLinkSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    share = serializer.save(owner_id=request.user.id)
    return Response(ShareLinkSerializer(share).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def my_share_links(request):
    links = ShareLink.objects.filter(owner_id=request.user.id)
    return Response(ShareLinkSerializer(links, many=True).data)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def public_share(request, token):
    share = ShareLink.objects.filter(token=token, is_active=True).first()
    if not share:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if share.expires_at and share.expires_at <= timezone.now():
        return Response({"detail": "Share link expired."}, status=status.HTTP_410_GONE)
    return Response(ShareLinkSerializer(share).data)

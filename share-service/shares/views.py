import logging
import os
from datetime import datetime

import requests
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import ShareLink
from .serializers import ShareLinkSerializer

logger = logging.getLogger(__name__)

# Config cho integration với file-service
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://localhost:8002/api")


def verify_file_exists(file_id: int, access_token: str) -> bool:
    """Verify file tồn tại ở file-service. file_id là int."""
    try:
        response = requests.get(
            f"{FILE_SERVICE_URL}/files/",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5,
        )
        if response.status_code != 200:
            return False
        files = response.json()
        # id từ file-service có thể là int hoặc string — so sánh sau khi ép kiểu
        return any(int(f.get("id", -1)) == file_id for f in files)
    except Exception as e:
        logger.warning(f"Error verifying file {file_id}: {str(e)}")
        # Nếu file-service down, cho phép tạo share (fail gracefully)
        return True


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    return Response({"service": "share-service", "status": "ok"})


@api_view(["POST"])
def create_share_link(request):
    """Tạo public share link cho file"""
    serializer = ShareLinkSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    file_id = serializer.validated_data.get("file_id")
    expires_at = serializer.validated_data.get("expires_at")

    # Validate expires_at không được quá khứ
    if expires_at and expires_at <= timezone.now():
        return Response(
            {"detail": "expires_at cannot be in the past."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify file tồn tại
    token = request.auth
    if not verify_file_exists(file_id, str(token)):
        return Response(
            {"detail": f"File {file_id} not found or not accessible."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Tạo share link
    share = serializer.save(owner_id=request.user.id)
    logger.info(
        f"Share link created: {share.token} for file {file_id} by user {request.user.id}"
    )
    return Response(ShareLinkSerializer(share).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def my_share_links(request):
    """Danh sách share link của user"""
    try:
        links = ShareLink.objects.filter(owner_id=request.user.id).order_by("-created_at")
        return Response(ShareLinkSerializer(links, many=True).data)
    except Exception as e:
        logger.error(f"Error fetching share links for user {request.user.id}: {str(e)}")
        return Response(
            {"detail": "Error fetching share links."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "PATCH", "DELETE"])
def share_link_detail(request, token):
    """Chi tiết, cập nhật, xóa share link (owner only)"""
    try:
        share = ShareLink.objects.get(token=token, owner_id=request.user.id)
    except ShareLink.DoesNotExist:
        return Response(
            {"detail": "Share link not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        """Xem chi tiết share link"""
        return Response(ShareLinkSerializer(share).data)

    elif request.method == "PATCH":
        """Cập nhật share link (toggle active, update expires_at)"""
        # Validate expires_at nếu có
        expires_at = request.data.get("expires_at")
        if expires_at is not None:
            expires_dt = (
                datetime.fromisoformat(expires_at)
                if isinstance(expires_at, str)
                else expires_at
            )
            if expires_dt <= timezone.now():
                return Response(
                    {"detail": "expires_at cannot be in the past."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = ShareLinkSerializer(share, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        logger.info(f"Share link {token} updated by user {request.user.id}")
        return Response(serializer.data)

    elif request.method == "DELETE":
        """Xóa share link"""
        file_id = share.file_id
        share.delete()
        logger.info(f"Share link {token} deleted by user {request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def public_share(request, token):
    """Xem public share (không cần JWT)"""
    try:
        share = ShareLink.objects.get(token=token, is_active=True)
    except ShareLink.DoesNotExist:
        return Response(
            {"detail": "Share link not found or inactive."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check nếu share link hết hạn
    if share.expires_at and share.expires_at <= timezone.now():
        logger.info(f"Access to expired share link: {token}")
        return Response(
            {"detail": "Share link expired."},
            status=status.HTTP_410_GONE,
        )

    # Call file-service to fetch file details
    file_info = {}
    try:
        response = requests.get(f"{FILE_SERVICE_URL}/files/{share.file_id}/", timeout=5)
        if response.status_code == 200:
            file_info = response.json()
        else:
            logger.warning(f"File service returned status {response.status_code} for file {share.file_id}")
    except Exception as e:
        logger.error(f"Error fetching file details from file-service for file {share.file_id}: {str(e)}")

    logger.info(f"Public share accessed: {token}")
    data = ShareLinkSerializer(share).data
    data["file_info"] = file_info
    return Response(data)

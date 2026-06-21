import logging
import os
from datetime import datetime

import requests
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import ShareLink
from .serializers import (
    ShareLinkSerializer,
    CreateShareLinkSerializer,
    ShareLinkDetailSerializer,
)


class ShareLinkPagination(PageNumberPagination):
    """Phân trang cho danh sách chia sẻ"""
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

logger = logging.getLogger(__name__)

# Config cho integration với file-service
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://localhost:8002/api")
if FILE_SERVICE_URL and not FILE_SERVICE_URL.rstrip("/").endswith("/api"):
    FILE_SERVICE_URL = FILE_SERVICE_URL.rstrip("/") + "/api"


def _public_file_meta_from_payload(payload: dict) -> dict:
    return {
        "url": payload.get("url", ""),
        "downloadUrl": payload.get("downloadUrl") or payload.get("download_url") or payload.get("url", ""),
        "name": payload.get("name") or payload.get("original_name") or "",
        "size": payload.get("size", 0),
        "type": payload.get("type") or payload.get("content_type") or "application/octet-stream",
        "createdAt": payload.get("createdAt") or payload.get("created_at") or "",
    }



def verify_file_exists(file_id: int, access_token: str) -> bool:
    """
    Verify file tồn tại ở file-service bằng cách gọi GET /files/<id>/.
    Trả True nếu file tồn tại và thuộc về user, False nếu 404.
    Fail gracefully nếu file-service down.
    """
    try:
        response = requests.get(
            f"{FILE_SERVICE_URL}/files/{file_id}/",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5,
        )
        return response.status_code == 200
    except Exception as e:
        logger.warning(f"Error verifying file {file_id}: {str(e)}")
        # Nếu file-service down, cho phép tạo share (fail gracefully)
        return True


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    """Kiểm tra sức khỏe dịch vụ"""
    return Response({
        "service": "share-service",
        "status": "ok",
        "version": "1.1"
    })


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
    file_info = {}
    try:
        response = requests.get(
            f"{FILE_SERVICE_URL}/files/{file_id}/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
        if response.status_code == 200:
            file_info = response.json()
    except Exception as e:
        logger.warning(f"Error fetching file metadata for {file_id}: {str(e)}")

    share = serializer.save(
        owner_id=request.user.id,
        file_metadata=_public_file_meta_from_payload(file_info),
    )
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

    file_info = _public_file_meta_from_payload(share.file_metadata or {})
    try:
        if not file_info.get("url"):
            response = requests.get(f"{FILE_SERVICE_URL}/files/{share.file_id}/public/", timeout=5)
            if response.status_code == 200:
                file_info = _public_file_meta_from_payload(response.json())
            else:
                logger.warning(
                    f"File service returned status {response.status_code} for file {share.file_id}"
                )
    except Exception as e:
        logger.error(
            f"Error fetching file details from file-service for file {share.file_id}: {str(e)}"
        )

    if not file_info.get("url"):
        return Response({"detail": "File not found."}, status=status.HTTP_404_NOT_FOUND)

    if not file_info.get("downloadUrl"):
        file_info["downloadUrl"] = f"{file_info['url']}?download=1"

    try:
        share.increment_access_count()
    except Exception as e:
        logger.warning(f"Failed to update access count for share {token}: {str(e)}")

    logger.info(f"Public share accessed: {token}")
    return Response(file_info)

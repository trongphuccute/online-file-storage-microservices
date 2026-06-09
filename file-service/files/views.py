import uuid

from django.conf import settings
from django.db.models import Sum
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .blob_storage import delete_blob, upload_blob
from .models import StoredFile, UserQuota
from .serializers import StoredFileSerializer


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    return Response({"service": "file-service", "status": "ok"})


@api_view(["GET"])
def list_files(request):
    files = StoredFile.objects.filter(owner_id=request.user.id)
    return Response(StoredFileSerializer(files, many=True, context={"request": request}).data)


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_file(request):
    uploaded = request.FILES.get("file")
    if not uploaded:
        return Response({"detail": "Missing file field."}, status=status.HTTP_400_BAD_REQUEST)

    quota, _ = UserQuota.objects.get_or_create(user_id=request.user.id)
    used = (
        StoredFile.objects.filter(owner_id=request.user.id).aggregate(total=Sum("size"))[
            "total"
        ]
        or 0
    )
    if used + uploaded.size > quota.limit_bytes:
        return Response({"detail": "Quota exceeded."}, status=status.HTTP_400_BAD_REQUEST)

    blob_name = f"{request.user.id}/{uuid.uuid4()}-{uploaded.name}"
    upload_blob(blob_name, uploaded)
    item = StoredFile.objects.create(
        owner_id=request.user.id,
        original_name=uploaded.name,
        blob_name=blob_name,
        content_type=uploaded.content_type or "",
        size=uploaded.size,
    )
    return Response(StoredFileSerializer(item, context={"request": request}).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "DELETE"])
@permission_classes([permissions.AllowAny])
def file_detail(request, file_id):
    if request.method == "GET":
        item = StoredFile.objects.filter(id=file_id).first()
        if not item:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(StoredFileSerializer(item, context={"request": request}).data)

    elif request.method == "DELETE":
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        item = StoredFile.objects.filter(id=file_id, owner_id=request.user.id).first()
        if not item:
            return Response(status=status.HTTP_404_NOT_FOUND)
        delete_blob(item.blob_name)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def quota(request):
    quota_obj, _ = UserQuota.objects.get_or_create(user_id=request.user.id)
    used = (
        StoredFile.objects.filter(owner_id=request.user.id).aggregate(total=Sum("size"))[
            "total"
        ]
        or 0
    )
    return Response(
        {
            "used_bytes": used,
            "limit_bytes": quota_obj.limit_bytes or settings.DEFAULT_USER_QUOTA_BYTES,
        }
    )

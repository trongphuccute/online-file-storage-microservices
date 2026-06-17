"""
file-service views — photo management upgrade
Handles: upload (validate + thumbnail), list (paginate + filter),
         download (streaming), delete, rename, move, thumbnail,
         album CRUD, quota (cached used_bytes).
"""
from __future__ import annotations

import io
import os
import uuid
from datetime import datetime, timezone

from django.conf import settings
from django.db.models import F, Q
from django.http import StreamingHttpResponse
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .blob_storage import delete_blob, iter_blob, upload_blob
from .models import Album, StoredFile, UserQuota
from .serializers import AlbumSerializer, StoredFileSerializer

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
}

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif",
    ".webp", ".bmp", ".tiff", ".tif", ".svg",
}

THUMBNAIL_MAX_EDGE = 400
THUMBNAIL_FORMAT = "JPEG"
THUMBNAIL_CONTENT_TYPE = "image/jpeg"
THUMBNAIL_EXTENSION = "_thumb.jpg"

PAGE_SIZE_DEFAULT = 20
PAGE_SIZE_MAX = 100


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_image(uploaded):
    """Return error string or None if valid."""
    mime = (uploaded.content_type or "").lower().split(";")[0].strip()
    if mime not in ALLOWED_MIME_TYPES:
        return f"File type '{mime}' is not allowed. Accepted: {', '.join(sorted(ALLOWED_MIME_TYPES))}"

    ext = os.path.splitext(uploaded.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return f"File extension '{ext}' is not allowed. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"

    # Check MIME ↔ extension mismatch (e.g. .jpg with image/png)
    mime_ext_map = {
        "image/jpeg": {".jpg", ".jpeg"},
        "image/png": {".png"},
        "image/gif": {".gif"},
        "image/webp": {".webp"},
        "image/bmp": {".bmp"},
        "image/tiff": {".tiff", ".tif"},
        "image/svg+xml": {".svg"},
    }
    expected_exts = mime_ext_map.get(mime, set())
    if expected_exts and ext not in expected_exts:
        return f"MIME type '{mime}' does not match file extension '{ext}'."

    return None


def _make_thumb_blob_name(blob_name: str) -> str:
    """my/path/uuid-photo.jpg  →  my/path/uuid-photo_thumb.jpg"""
    base, _ = os.path.splitext(blob_name)
    return base + THUMBNAIL_EXTENSION


def _generate_thumbnail(file_obj) -> bytes | None:
    """Return JPEG thumbnail bytes or None on failure (SVG skipped silently)."""
    try:
        from PIL import Image

        file_obj.seek(0)
        img = Image.open(file_obj)

        # SVG is vector — skip thumbnail
        if getattr(img, "format", "") == "SVG":
            return None

        img = img.convert("RGB")
        img.thumbnail((THUMBNAIL_MAX_EDGE, THUMBNAIL_MAX_EDGE), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format=THUMBNAIL_FORMAT, quality=85, optimize=True)
        return buf.getvalue()
    except Exception:
        return None


def _get_quota(user_id: int) -> UserQuota:
    quota, _ = UserQuota.objects.get_or_create(
        user_id=user_id,
        defaults={"used_bytes": 0, "limit_bytes": settings.DEFAULT_USER_QUOTA_BYTES},
    )
    return quota


def _paginate(queryset, request):
    """Simple manual pagination. Returns (page_data, meta_dict)."""
    try:
        page = max(1, int(request.query_params.get("page", 1)))
    except (ValueError, TypeError):
        page = 1

    try:
        page_size = min(
            PAGE_SIZE_MAX,
            max(1, int(request.query_params.get("page_size", PAGE_SIZE_DEFAULT))),
        )
    except (ValueError, TypeError):
        page_size = PAGE_SIZE_DEFAULT

    total = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size
    results = queryset[start:end]

    base_url = request.build_absolute_uri(request.path)
    params = request.query_params.copy()

    def page_url(p):
        params["page"] = p
        params["page_size"] = page_size
        return base_url + "?" + params.urlencode()

    return results, {
        "count": total,
        "next": page_url(page + 1) if end < total else None,
        "previous": page_url(page - 1) if page > 1 else None,
    }


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    return Response({"service": "file-service", "status": "ok"})


# ---------------------------------------------------------------------------
# List & Upload
# ---------------------------------------------------------------------------

@api_view(["GET"])
def list_files(request):
    qs = StoredFile.objects.filter(owner_id=request.user.id)

    # --- filters ---
    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(original_name__icontains=search)

    album_id = request.query_params.get("album_id")
    if album_id is not None:
        try:
            album_id = int(album_id)
        except (ValueError, TypeError):
            return Response(
                {"detail": "album_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not Album.objects.filter(id=album_id, owner_id=request.user.id).exists():
            return Response(
                {"detail": "Album not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = qs.filter(album_id=album_id)

    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")
    if date_from:
        try:
            qs = qs.filter(created_at__date__gte=datetime.fromisoformat(date_from).date())
        except ValueError:
            return Response(
                {"detail": "date_from must be ISO 8601 format (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    if date_to:
        try:
            qs = qs.filter(created_at__date__lte=datetime.fromisoformat(date_to).date())
        except ValueError:
            return Response(
                {"detail": "date_to must be ISO 8601 format (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    results, meta = _paginate(qs, request)
    return Response({
        **meta,
        "results": StoredFileSerializer(results, many=True).data,
    })


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_file(request):
    uploaded = request.FILES.get("file")
    if not uploaded:
        return Response(
            {"detail": "Missing file field."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if uploaded.size <= 0:
        return Response(
            {"detail": "File is empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if uploaded.size > settings.MAX_UPLOAD_FILE_BYTES:
        return Response(
            {
                "detail": "File is too large.",
                "max_upload_file_bytes": settings.MAX_UPLOAD_FILE_BYTES,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --- image validation ---
    err = _validate_image(uploaded)
    if err:
        return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)

    # --- optional album ---
    album = None
    album_id_raw = request.data.get("album_id")
    if album_id_raw:
        try:
            album = Album.objects.get(id=int(album_id_raw), owner_id=request.user.id)
        except (Album.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Album not found or does not belong to you."},
                status=status.HTTP_404_NOT_FOUND,
            )

    # --- quota check (cached used_bytes) ---
    quota = _get_quota(request.user.id)
    if quota.used_bytes + uploaded.size > quota.limit_bytes:
        return Response(
            {"detail": "Quota exceeded."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --- upload original ---
    blob_name = f"{request.user.id}/{uuid.uuid4()}-{uploaded.name}"
    upload_blob(blob_name, uploaded)

    # --- generate & upload thumbnail ---
    thumb_blob = None
    thumb_bytes = _generate_thumbnail(uploaded)
    if thumb_bytes:
        thumb_blob = _make_thumb_blob_name(blob_name)
        upload_blob(thumb_blob, io.BytesIO(thumb_bytes))

    # --- save metadata ---
    item = StoredFile.objects.create(
        owner_id=request.user.id,
        original_name=uploaded.name,
        blob_name=blob_name,
        thumb_name=thumb_blob,
        content_type=uploaded.content_type or "",
        size=uploaded.size,
        album=album,
    )

    # --- atomic quota update ---
    UserQuota.objects.filter(user_id=request.user.id).update(
        used_bytes=F("used_bytes") + uploaded.size
    )

    return Response(StoredFileSerializer(item).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Download (streaming)
# ---------------------------------------------------------------------------

@api_view(["GET"])
def download_file(request, file_id):
    item = StoredFile.objects.filter(id=file_id, owner_id=request.user.id).first()
    if not item:
        return Response(status=status.HTTP_404_NOT_FOUND)

    response = StreamingHttpResponse(
        iter_blob(item.blob_name),
        content_type=item.content_type or "application/octet-stream",
    )
    response["Content-Disposition"] = (
        f'attachment; filename="{item.original_name}"'
    )
    return response


# ---------------------------------------------------------------------------
# Thumbnail
# ---------------------------------------------------------------------------

@api_view(["GET"])
def thumbnail_file(request, file_id):
    item = StoredFile.objects.filter(id=file_id, owner_id=request.user.id).first()
    if not item:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if not item.thumb_name:
        return Response(
            {"detail": "Thumbnail not available for this photo."},
            status=status.HTTP_404_NOT_FOUND,
        )

    response = StreamingHttpResponse(
        iter_blob(item.thumb_name),
        content_type=THUMBNAIL_CONTENT_TYPE,
    )
    response["Content-Disposition"] = (
        f'inline; filename="{os.path.splitext(item.original_name)[0]}_thumb.jpg"'
    )
    return response


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@api_view(["GET"])
def file_detail(request, file_id):
    """
    GET /files/<id>/ — trả metadata của 1 file.
    Dùng bởi share-service để verify file tồn tại.
    Chỉ owner mới xem được (JWT required).
    """
    item = StoredFile.objects.filter(id=file_id, owner_id=request.user.id).first()
    if not item:
        return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(StoredFileSerializer(item).data)


@api_view(["DELETE"])
def delete_file(request, file_id):
    item = StoredFile.objects.filter(id=file_id, owner_id=request.user.id).first()
    if not item:
        return Response(status=status.HTTP_404_NOT_FOUND)

    size = item.size
    delete_blob(item.blob_name)
    if item.thumb_name:
        delete_blob(item.thumb_name)
    item.delete()

    # atomic quota decrement (guard against going below 0)
    UserQuota.objects.filter(user_id=request.user.id, used_bytes__gte=size).update(
        used_bytes=F("used_bytes") - size
    )

    return Response(status=status.HTTP_204_NO_CONTENT)
# ---------------------------------------------------------------------------
# Rename
# ---------------------------------------------------------------------------

@api_view(["PATCH"])
def rename_file(request, file_id):
    item = StoredFile.objects.filter(id=file_id, owner_id=request.user.id).first()
    if not item:
        return Response(status=status.HTTP_404_NOT_FOUND)

    new_name = request.data.get("name", "").strip()
    if not new_name:
        return Response(
            {"detail": "name is required and cannot be blank."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(new_name) > 255:
        return Response(
            {"detail": "name must not exceed 255 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # preserve original extension
    _, ext = os.path.splitext(item.original_name)
    stem, new_ext = os.path.splitext(new_name)
    # if user already added the correct extension, keep it; otherwise append
    if new_ext.lower() == ext.lower():
        final_name = new_name
    else:
        final_name = stem + ext

    item.original_name = final_name
    item.save(update_fields=["original_name"])
    return Response(StoredFileSerializer(item).data)


# ---------------------------------------------------------------------------
# Move to album
# ---------------------------------------------------------------------------

@api_view(["PATCH"])
def move_file(request, file_id):
    item = StoredFile.objects.filter(id=file_id, owner_id=request.user.id).first()
    if not item:
        return Response(status=status.HTTP_404_NOT_FOUND)

    album_id_raw = request.data.get("album_id")
    if album_id_raw is None:
        # move to "no album"
        item.album = None
        item.save(update_fields=["album"])
        return Response(StoredFileSerializer(item).data)

    try:
        album = Album.objects.get(id=int(album_id_raw), owner_id=request.user.id)
    except (Album.DoesNotExist, ValueError, TypeError):
        return Response(
            {"detail": "Album not found or does not belong to you."},
            status=status.HTTP_404_NOT_FOUND,
        )

    item.album = album
    item.save(update_fields=["album"])
    return Response(StoredFileSerializer(item).data)


# ---------------------------------------------------------------------------
# Quota
# ---------------------------------------------------------------------------

@api_view(["GET"])
def quota(request):
    quota_obj = _get_quota(request.user.id)
    return Response(
        {
            "used_bytes": quota_obj.used_bytes,
            "limit_bytes": quota_obj.limit_bytes,
        }
    )


# ---------------------------------------------------------------------------
# Albums
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
def album_list(request):
    if request.method == "GET":
        albums = Album.objects.filter(owner_id=request.user.id)
        return Response(AlbumSerializer(albums, many=True).data)

    # POST — create
    name = request.data.get("name", "").strip()
    if not name:
        return Response(
            {"detail": "name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(name) > 100:
        return Response(
            {"detail": "name must not exceed 100 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    description = request.data.get("description", "").strip()
    album = Album.objects.create(
        owner_id=request.user.id, name=name, description=description
    )
    return Response(AlbumSerializer(album).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
def album_detail(request, album_id):
    album = Album.objects.filter(id=album_id, owner_id=request.user.id).first()
    if not album:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(AlbumSerializer(album).data)

    if request.method == "PATCH":
        name = request.data.get("name", album.name).strip()
        if not name:
            return Response(
                {"detail": "name cannot be blank."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(name) > 100:
            return Response(
                {"detail": "name must not exceed 100 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        description = request.data.get("description", album.description).strip()
        album.name = name
        album.description = description
        album.save(update_fields=["name", "description"])
        return Response(AlbumSerializer(album).data)

    # DELETE — disassociate photos, then delete album
    album.photos.update(album=None)
    album.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

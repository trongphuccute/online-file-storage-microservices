"""
Tests for file-service photo management upgrade.
Run with: python manage.py test files
Uses Django's test client + SimpleJWT token injection — no real storage I/O.
"""
from __future__ import annotations

import io
from unittest.mock import MagicMock, patch

from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Album, StoredFile, UserQuota


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_image_bytes(fmt="PNG") -> bytes:
    """Return minimal in-memory image bytes using Pillow."""
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color=(255, 0, 0))
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf.read()


def _make_upload_file(name="photo.jpg", mime="image/jpeg", content: bytes | None = None):
    from django.core.files.uploadedfile import SimpleUploadedFile
    data = content or _make_image_bytes("JPEG")
    return SimpleUploadedFile(name, data, content_type=mime)


def _auth_client(user: User) -> APIClient:
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


# patch targets
UPLOAD_BLOB = "files.views.upload_blob"
DELETE_BLOB = "files.views.delete_blob"
ITER_BLOB   = "files.views.iter_blob"


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthTest(TestCase):
    def test_health_no_auth(self):
        r = self.client.get("/api/health/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ok")


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

class UploadTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)

    @patch(UPLOAD_BLOB)
    def test_upload_valid_jpeg(self, mock_upload):
        f = _make_upload_file()
        r = self.client.post("/api/files/upload/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 201)
        data = r.json()
        self.assertIn("id", data)
        self.assertIn("thumb_name", data)
        mock_upload.assert_called()

    @patch(UPLOAD_BLOB)
    def test_upload_png(self, mock_upload):
        f = _make_upload_file("shot.png", "image/png", _make_image_bytes("PNG"))
        r = self.client.post("/api/files/upload/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 201)

    def test_upload_rejects_pdf(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("doc.pdf", b"%PDF-1.4", content_type="application/pdf")
        r = self.client.post("/api/files/upload/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 400)
        self.assertIn("not allowed", r.json()["detail"])

    def test_upload_rejects_wrong_extension(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        # .exe extension with image MIME — mismatch
        f = SimpleUploadedFile("virus.exe", b"MZ", content_type="image/jpeg")
        r = self.client.post("/api/files/upload/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_upload_empty_file(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("empty.jpg", b"", content_type="image/jpeg")
        r = self.client.post("/api/files/upload/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_upload_requires_auth(self):
        f = _make_upload_file()
        r = self.client.post("/api/files/upload/", {"file": f}, format="multipart",
                             HTTP_AUTHORIZATION="")
        # remove auth header explicitly
        anon = APIClient()
        r2 = anon.post("/api/files/upload/", {"file": f}, format="multipart")
        self.assertEqual(r2.status_code, 401)

    @patch(UPLOAD_BLOB)
    def test_quota_exceeded(self, mock_upload):
        quota, _ = UserQuota.objects.get_or_create(user_id=self.user.id)
        quota.limit_bytes = 1  # 1 byte limit
        quota.used_bytes = 1
        quota.save()
        f = _make_upload_file()
        r = self.client.post("/api/files/upload/", {"file": f}, format="multipart")
        self.assertEqual(r.status_code, 400)
        self.assertIn("Quota", r.json()["detail"])

    @patch(UPLOAD_BLOB)
    def test_upload_increments_quota(self, mock_upload):
        f = _make_upload_file()
        self.client.post("/api/files/upload/", {"file": f}, format="multipart")
        q = UserQuota.objects.get(user_id=self.user.id)
        self.assertGreater(q.used_bytes, 0)

    @patch(UPLOAD_BLOB)
    def test_upload_to_album(self, mock_upload):
        album = Album.objects.create(owner_id=self.user.id, name="Trip")
        f = _make_upload_file()
        r = self.client.post(
            "/api/files/upload/",
            {"file": f, "album_id": album.id},
            format="multipart",
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["album_id"], album.id)

    @patch(UPLOAD_BLOB)
    def test_upload_to_wrong_album_returns_404(self, mock_upload):
        other = User.objects.create_user("bob", password="pw")
        album = Album.objects.create(owner_id=other.id, name="Secret")
        f = _make_upload_file()
        r = self.client.post(
            "/api/files/upload/",
            {"file": f, "album_id": album.id},
            format="multipart",
        )
        self.assertEqual(r.status_code, 404)


# ---------------------------------------------------------------------------
# List / Filter / Paginate
# ---------------------------------------------------------------------------

class ListFilesTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)
        self.album = Album.objects.create(owner_id=self.user.id, name="Beach")
        # create 5 photos
        for i in range(5):
            StoredFile.objects.create(
                owner_id=self.user.id,
                original_name=f"beach{i}.jpg",
                blob_name=f"u/b{i}.jpg",
                size=1000,
            )
        # 2 photos in album
        for i in range(2):
            StoredFile.objects.create(
                owner_id=self.user.id,
                original_name=f"album{i}.jpg",
                blob_name=f"u/a{i}.jpg",
                size=500,
                album=self.album,
            )

    def test_list_all(self):
        r = self.client.get("/api/files/")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("count", data)
        self.assertIn("results", data)
        self.assertEqual(data["count"], 7)

    def test_pagination(self):
        r = self.client.get("/api/files/?page=1&page_size=3")
        data = r.json()
        self.assertEqual(len(data["results"]), 3)
        self.assertIsNotNone(data["next"])
        self.assertIsNone(data["previous"])

    def test_search(self):
        r = self.client.get("/api/files/?search=beach")
        self.assertEqual(r.json()["count"], 5)

    def test_filter_by_album(self):
        r = self.client.get(f"/api/files/?album_id={self.album.id}")
        self.assertEqual(r.json()["count"], 2)

    def test_filter_invalid_album_returns_404(self):
        r = self.client.get("/api/files/?album_id=9999")
        self.assertEqual(r.status_code, 404)

    def test_filter_invalid_date_returns_400(self):
        r = self.client.get("/api/files/?date_from=not-a-date")
        self.assertEqual(r.status_code, 400)

    def test_page_size_capped_at_100(self):
        r = self.client.get("/api/files/?page_size=9999")
        # Should not error and results ≤ 100
        self.assertEqual(r.status_code, 200)
        self.assertLessEqual(len(r.json()["results"]), 100)

    def test_other_user_cannot_see_files(self):
        other = User.objects.create_user("bob", password="pw")
        c = _auth_client(other)
        r = c.get("/api/files/")
        self.assertEqual(r.json()["count"], 0)


# ---------------------------------------------------------------------------
# Download (streaming)
# ---------------------------------------------------------------------------

class DownloadTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)
        self.photo = StoredFile.objects.create(
            owner_id=self.user.id,
            original_name="cat.jpg",
            blob_name="u/cat.jpg",
            content_type="image/jpeg",
            size=1000,
        )

    @patch(ITER_BLOB, return_value=iter([b"chunk1", b"chunk2"]))
    def test_download_streams(self, mock_iter):
        r = self.client.get(f"/api/files/{self.photo.id}/download/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Disposition"], 'attachment; filename="cat.jpg"')

    def test_download_404_other_user(self):
        other = User.objects.create_user("bob", password="pw")
        c = _auth_client(other)
        r = c.get(f"/api/files/{self.photo.id}/download/")
        self.assertEqual(r.status_code, 404)


# ---------------------------------------------------------------------------
# Thumbnail
# ---------------------------------------------------------------------------

class ThumbnailTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)

    @patch(ITER_BLOB, return_value=iter([b"thumb-data"]))
    def test_thumbnail_ok(self, mock_iter):
        photo = StoredFile.objects.create(
            owner_id=self.user.id,
            original_name="cat.jpg",
            blob_name="u/cat.jpg",
            thumb_name="u/cat_thumb.jpg",
            size=1000,
        )
        r = self.client.get(f"/api/files/{photo.id}/thumbnail/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "image/jpeg")

    def test_thumbnail_no_thumb_returns_404(self):
        photo = StoredFile.objects.create(
            owner_id=self.user.id,
            original_name="cat.jpg",
            blob_name="u/cat2.jpg",
            thumb_name=None,
            size=1000,
        )
        r = self.client.get(f"/api/files/{photo.id}/thumbnail/")
        self.assertEqual(r.status_code, 404)


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

class DeleteTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)

    @patch(DELETE_BLOB)
    def test_delete_ok(self, mock_delete):
        quota, _ = UserQuota.objects.get_or_create(user_id=self.user.id)
        quota.used_bytes = 500
        quota.save()
        photo = StoredFile.objects.create(
            owner_id=self.user.id,
            original_name="cat.jpg",
            blob_name="u/del.jpg",
            thumb_name="u/del_thumb.jpg",
            size=500,
        )
        r = self.client.delete(f"/api/files/{photo.id}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(StoredFile.objects.filter(id=photo.id).exists())
        # quota decremented
        quota.refresh_from_db()
        self.assertEqual(quota.used_bytes, 0)
        # both blobs deleted
        self.assertEqual(mock_delete.call_count, 2)

    def test_delete_404_wrong_user(self):
        photo = StoredFile.objects.create(
            owner_id=999,
            original_name="x.jpg",
            blob_name="u/x.jpg",
            size=100,
        )
        r = self.client.delete(f"/api/files/{photo.id}/")
        self.assertEqual(r.status_code, 404)


# ---------------------------------------------------------------------------
# Rename
# ---------------------------------------------------------------------------

class RenameTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)
        self.photo = StoredFile.objects.create(
            owner_id=self.user.id,
            original_name="old_name.jpg",
            blob_name="u/r.jpg",
            size=100,
        )

    def test_rename_ok(self):
        r = self.client.patch(
            f"/api/files/{self.photo.id}/rename/",
            {"name": "new_name"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["original_name"], "new_name.jpg")

    def test_rename_preserves_extension(self):
        r = self.client.patch(
            f"/api/files/{self.photo.id}/rename/",
            {"name": "vacation"},
            format="json",
        )
        self.assertTrue(r.json()["original_name"].endswith(".jpg"))

    def test_rename_empty_name_returns_400(self):
        r = self.client.patch(
            f"/api/files/{self.photo.id}/rename/",
            {"name": ""},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_rename_too_long_returns_400(self):
        r = self.client.patch(
            f"/api/files/{self.photo.id}/rename/",
            {"name": "x" * 256},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_rename_wrong_user_404(self):
        other = User.objects.create_user("bob", password="pw")
        c = _auth_client(other)
        r = c.patch(
            f"/api/files/{self.photo.id}/rename/",
            {"name": "hack"},
            format="json",
        )
        self.assertEqual(r.status_code, 404)


# ---------------------------------------------------------------------------
# Move to album
# ---------------------------------------------------------------------------

class MoveTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)
        self.photo = StoredFile.objects.create(
            owner_id=self.user.id,
            original_name="x.jpg",
            blob_name="u/mv.jpg",
            size=100,
        )
        self.album = Album.objects.create(owner_id=self.user.id, name="Summer")

    def test_move_to_album(self):
        r = self.client.patch(
            f"/api/files/{self.photo.id}/move/",
            {"album_id": self.album.id},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["album_id"], self.album.id)

    def test_move_to_null_clears_album(self):
        self.photo.album = self.album
        self.photo.save()
        r = self.client.patch(
            f"/api/files/{self.photo.id}/move/",
            {"album_id": None},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(r.json()["album_id"])

    def test_move_to_wrong_album_404(self):
        other = User.objects.create_user("bob", password="pw")
        album2 = Album.objects.create(owner_id=other.id, name="Private")
        r = self.client.patch(
            f"/api/files/{self.photo.id}/move/",
            {"album_id": album2.id},
            format="json",
        )
        self.assertEqual(r.status_code, 404)


# ---------------------------------------------------------------------------
# Albums CRUD
# ---------------------------------------------------------------------------

class AlbumTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)

    def test_create_album(self):
        r = self.client.post("/api/albums/", {"name": "Holidays"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["name"], "Holidays")

    def test_create_album_empty_name_400(self):
        r = self.client.post("/api/albums/", {"name": ""}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_create_album_long_name_400(self):
        r = self.client.post("/api/albums/", {"name": "x" * 101}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_list_albums(self):
        Album.objects.create(owner_id=self.user.id, name="A")
        Album.objects.create(owner_id=self.user.id, name="B")
        r = self.client.get("/api/albums/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 2)

    def test_list_albums_only_own(self):
        other = User.objects.create_user("bob", password="pw")
        Album.objects.create(owner_id=other.id, name="Secret")
        r = self.client.get("/api/albums/")
        self.assertEqual(len(r.json()), 0)

    def test_get_album_detail(self):
        album = Album.objects.create(owner_id=self.user.id, name="Travel")
        r = self.client.get(f"/api/albums/{album.id}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["name"], "Travel")

    def test_update_album(self):
        album = Album.objects.create(owner_id=self.user.id, name="Old")
        r = self.client.patch(
            f"/api/albums/{album.id}/",
            {"name": "New", "description": "Updated"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["name"], "New")

    def test_delete_album_disassociates_photos(self):
        album = Album.objects.create(owner_id=self.user.id, name="Temp")
        photo = StoredFile.objects.create(
            owner_id=self.user.id,
            original_name="x.jpg",
            blob_name="u/xx.jpg",
            size=100,
            album=album,
        )
        r = self.client.delete(f"/api/albums/{album.id}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(Album.objects.filter(id=album.id).exists())
        photo.refresh_from_db()
        self.assertIsNone(photo.album)

    def test_access_other_album_404(self):
        other = User.objects.create_user("bob", password="pw")
        album = Album.objects.create(owner_id=other.id, name="Private")
        r = self.client.get(f"/api/albums/{album.id}/")
        self.assertEqual(r.status_code, 404)

    def test_photo_count_in_album(self):
        album = Album.objects.create(owner_id=self.user.id, name="Count")
        StoredFile.objects.create(
            owner_id=self.user.id,
            original_name="a.jpg",
            blob_name="u/count1.jpg",
            size=100,
            album=album,
        )
        r = self.client.get(f"/api/albums/{album.id}/")
        self.assertEqual(r.json()["photo_count"], 1)


# ---------------------------------------------------------------------------
# Quota
# ---------------------------------------------------------------------------

class QuotaTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="pw")
        self.client = _auth_client(self.user)

    def test_quota_default(self):
        r = self.client.get("/api/quota/")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("used_bytes", data)
        self.assertIn("limit_bytes", data)
        self.assertEqual(data["used_bytes"], 0)
        self.assertEqual(data["limit_bytes"], settings.DEFAULT_USER_QUOTA_BYTES)

    @patch(UPLOAD_BLOB)
    def test_quota_updates_after_upload(self, mock_upload):
        f = _make_upload_file()
        self.client.post("/api/files/upload/", {"file": f}, format="multipart")
        r = self.client.get("/api/quota/")
        self.assertGreater(r.json()["used_bytes"], 0)

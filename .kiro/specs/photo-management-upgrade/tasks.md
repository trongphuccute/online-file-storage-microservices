# Implementation Plan: Photo Management Upgrade

## Overview

Nâng cấp `file-service` theo từng bước độc lập, mỗi bước xây dựng trên bước trước. Thứ tự ưu tiên: fix kỹ thuật trước (streaming, quota), sau đó model mới (thumb, album), rồi logic nghiệp vụ (validate, thumbnail gen), cuối cùng là API mới (rename, move, CRUD album) và wiring (serializer, urls).

Scope: **chỉ `file-service/`**. Không làm share-link, public access, auth, frontend.

---

## Tasks

- [ ] 1. Chuẩn bị dependencies và fix kỹ thuật cơ bản
  - [x] 1.1 Thêm Pillow vào `file-service/requirements.txt`
    - Append `Pillow==10.4.0` vào file `file-service/requirements.txt`
    - _Requirements: 2.1 (thumbnail generation cần Pillow)_

  - [-] 1.2 Fix streaming download trong `blob_storage.py`
    - Trong hàm `open_blob()`: thay `blob.download_blob().readall()` thành trả về `blob.download_blob()` — đây là `StorageStreamDownloader` có method `chunks()` và `read()`
    - Trong `views.py` hàm `download_file`: wrap stream Azure thành `io.RawIOBase` hoặc dùng `StreamingHttpResponse` với generator `chunks()` (chunk size 8192 bytes) để không load toàn bộ vào RAM
    - Local fallback đã trả `FileResponse` đúng — giữ nguyên
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 2. Thêm fields và models mới + migrations
  - [-] 2.1 Thêm field `used_bytes` vào model `UserQuota`
    - Trong `files/models.py`: thêm `used_bytes = models.BigIntegerField(default=0)` vào `UserQuota`
    - Tạo migration `0002_userquota_used_bytes.py`
    - _Requirements: 8.1_

  - [-] 2.2 Thêm field `thumb_name` vào model `StoredFile`
    - Trong `files/models.py`: thêm `thumb_name = models.CharField(max_length=512, blank=True, null=True)` vào `StoredFile`
    - Tạo migration `0003_storedfile_thumb_name.py` (hoặc gộp với 0002 nếu chưa apply)
    - _Requirements: 2.3_

  - [~] 2.3 Tạo model `Album` mới
    - Trong `files/models.py`: thêm class `Album` với fields: `owner_id` (PositiveIntegerField, db_index), `name` (CharField max_length=100), `description` (TextField, blank=True), `created_at` (DateTimeField, auto_now_add)
    - Thêm FK `album = models.ForeignKey(Album, null=True, blank=True, on_delete=models.SET_NULL)` vào `StoredFile`
    - Tạo migration `0004_album_storedfile_album_fk.py`
    - _Requirements: 3.1, 3.4, 3.7_

- [ ] 3. Tối ưu quota với `used_bytes` atomic update
  - [~] 3.1 Cập nhật `upload_file` view để dùng `used_bytes` thay SUM
    - Thay khối `StoredFile.objects.filter(...).aggregate(total=Sum("size"))` bằng đọc `quota.used_bytes`
    - Sau khi tạo `StoredFile`, dùng `UserQuota.objects.filter(user_id=...).update(used_bytes=F("used_bytes") + size)` (import `F` từ `django.db.models`)
    - _Requirements: 8.2, 8.4, 8.5_

  - [~] 3.2 Cập nhật `delete_file` view để trừ `used_bytes`
    - Sau khi `item.delete()`, dùng `UserQuota.objects.filter(user_id=...).update(used_bytes=F("used_bytes") - size)` (lưu `size` trước khi xóa)
    - _Requirements: 8.3_

  - [~] 3.3 Cập nhật `quota` view để trả `used_bytes` từ cache
    - Bỏ khối `aggregate(total=Sum("size"))`, thay bằng `quota_obj.used_bytes`
    - _Requirements: 8.4_

- [ ] 4. Validate MIME type và extension khi upload
  - [~] 4.1 Viết helper `validate_image_file(uploaded_file)` trong `files/views.py` (hoặc tách ra `files/validators.py`)
    - Kiểm tra `uploaded.content_type` có trong tập `{image/jpeg, image/png, image/gif, image/webp, image/bmp, image/tiff, image/svg+xml}`
    - Kiểm tra extension của `uploaded.name` có trong `{.jpg, .jpeg, .png, .gif, .webp, .bmp, .tiff, .tif, .svg}`
    - Kiểm tra MIME/extension không bị mismatch (ví dụ: .png với `image/jpeg` → reject)
    - Trả `(True, None)` nếu hợp lệ, `(False, "error message")` nếu không
    - Gọi helper này trong `upload_file` trước khi check quota, trả HTTP 400 nếu lỗi
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Sinh thumbnail tự động khi upload
  - [~] 5.1 Viết hàm `generate_thumbnail(file_obj, blob_name)` trong `files/blob_storage.py` (hoặc `files/thumbnail.py`)
    - Dùng `PIL.Image.open(file_obj)` để đọc ảnh
    - Gọi `image.thumbnail((400, 400), PIL.Image.LANCZOS)` để resize (preserves aspect ratio)
    - Tạo `thumb_blob_name`: chèn `_thumb` trước phần extension cuối, đổi extension thành `.jpg` (ví dụ: `abc/uuid-photo.png` → `abc/uuid-photo_thumb.jpg`)
    - Lưu thumbnail vào BytesIO, gọi `upload_blob(thumb_blob_name, bytes_io)`
    - Nếu `PIL.UnidentifiedImageError` hoặc exception khác: log warning, trả `None` (upload chính vẫn thành công)
    - Trả `thumb_blob_name` nếu thành công, `None` nếu thất bại
    - _Requirements: 2.1, 2.2, 2.4_

  - [~] 5.2 Tích hợp `generate_thumbnail` vào `upload_file` view
    - Sau khi `upload_blob(blob_name, uploaded)` thành công, gọi `thumb_name = generate_thumbnail(uploaded, blob_name)`
    - Truyền `thumb_name=thumb_name` khi `StoredFile.objects.create(...)`
    - `file_obj.seek(0)` trước khi gọi generate_thumbnail
    - _Requirements: 2.3, 2.4_

  - [~] 5.3 Xóa thumbnail khi xóa ảnh trong `delete_file` view
    - Trước `item.delete()`, nếu `item.thumb_name` tồn tại: gọi `delete_blob(item.thumb_name)` (bọc try/except để không chặn xóa ảnh chính)
    - _Requirements: 2.5_

- [ ] 6. Phân trang và filter danh sách ảnh
  - [~] 6.1 Cập nhật `list_files` view thêm filter và phân trang
    - Thêm filter `search`: `queryset.filter(original_name__icontains=search)` nếu `request.query_params.get("search")`
    - Thêm filter `album_id`: `queryset.filter(album_id=album_id)` nếu param tồn tại
    - Thêm filter `date_from`/`date_to`: parse ISO 8601, dùng `created_at__gte` / `created_at__lte`
    - Phân trang thủ công: lấy `page` (default 1), `page_size` (default 20, cap 100), tính `offset/limit`, dùng `queryset[offset:offset+page_size]`
    - Trả response dạng `{"count": total, "next": url_or_null, "previous": url_or_null, "results": [...]}`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [~] 7. Checkpoint — kiểm tra các thay đổi core
  - Đảm bảo tất cả migrations đã được tạo và có thể apply (`python manage.py migrate --check`)
  - Đảm bảo upload, download streaming, delete (bao gồm xóa thumb), quota, list với filter đều hoạt động đúng
  - Hỏi user nếu có vấn đề phát sinh.

- [ ] 8. Endpoint rename và thumbnail
  - [~] 8.1 Thêm view `rename_file` — `PATCH /files/<id>/rename/`
    - Nhận `{"name": "new_name.jpg"}` từ request body
    - Validate: name không rỗng, không quá 255 ký tự
    - Kiểm tra file thuộc `owner_id` → 404 nếu không tìm thấy
    - Cập nhật `item.original_name = new_name`, `item.save()`
    - Trả HTTP 200 với serializer data
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [~] 8.2 Thêm view `thumbnail_file` — `GET /files/<id>/thumbnail/`
    - Kiểm tra file thuộc `owner_id` → 403 nếu không tìm thấy (không dùng 404 để tránh leak)
    - Nếu `item.thumb_name` là None → trả HTTP 404
    - Gọi `open_blob(item.thumb_name)` → wrap thành `StreamingHttpResponse` với generator chunks (8192 bytes), content_type `image/jpeg`
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 9. CRUD Album endpoints
  - [~] 9.1 Thêm view `list_create_album` — `GET /albums/` và `POST /albums/`
    - GET: trả `Album.objects.filter(owner_id=request.user.id).order_by("-created_at")`
    - POST: đọc `name` (required, max 100 chars) và `description` (optional); tạo `Album(owner_id=..., name=..., description=...)`; trả HTTP 201
    - Validate name > 100 ký tự → HTTP 400
    - _Requirements: 3.1, 3.2, 3.5_

  - [~] 9.2 Thêm view `update_delete_album` — `PATCH /albums/<id>/` và `DELETE /albums/<id>/`
    - Tìm `Album.objects.filter(id=album_id, owner_id=request.user.id).first()` → 404 nếu không tìm thấy
    - PATCH: cập nhật `name` và/hoặc `description`, trả HTTP 200
    - DELETE: xóa album, set `StoredFile.objects.filter(album=album_obj).update(album=None)`, trả HTTP 204
    - _Requirements: 3.3, 3.4, 3.6_

- [ ] 10. Endpoint move ảnh vào album + upload với album_id
  - [~] 10.1 Thêm view `move_file` — `PATCH /files/<id>/move/`
    - Nhận `{"album_id": 5}` (hoặc `null` để bỏ khỏi album)
    - Kiểm tra file thuộc `owner_id` → 404
    - Nếu `album_id` không null: kiểm tra album tồn tại và thuộc `owner_id` → 404
    - Update `item.album_id`, `item.save()`, trả HTTP 200
    - _Requirements: 3.8_

  - [~] 10.2 Cập nhật `upload_file` view hỗ trợ `album_id` param
    - Đọc `album_id = request.data.get("album_id")` (optional)
    - Nếu có `album_id`: kiểm tra album tồn tại và thuộc `owner_id` → HTTP 400 nếu không hợp lệ
    - Truyền `album_id=album_id` vào `StoredFile.objects.create(...)`
    - _Requirements: 3.7_

- [ ] 11. Cập nhật Serializers
  - [~] 11.1 Cập nhật `StoredFileSerializer` trong `files/serializers.py`
    - Thêm `thumb_name`, `album` (hoặc `album_id`) vào `fields` list
    - Thêm `AlbumSerializer` mới cho model `Album` với fields: `id`, `owner_id`, `name`, `description`, `created_at`
    - `StoredFileSerializer` nên expose `album_id` (writable) thay vì nested object để đơn giản
    - _Requirements: 2.3, 3.1, 3.2, 3.3_

- [ ] 12. Cập nhật `urls.py` cho tất cả endpoints mới
  - [~] 12.1 Cập nhật `files/urls.py` thêm tất cả URL patterns mới
    - `path("files/<int:file_id>/rename/", views.rename_file)` — PATCH
    - `path("files/<int:file_id>/thumbnail/", views.thumbnail_file)` — GET
    - `path("files/<int:file_id>/move/", views.move_file)` — PATCH
    - `path("albums/", views.list_create_album)` — GET, POST
    - `path("albums/<int:album_id>/", views.update_delete_album)` — PATCH, DELETE
    - _Requirements: 3.1–3.4, 3.8, 5.1, 9.1_

- [~] 13. Checkpoint cuối — Đảm bảo tất cả tests pass
  - Chạy lại toàn bộ: upload ảnh hợp lệ, upload file không hợp lệ (expect 400), list với filter, rename, thumbnail, tạo album, gắn ảnh vào album, move, delete (kiểm tra thumb cũng bị xóa), quota trả đúng `used_bytes`
  - Hỏi user nếu có vấn đề phát sinh.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP (không có task `*` trong spec này vì không có correctness properties section trong design)
- Thứ tự task quan trọng: migrations (task 2) phải được apply trước khi chạy task 3–12
- `F()` expression từ `django.db.models` là cần thiết cho atomic increment/decrement quota
- Azure streaming: `blob.download_blob()` trả `StorageStreamDownloader`; dùng `.chunks()` iterator để stream từng 8192 bytes
- SVG không thể mở bằng Pillow — hàm `generate_thumbnail` cần handle trường hợp này bằng cách bắt exception và trả `None`
- Không cần thay đổi `file_service/urls.py` (project-level) nếu đã include `files/urls.py` với prefix rỗng

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "5.3"] },
    { "id": 6, "tasks": ["8.1", "8.2", "9.1", "9.2"] },
    { "id": 7, "tasks": ["10.1", "10.2"] },
    { "id": 8, "tasks": ["11.1"] },
    { "id": 9, "tasks": ["12.1"] }
  ]
}
```

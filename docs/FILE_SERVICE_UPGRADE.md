# File Service — Tổng kết & Kế hoạch nâng cấp

> Phạm vi: chỉ `file-service` (thành viên 2 theo ONE_MONTH_PLAN)
> Share-link do thành viên 3 làm — **không đụng vào**.

---

## 1. Hiện trạng

### 1.1 Endpoints đang có

| Method | Path | Mô tả | Auth |
|--------|------|--------|------|
| GET | `/health/` | Health check | Không cần |
| GET | `/files/` | Danh sách file của user | JWT |
| POST | `/files/upload/` | Upload file (multipart) | JWT |
| GET | `/files/<id>/download/` | Download file | JWT |
| DELETE | `/files/<id>/` | Xóa file | JWT |
| GET | `/quota/` | Xem quota đã dùng / giới hạn | JWT |

### 1.2 Models

```
StoredFile
  id             (auto)
  owner_id       (int, index)   ← user ID từ JWT, không FK thật
  original_name  (char 255)
  blob_name      (char 512, unique)
  content_type   (char 120)
  size           (bigint, bytes)
  created_at     (auto)

UserQuota
  user_id        (unique int)
  limit_bytes    (bigint, default 1GB)
```

### 1.3 Storage

- **Azure Blob Storage** (production) — khi có `AZURE_STORAGE_CONNECTION_STRING`
- **Local filesystem** (`media/uploads/`) — fallback khi không có Azure

### 1.4 Dependencies hiện tại

```
Django 5.0.7
djangorestframework 3.15.2
djangorestframework-simplejwt 5.3.1
django-cors-headers 4.4.0
psycopg[binary] 3.2.1
azure-storage-blob 12.22.0
python-dotenv 1.0.1
gunicorn 22.0.0
```

### 1.5 Vấn đề kỹ thuật hiện tại

| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | Download Azure dùng `readall()` → load toàn bộ file vào RAM | 🔴 Cao |
| 2 | Quota tính `SUM` mỗi lần upload → chậm khi nhiều file | 🟡 Trung bình |
| 3 | Không validate định dạng file — nhận mọi loại file | 🟡 Trung bình |
| 4 | Không có phân trang — list trả toàn bộ | 🟡 Trung bình |
| 5 | Không có thumbnail — frontend phải load ảnh full size | 🟡 Trung bình |
| 6 | Không có album — tất cả ảnh nằm flat | 🟢 Thấp |
| 7 | Không có rename — không sửa được tên sau upload | 🟢 Thấp |

---

## 2. Cần nâng cấp

### 2.1 Tính năng mới

| # | Tính năng | Ưu tiên | Tuần |
|---|-----------|---------|------|
| A | Validate chỉ nhận file ảnh (jpg, png, gif, webp...) | 🔴 Cao | Tuần 2 |
| B | Thumbnail tự động khi upload (≤400px, Pillow) | 🔴 Cao | Tuần 2 |
| C | Phân trang + search + filter cho list ảnh | 🟡 Trung bình | Tuần 2 |
| D | Rename ảnh | 🟢 Thấp | Tuần 2 |
| E | Album (tạo/sửa/xóa, gắn ảnh vào album) | 🟢 Thấp | Tuần 3 |

### 2.2 Cải thiện kỹ thuật

| # | Cải thiện | Ưu tiên | Tuần |
|---|-----------|---------|------|
| F | Streaming download (chunked, không load vào RAM) | 🔴 Cao | Tuần 2 |
| G | Tối ưu quota: dùng `used_bytes` cached thay vì SUM | 🟡 Trung bình | Tuần 2 |

---

## 3. API mới sau nâng cấp

### Endpoints giữ nguyên (đã có)
- `GET /health/`
- `GET /quota/` — cập nhật trả `used_bytes` từ cache
- `DELETE /files/<id>/`

### Endpoints thay đổi

| Method | Path | Thay đổi |
|--------|------|----------|
| GET | `/files/` | + phân trang (`page`, `page_size`) + filter (`search`, `album_id`, `date_from`, `date_to`) |
| POST | `/files/upload/` | + validate image MIME/ext + sinh thumbnail + gắn album_id tuỳ chọn |
| GET | `/files/<id>/download/` | Streaming thay vì load RAM |

### Endpoints mới thêm

| Method | Path | Mô tả |
|--------|------|--------|
| PATCH | `/files/<id>/rename/` | Đổi tên ảnh |
| GET | `/files/<id>/thumbnail/` | Lấy thumbnail |
| GET | `/albums/` | Danh sách album của user |
| POST | `/albums/` | Tạo album mới |
| PATCH | `/albums/<id>/` | Sửa tên/mô tả album |
| DELETE | `/albums/<id>/` | Xóa album (ảnh không bị xóa) |
| PATCH | `/files/<id>/move/` | Chuyển ảnh vào album |

---

## 4. Thay đổi Model

### StoredFile — thêm fields

```python
album        = ForeignKey(Album, null=True, blank=True, on_delete=SET_NULL)
thumb_name   = CharField(max_length=512, blank=True, null=True)  # blob name thumbnail
```

### UserQuota — thêm field

```python
used_bytes   = BigIntegerField(default=0)  # cached, atomic update
```

### Album — model mới

```python
class Album(Model):
    owner_id    = PositiveIntegerField(db_index=True)
    name        = CharField(max_length=100)
    description = TextField(blank=True)
    created_at  = DateTimeField(auto_now_add=True)
```

---

## 5. Dependencies cần thêm

```
Pillow==10.4.0   # sinh thumbnail
```

---

## 6. Checklist theo tuần

### Tuần 2
- [x] Thêm `Pillow` vào `requirements.txt`
- [x] Validate MIME type + extension khi upload
- [x] Sinh thumbnail sau upload, lưu blob `{original}_thumb.jpg`
- [x] Thêm field `thumb_name` vào `StoredFile`
- [x] Thêm field `used_bytes` vào `UserQuota`, chuyển quota sang atomic update
- [x] Phân trang list ảnh (page, page_size max 100)
- [x] Filter: search tên, album_id, date_from, date_to
- [x] Streaming download fix Azure `readall()` → dùng iter_blob() generator
- [x] Endpoint `PATCH /files/<id>/rename/`
- [x] Endpoint `GET /files/<id>/thumbnail/`
- [x] Tạo migration 0004 cho Album + album FK
- [x] 45/45 automated tests pass (`python manage.py test files`)

### Tuần 3
- [x] Model `Album` + migration 0004
- [x] CRUD album endpoints (`GET/POST /albums/`, `GET/PATCH/DELETE /albums/<id>/`)
- [x] Endpoint `PATCH /files/<id>/move/` chuyển ảnh vào album
- [x] Upload hỗ trợ `album_id` param
- [x] Management command `recalculate_quota` để sync lại quota cache
- [ ] Azure Blob integration test với thumbnail (cần Azure credentials thật)

### Tuần 4
- [ ] Fix bug nếu có
- [ ] Viết phần file-service trong báo cáo
- [ ] Screenshot Postman cho demo

---

## 7. Không làm (ngoài scope)

- Share link / public access → thành viên 3 (share-service)
- Preview ảnh trên UI → thành viên 3 (frontend)
- Auth/JWT setup → thành viên 1 (auth-service)
- Realtime notification
- Virus scan
- Role/permission nhiều cấp

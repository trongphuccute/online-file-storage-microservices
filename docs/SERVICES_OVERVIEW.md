# CloudVault — Tổng quan 3 Services

> Cập nhật: June 2026 | Stack: Django REST Framework + Next.js + PostgreSQL + Azure Blob

---

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                    │
│                   localhost:3000                        │
└──────────┬──────────────┬──────────────┬────────────────┘
           │              │              │
           ▼              ▼              ▼
    Auth Service    File Service   Share Service
    :8001           :8002          :8003
    PostgreSQL       PostgreSQL     PostgreSQL
    (auth_service)  (file_service) (share_service)
```

**Nguyên tắc:**
- Mỗi service có database riêng
- JWT secret dùng chung qua `.env` (`DJANGO_SECRET_KEY`)
- Frontend gọi trực tiếp 3 API — không qua gateway
- File thực lưu Azure Blob Storage (local filesystem khi dev)

---

## 1. Auth Service — `localhost:8001`

### Mô tả
Quản lý xác thực người dùng: đăng ký, đăng nhập, JWT token, đổi mật khẩu.

### Stack
- Django 5.x + DRF + SimpleJWT + Token Blacklist
- PostgreSQL (`auth_service` DB)
- Whitenoise (static files)

### Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| GET | `/api/health/` | ❌ | Health check |
| POST | `/api/auth/register/` | ❌ | Đăng ký → trả JWT ngay |
| POST | `/api/auth/login/` | ❌ | Đăng nhập → trả JWT |
| POST | `/api/auth/refresh/` | ❌ | Refresh access token |
| POST | `/api/auth/logout/` | ✅ | Blacklist refresh token |
| GET | `/api/auth/profile/` | ✅ | Xem thông tin user |
| POST | `/api/auth/change-password/` | ✅ | Đổi mật khẩu |

### Response mẫu

**Register / Login:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user_id": 1,
  "username": "demo",
  "email": "demo@example.com"
}
```

### Models
```
User (Django built-in)
  id, username, email, password (hashed), date_joined
```

### JWT Config
```
ACCESS_TOKEN_LIFETIME  = 60 phút
REFRESH_TOKEN_LIFETIME = 7 ngày
SIGNING_KEY            = DJANGO_SECRET_KEY (dùng chung)
ROTATE_REFRESH_TOKENS  = True
BLACKLIST_AFTER_ROTATION = True
```

---

## 2. File Service — `localhost:8002`

### Mô tả
Quản lý ảnh của người dùng: upload, download, xóa, tổ chức album, thumbnail tự động, quota.

### Stack
- Django 5.x + DRF + SimpleJWT
- PostgreSQL (`file_service` DB)
- Azure Blob Storage / Local filesystem (fallback)
- Pillow (sinh thumbnail)

### Endpoints

#### Photos

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| GET | `/api/health/` | ❌ | Health check |
| GET | `/api/files/` | ✅ | List ảnh (phân trang + filter + search) |
| POST | `/api/files/upload/` | ✅ | Upload ảnh (validate + thumbnail tự động) |
| GET | `/api/files/<id>/` | ✅ | Chi tiết 1 ảnh |
| DELETE | `/api/files/<id>/delete/` | ✅ | Xóa ảnh + thumbnail |
| GET | `/api/files/<id>/download/` | ✅ | Download streaming (chunked 8KB) |
| GET | `/api/files/<id>/thumbnail/` | ✅ | Lấy thumbnail (≤400px) |
| PATCH | `/api/files/<id>/rename/` | ✅ | Đổi tên ảnh (giữ extension) |
| PATCH | `/api/files/<id>/move/` | ✅ | Chuyển ảnh vào album |

#### Albums

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| GET | `/api/albums/` | ✅ | Danh sách album |
| POST | `/api/albums/` | ✅ | Tạo album mới |
| GET | `/api/albums/<id>/` | ✅ | Chi tiết album + photo_count |
| PATCH | `/api/albums/<id>/` | ✅ | Sửa tên/mô tả album |
| DELETE | `/api/albums/<id>/` | ✅ | Xóa album (ảnh không bị xóa) |

#### Quota

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| GET | `/api/quota/` | ✅ | Xem used_bytes / limit_bytes |

### Query params cho `GET /api/files/`

| Param | Ví dụ | Mô tả |
|-------|-------|--------|
| `search` | `?search=beach` | Tìm theo tên ảnh |
| `album_id` | `?album_id=3` | Lọc theo album |
| `date_from` | `?date_from=2026-01-01` | Lọc từ ngày (ISO 8601) |
| `date_to` | `?date_to=2026-12-31` | Lọc đến ngày (ISO 8601) |
| `page` | `?page=2` | Số trang (default: 1) |
| `page_size` | `?page_size=20` | Số item/trang (max: 100) |

### Upload validation
- Chỉ nhận: `jpg, jpeg, png, gif, webp, bmp, tiff, svg`
- Kiểm tra MIME type + extension + mismatch
- Max size: 50MB (cấu hình qua `MAX_UPLOAD_FILE_BYTES`)
- Quota: mặc định 1GB/user (atomic update, không SUM lại)

### Models

```
Album
  id, owner_id, name (max 100), description, created_at

StoredFile
  id, owner_id, original_name, blob_name
  thumb_name (nullable)   ← thumbnail blob path
  content_type, size, created_at
  album (FK → Album, nullable)

UserQuota
  user_id, limit_bytes (default 1GB)
  used_bytes             ← cached, atomic increment/decrement
```

### Storage
```
Azure Blob (production):  AZURE_STORAGE_CONNECTION_STRING != ""
Local filesystem (dev):   media/uploads/{user_id}/{uuid}-{filename}
Thumbnail:                {blob_name_without_ext}_thumb.jpg
```

---

## 3. Share Service — `localhost:8003`

### Mô tả
Tạo và quản lý share link công khai cho file — không cần JWT để xem.

### Stack
- Django 5.x + DRF + SimpleJWT
- PostgreSQL (`share_service` DB)
- `requests` lib để gọi file-service

### Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| GET | `/api/health/` | ❌ | Health check |
| POST | `/api/shares/create/` | ✅ | Tạo share link cho file |
| GET | `/api/shares/` | ✅ | Danh sách share link của user |
| GET | `/api/shares/<token>/` | ✅ | Chi tiết share link |
| PATCH | `/api/shares/<token>/` | ✅ | Cập nhật (toggle active, đổi expires_at) |
| DELETE | `/api/shares/<token>/delete/` | ✅ | Xóa share link |
| GET | `/api/public/<token>/` | ❌ | Xem public share (không cần JWT) |

### Request mẫu — Tạo share link

```json
POST /api/shares/create/
{
  "file_id": 1,
  "is_active": true,
  "expires_at": null
}
```

### Response mẫu

```json
{
  "id": 1,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "file_id": 1,
  "owner_id": 1,
  "is_active": true,
  "created_at": "2026-06-04T13:26:47Z",
  "expires_at": null
}
```

### Public share response
```json
{
  "token": "550e8400-...",
  "file_id": 1,
  "is_active": true,
  "expires_at": null,
  "file_info": { ...file metadata từ file-service... }
}
```

### Status codes quan trọng
| Code | Khi nào |
|------|---------|
| 201 | Tạo share link thành công |
| 404 | Token không tồn tại hoặc file không tìm thấy |
| 410 | Share link đã hết hạn |

### Models
```
ShareLink
  token (UUID, unique, auto-generated)
  file_id (int, ref file-service — không FK thật)
  owner_id (int, ref auth-service — không FK thật)
  is_active (bool, default True)
  created_at, expires_at (nullable)
  access_count, last_accessed_at
```

### Tích hợp với file-service
- Khi tạo share: gọi `GET http://localhost:8002/api/files/<id>/` để verify file tồn tại
- Khi xem public share: gọi `GET http://localhost:8002/api/files/<id>/` để lấy file metadata
- Fail gracefully nếu file-service down (vẫn cho tạo share)

---

## Flow end-to-end

```
1. Đăng ký / Đăng nhập
   POST :8001/api/auth/register/  →  nhận access + refresh token

2. Upload ảnh
   POST :8002/api/files/upload/
   Header: Authorization: Bearer <access_token>
   Body: form-data { file: <image> }
   →  nhận file.id + thumb_name

3. Xem danh sách ảnh
   GET :8002/api/files/?page=1&search=beach
   →  { count, next, previous, results: [...] }

4. Tạo share link
   POST :8003/api/shares/create/
   Body: { "file_id": 1 }
   →  nhận token (UUID)

5. Chia sẻ link công khai
   GET :8003/api/public/<token>/   (không cần JWT)
   →  file_info + share metadata

6. Xóa ảnh
   DELETE :8002/api/files/1/delete/
   →  204 No Content, quota giảm, thumbnail bị xóa
```

---

## Cấu hình môi trường (`.env`)

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
AUTH_POSTGRES_DB=auth_service
AUTH_POSTGRES_HOST=localhost
FILE_POSTGRES_DB=file_service
FILE_POSTGRES_HOST=localhost
SHARE_POSTGRES_DB=share_service
SHARE_POSTGRES_HOST=localhost

# Django — SECRET_KEY dùng chung làm JWT signing key
DJANGO_SECRET_KEY=dev-secret-key-change-me
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Service URLs (dùng bởi share-service để gọi file-service)
FILE_SERVICE_URL=http://localhost:8002

# Storage
AZURE_STORAGE_CONNECTION_STRING=   # để trống = dùng local
AZURE_STORAGE_CONTAINER=uploads
MAX_UPLOAD_FILE_BYTES=52428800     # 50MB
```

---

## Khởi động local

```bash
# Terminal 1 — Auth Service
cd auth-service
.\.venv\Scripts\activate
python manage.py migrate
python manage.py runserver 8001

# Terminal 2 — File Service
cd file-service
.\.venv\Scripts\activate
python manage.py migrate
python manage.py runserver 8002

# Terminal 3 — Share Service
cd share-service
.\.venv\Scripts\activate
python manage.py migrate
python manage.py runserver 8003

# Terminal 4 — Frontend
cd frontend-nextjs
npm install
npm run dev   # chạy tại localhost:3000
```

---

## Trạng thái hiện tại

| Service | MVP | Nâng cấp | Test |
|---------|-----|----------|------|
| auth-service | ✅ Hoàn chỉnh | ✅ Logout, change-password, blacklist | ✅ |
| file-service | ✅ Hoàn chỉnh | ✅ Album, thumbnail, streaming, search, quota cache | ✅ 45 tests |
| share-service | ✅ Hoàn chỉnh | ✅ Expiry, access count, pagination | ✅ |
| frontend | 🟡 Đang làm | — | — |

---

## Không trong scope (đã loại bỏ theo plan)

- Realtime notification
- Folder tree phức tạp
- Role/permission nhiều cấp
- Virus scan
- Payment/quota package
- Multi-region Azure

# Auth Service — Tài Liệu Kỹ Thuật

## Tổng quan

Auth Service là service xác thực người dùng trong hệ thống microservices. Chịu trách nhiệm đăng ký, đăng nhập, quản lý JWT token và thông tin tài khoản.

- **Framework:** Django 5.0 + Django REST Framework
- **Database:** PostgreSQL (database riêng: `auth_service`)
- **Auth:** JWT via `djangorestframework-simplejwt`
- **Port local:** `8001`
- **Base URL:** `http://localhost:8001/api`

---

## Cấu trúc thư mục

```
auth-service/
├── auth_service/
│   ├── settings.py       # Cấu hình Django, JWT, CORS, Database
│   ├── urls.py           # Route gốc → include users.urls
│   └── wsgi.py
├── users/
│   ├── views.py          # Xử lý logic các endpoint
│   ├── serializers.py    # Validate và transform data
│   ├── urls.py           # Định nghĩa các route
│   └── apps.py
├── requirements.txt
├── startup.sh            # Script chạy khi deploy Azure
└── manage.py
```

---

## Các Endpoint

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/health/` | Không | Kiểm tra service còn sống |
| POST | `/api/auth/register/` | Không | Đăng ký tài khoản mới |
| POST | `/api/auth/login/` | Không | Đăng nhập, lấy JWT |
| POST | `/api/auth/refresh/` | Không | Làm mới access token |
| POST | `/api/auth/logout/` | Có | Đăng xuất, huỷ refresh token |
| GET | `/api/auth/profile/` | Có | Xem thông tin tài khoản |
| POST | `/api/auth/change-password/` | Có | Đổi mật khẩu |

---

## Chi tiết từng Endpoint

### Health Check
```
GET /api/health/
```
Response:
```json
{ "service": "auth-service", "status": "ok" }
```

---

### Đăng ký
```
POST /api/auth/register/
```
Body:
```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "password123"
}
```
Response `201`:
```json
{
  "user": { "id": 1, "username": "demo", "email": "demo@example.com", "date_joined": "..." },
  "access": "<access_token>",
  "refresh": "<refresh_token>"
}
```
> Trả về JWT luôn sau khi đăng ký, frontend không cần gọi thêm `/login`.

Validation:
- Email bắt buộc, không được trùng với tài khoản đã có
- Password tối thiểu 8 ký tự

---

### Đăng nhập
```
POST /api/auth/login/
```
Body:
```json
{ "username": "demo", "password": "password123" }
```
Response `200`:
```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>",
  "username": "demo",
  "email": "demo@example.com",
  "user_id": 1
}
```

---

### Làm mới Token
```
POST /api/auth/refresh/
```
Body:
```json
{ "refresh": "<refresh_token>" }
```
Response `200`:
```json
{ "access": "<new_access_token>", "refresh": "<new_refresh_token>" }
```
> Refresh token cũ bị blacklist ngay sau khi dùng (ROTATE_REFRESH_TOKENS).

---

### Đăng xuất
```
POST /api/auth/logout/
Authorization: Bearer <access_token>
```
Body:
```json
{ "refresh": "<refresh_token>" }
```
Response `200`:
```json
{ "detail": "Successfully logged out." }
```

---

### Xem Profile
```
GET /api/auth/profile/
Authorization: Bearer <access_token>
```
Response `200`:
```json
{ "id": 1, "username": "demo", "email": "demo@example.com", "date_joined": "..." }
```

---

### Đổi mật khẩu
```
POST /api/auth/change-password/
Authorization: Bearer <access_token>
```
Body:
```json
{ "old_password": "password123", "new_password": "newpassword456" }
```
Response `200`:
```json
{ "detail": "Password changed successfully." }
```

Validation:
- `old_password` phải đúng
- `new_password` phải khác mật khẩu cũ, tối thiểu 8 ký tự

---

## Flow Hoạt Động

### Đăng ký và dùng ngay
```
Frontend                        Auth Service                  Database
   |                                  |                           |
   |-- POST /auth/register/ --------> |                           |
   |                                  |-- validate email/pass --> |
   |                                  |-- create user ----------> |
   |                                  |-- tạo JWT token           |
   |<-- 201 { user, access, refresh } |                           |
   |                                  |                           |
   | (lưu token, vào dashboard luôn)  |                           |
```

### Đăng nhập
```
Frontend                        Auth Service                  Database
   |                                  |                           |
   |-- POST /auth/login/ -----------> |                           |
   |                                  |-- kiểm tra username/pass->|
   |<-- 200 { access, refresh,        |                           |
   |          username, email,        |                           |
   |          user_id }               |                           |
```

### Gọi API có xác thực (file-service, share-service)
```
Frontend          File/Share Service              Auth Service
   |                      |                            |
   |-- GET /files/        |                            |
   |   Authorization:     |                            |
   |   Bearer <token> --> |                            |
   |                      |-- verify JWT bằng          |
   |                      |   SECRET_KEY chung          |
   |                      |   (không cần gọi lại       |
   |                      |    auth-service)            |
   |<-- 200 data ---------|                            |
```

### Đăng xuất
```
Frontend                        Auth Service               Blacklist DB
   |                                  |                         |
   |-- POST /auth/logout/             |                         |
   |   { refresh: "..." } ----------> |                         |
   |                                  |-- blacklist token ----> |
   |<-- 200 logged out --------------|                         |
   |                                  |                         |
   | (token cũ không dùng được nữa)   |                         |
```

---

## Cấu hình JWT

| Tham số | Giá trị | Ghi chú |
|---------|---------|---------|
| Access token lifetime | 60 phút | Đủ dài cho demo |
| Refresh token lifetime | 7 ngày | |
| Signing key | `DJANGO_SECRET_KEY` | Dùng chung cho cả 3 service |
| Rotate refresh tokens | Bật | Token mới sau mỗi lần refresh |
| Blacklist after rotation | Bật | Token cũ bị huỷ ngay |

> **Quan trọng:** `file-service` và `share-service` phải dùng cùng `DJANGO_SECRET_KEY` trong `.env` để verify JWT mà không cần gọi về auth-service.

---

## Cách chạy local

```powershell
cd auth-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

Kiểm tra: http://localhost:8001/api/health/

---

## Deploy Azure App Service

`startup.sh` tự động chạy khi deploy:
```sh
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn auth_service.wsgi:application --bind 0.0.0.0:$PORT
```

Biến môi trường cần set trên Azure:

```
DJANGO_SECRET_KEY
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=<domain>.azurewebsites.net
CORS_ALLOWED_ORIGINS=https://<frontend-domain>
CSRF_TRUSTED_ORIGINS=https://<frontend-domain>
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_SSLMODE=require
AUTH_POSTGRES_DB=auth_service
AUTH_POSTGRES_HOST=<azure-postgres-host>
```

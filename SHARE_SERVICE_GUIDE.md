# Share Service - Hướng Dẫn Chi Tiết

## 🚀 Cấu Trúc Code

```
shares/
├── models.py          → ShareLink model (token, file_id, owner_id, etc)
├── serializers.py     → Validation + serialization
├── views.py           → 6 endpoints
├── urls.py            → Route mapping
└── migrations/
```

## 📡 Các Endpoints

### 1️⃣ Health Check (Public)

```bash
GET http://localhost:8003/api/health/
```

Response:

```json
{ "service": "share-service", "status": "ok" }
```

---

### 2️⃣ Tạo Share Link (JWT Required)

```bash
POST http://localhost:8003/api/shares/create/
Header: Authorization: Bearer <access_token>
Body:
{
  "file_id": 1,
  "is_active": true,
  "expires_at": null
}
```

**Validation:**

- ✅ Kiểm tra file tồn tại ở file-service
- ✅ Kiểm tra expires_at không là quá khứ
- ✅ Tự động set owner_id từ JWT

Response:

```json
{
  "id": 1,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "file_id": 1,
  "owner_id": 1,
  "is_active": true,
  "created_at": "2026-06-04T13:26:47.123456Z",
  "expires_at": null
}
```

---

### 3️⃣ Danh Sách Share Link của User (JWT Required)

```bash
GET http://localhost:8003/api/shares/
Header: Authorization: Bearer <access_token>
```

Response:

```json
[
  {
    "id": 1,
    "token": "550e8400-e29b-41d4-a716-446655440000",
    "file_id": 1,
    "owner_id": 1,
    "is_active": true,
    "created_at": "2026-06-04T13:26:47.123456Z",
    "expires_at": null
  }
]
```

---

### 4️⃣ Cập Nhật Share Link (JWT Required)

```bash
PATCH http://localhost:8003/api/shares/<token>/
Header: Authorization: Bearer <access_token>
Body:
{
  "is_active": false,
  "expires_at": "2026-06-11T00:00:00Z"
}
```

**Chỉ owner của share link mới được update**

Response: Updated ShareLink object

---

### 5️⃣ Xóa Share Link (JWT Required)

```bash
DELETE http://localhost:8003/api/shares/<token>/delete/
Header: Authorization: Bearer <access_token>
```

**Chỉ owner của share link mới được xóa**

Response: 204 No Content

---

### 6️⃣ Xem Public Share (Public - Không cần JWT)

```bash
GET http://localhost:8003/api/public/<token>/
```

**Validation:**

- ✅ Kiểm tra share link tồn tại
- ✅ Kiểm tra is_active=true
- ✅ Kiểm tra chưa hết hạn (expires_at)

Response:

```json
{
  "id": 1,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "file_id": 1,
  "owner_id": 1,
  "is_active": true,
  "created_at": "2026-06-04T13:26:47.123456Z",
  "expires_at": null
}
```

Nếu share link hết hạn → `410 GONE`
Nếu không tìm thấy → `404 NOT FOUND`

---

## 🧪 Test Scenario Đầy Đủ

### Step 1: Tạo User ở Auth Service

```bash
POST http://localhost:8001/api/auth/register/
Body:
{
  "username": "ngoc",
  "email": "ngoc@test.com",
  "password": "TestPass123!"
}
```

### Step 2: Login lấy Token

```bash
POST http://localhost:8001/api/auth/login/
Body:
{
  "username": "ngoc",
  "password": "TestPass123!"
}
```

Copy `access_token` từ response

### Step 3: Upload File

```bash
POST http://localhost:8002/api/files/upload/
Header: Authorization: Bearer <access_token>
Body: form-data {
  file: <select any file>
}
```

Copy `id` từ response (VD: file_id = 1)

### Step 4: Tạo Share Link ✨

```bash
POST http://localhost:8003/api/shares/create/
Header: Authorization: Bearer <access_token>
Body:
{
  "file_id": 1,
  "is_active": true,
  "expires_at": null
}
```

Copy `token` từ response

### Step 5: Xem Share Links của mình

```bash
GET http://localhost:8003/api/shares/
Header: Authorization: Bearer <access_token>
```

### Step 6: Chia Sẻ Link Công Khai

Gửi public URL cho người khác:

```
http://localhost:8003/api/public/<token>/
```

(Không cần JWT, ai cũng xem được!)

### Step 7: Tắt Share Link

```bash
PATCH http://localhost:8003/api/shares/<token>/
Header: Authorization: Bearer <access_token>
Body:
{
  "is_active": false
}
```

### Step 8: Xóa Share Link

```bash
DELETE http://localhost:8003/api/shares/<token>/delete/
Header: Authorization: Bearer <access_token>
```

---

## 🔧 Code Implementation Details

### File: `views.py`

**Tính Năng:**

1. **verify_file_exists()** - Call file-service để check file
2. **Logging** - Tất cả actions được log
3. **Error Handling** - Try-catch với proper status codes
4. **Expiration Check** - Validate expires_at
5. **Authorization** - Check user_id trùng khớp

### File: `models.py`

```python
class ShareLink(models.Model):
    token = UUIDField(unique=True)          # Public key
    file_id = PositiveIntegerField()        # Ref to file-service
    owner_id = PositiveIntegerField()       # Ref to auth-service
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    expires_at = DateTimeField(null=True)   # null = never expires
```

---

## 🔐 Security

- ✅ JWT authentication bắt buộc cho create/read/update/delete
- ✅ User chỉ được thao tác share link của chính họ
- ✅ Public share không lộ thông tin user (chỉ share data)
- ✅ Expiration tự động "hết hạn" (410 GONE)

---

## 🐛 Troubleshooting

| Problem             | Solution                              |
| ------------------- | ------------------------------------- |
| 401 Unauthorized    | Kiểm tra JWT token còn hiệu lực?      |
| 404 Share not found | Token sai hoặc không phải owner       |
| 410 Gone            | Share link hết hạn, tạo link mới      |
| File service error  | Kiểm tra file-service chạy port 8002? |
| Permission Denied   | Chỉ owner mới được update/delete      |

---

## 📊 Status Codes

| Code | Meaning                            |
| ---- | ---------------------------------- |
| 200  | OK - GET successful                |
| 201  | Created - POST successful          |
| 204  | No Content - DELETE successful     |
| 400  | Bad Request - Invalid data         |
| 401  | Unauthorized - Missing/invalid JWT |
| 404  | Not Found - Resource doesn't exist |
| 410  | Gone - Share link expired          |
| 500  | Server Error                       |

---

## ✨ Next Steps

- [ ] Test từng endpoint với Postman/Thunder Client
- [ ] Kiểm tra logs trong terminal
- [ ] Test edge cases (expired links, non-existent files, etc)
- [ ] Integrate frontend vào
- [ ] Deploy lên Azure

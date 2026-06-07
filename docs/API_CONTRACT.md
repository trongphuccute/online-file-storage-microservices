# API Contract MVP

Dung file nay de 3 thanh vien thong nhat endpoint, tranh moi nguoi code mot kieu.

## Auth Service

Base URL local: `http://localhost:8001/api`

### Register

`POST /auth/register/`

```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "password123"
}
```

Response trả về JWT token luôn, không cần login lại:

```json
{
  "user": { "id": 1, "username": "demo", "email": "demo@example.com", "date_joined": "..." },
  "access": "<access_token>",
  "refresh": "<refresh_token>"
}
```

### Login

`POST /auth/login/`

```json
{
  "username": "demo",
  "password": "password123"
}
```

Response:

```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>",
  "username": "demo",
  "email": "demo@example.com",
  "user_id": 1
}
```

### Profile

`GET /auth/profile/`

Header:

```text
Authorization: Bearer <access_token>
```

### Logout

`POST /auth/logout/`

Header:

```text
Authorization: Bearer <access_token>
```

Body:

```json
{
  "refresh": "<refresh_token>"
}
```

Response: `200 OK`

### Change Password

`POST /auth/change-password/`

Header:

```text
Authorization: Bearer <access_token>
```

Body:

```json
{
  "old_password": "password123",
  "new_password": "newpassword456"
}
```

Response: `200 OK`

## File Service

Base URL local: `http://localhost:8002/api`

Tat ca endpoint tru `health` can JWT.

### List files

`GET /files/`

### Upload file

`POST /files/upload/`

Form-data:

```text
file: <binary>
```

### Delete file

`DELETE /files/<file_id>/`

### Quota

`GET /quota/`

## Share Service

Base URL local: `http://localhost:8003/api`

### Create share link

`POST /shares/create/`

```json
{
  "file_id": 1,
  "expires_at": null,
  "is_active": true
}
```

### My share links

`GET /shares/`

### Public share

`GET /public/<token>/`

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

### Login

`POST /auth/login/`

```json
{
  "username": "demo",
  "password": "password123"
}
```

Response co `access` va `refresh`.

### Profile

`GET /auth/profile/`

Header:

```text
Authorization: Bearer <access_token>
```

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

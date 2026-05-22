# Huong Dan Setup Du An Cho Nhom

Huong dan nay tap trung vao cach chay truc tiep khong Docker.

## 1. Clone source

```powershell
git clone <repo-url>
cd <repo-folder>
```

## 2. Tao file moi truong

```powershell
Copy-Item .env.example .env
```

## 3. Cai PostgreSQL

Dung PostgreSQL local hoac Azure PostgreSQL.

Can tao 3 database:

```sql
CREATE DATABASE auth_service;
CREATE DATABASE file_service;
CREATE DATABASE share_service;
```

Neu dung Azure PostgreSQL, cap nhat trong `.env`:

- `AUTH_POSTGRES_HOST`
- `FILE_POSTGRES_HOST`
- `SHARE_POSTGRES_HOST`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_SSLMODE=require`

## 4. Chay backend

### Auth Service

```powershell
cd auth-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

### File Service

```powershell
cd file-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8002
```

### Share Service

```powershell
cd share-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8003
```

## 5. Chay frontend

```powershell
cd frontend-nextjs
npm install
npm run dev
```

Kiem tra:

- http://localhost:3000
- http://localhost:8001/api/health/
- http://localhost:8002/api/health/
- http://localhost:8003/api/health/

## 6. Workflow GitHub

1. Tao branch rieng theo phan cong.
2. Code va commit tren branch cua minh.
3. Push branch len GitHub.
4. Tao Pull Request vao `main`.
5. Nhom review, fix conflict neu co, sau do merge.

Branch goi y:

- `auth-service-branch`: Auth Service, JWT, PostgreSQL, Azure deploy
- `file-service-branch`: Upload/download, Blob Storage, quota, file CRUD
- `frontend-share-branch`: Next.js UI, share link, preview image/PDF, dashboard responsive

## 7. Tai lieu tiep theo

- Roadmap 1 thang: [ONE_MONTH_PLAN.md](ONE_MONTH_PLAN.md)
- Deploy source code len Azure: [NO_DOCKER_DEPLOY.md](NO_DOCKER_DEPLOY.md)
- API contract: [API_CONTRACT.md](API_CONTRACT.md)
- Checklist demo: [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md)

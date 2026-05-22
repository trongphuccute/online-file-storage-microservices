# Chay Va Deploy Khong Can Docker

Day la huong chinh cua du an de nhe may va tap trung vao san pham demo.

## 1. Kien truc deploy

- Frontend Next.js: Vercel hoac Azure Static Web Apps
- `auth-service`: Azure App Service Python
- `file-service`: Azure App Service Python
- `share-service`: Azure App Service Python
- Database: Azure Database for PostgreSQL
- File storage: Azure Blob Storage

Du an khong yeu cau Docker.

## 2. Chay local

### Cai san

- Python 3.11+
- Node.js 20+
- PostgreSQL local hoac PostgreSQL cloud

Tao file env local:

```powershell
Copy-Item .env.example .env
```

Can tao 3 database PostgreSQL:

```sql
CREATE DATABASE auth_service;
CREATE DATABASE file_service;
CREATE DATABASE share_service;
```

### Chay Auth Service

Mo terminal 1:

```powershell
cd auth-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

### Chay File Service

Mo terminal 2:

```powershell
cd file-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8002
```

### Chay Share Service

Mo terminal 3:

```powershell
cd share-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8003
```

### Chay Frontend

Mo terminal 4:

```powershell
cd frontend-nextjs
npm install
npm run dev
```

Kiem tra:

- Frontend: `http://localhost:3000`
- Auth: `http://localhost:8001/api/health/`
- File: `http://localhost:8002/api/health/`
- Share: `http://localhost:8003/api/health/`

## 3. Deploy backend len Azure App Service

Tao 3 Azure App Service rieng:

- `<auth-app>` cho `auth-service`
- `<file-app>` cho `file-service`
- `<share-app>` cho `share-service`

Runtime:

- Python 3.11
- Linux App Service

Startup command tung app:

```text
bash startup.sh
```

Neu Azure khong chay duoc `startup.sh`, dung startup command truc tiep:

```text
python manage.py migrate && gunicorn auth_service.wsgi:application --bind 0.0.0.0:$PORT
```

Doi `auth_service` thanh `file_service` hoac `share_service` theo app tuong ung.

## 4. Bien moi truong tren Azure

Copy tu `.env.azure.example` len App Service Configuration.

Moi backend app can cac bien chung:

```text
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_PORT
POSTGRES_SSLMODE
DJANGO_SECRET_KEY
DJANGO_DEBUG
DJANGO_ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS
AZURE_STORAGE_CONNECTION_STRING
AZURE_STORAGE_CONTAINER
```

Auth app can:

```text
AUTH_POSTGRES_DB
AUTH_POSTGRES_HOST
```

File app can:

```text
FILE_POSTGRES_DB
FILE_POSTGRES_HOST
```

Share app can:

```text
SHARE_POSTGRES_DB
SHARE_POSTGRES_HOST
```

De don gian, co the dung chung 1 Azure PostgreSQL server nhung tao 3 database rieng.

## 5. Deploy frontend

### Cach de nhat: Vercel

1. Push repo len GitHub.
2. Import project vao Vercel.
3. Chon root directory: `frontend-nextjs`.
4. Them env:

```text
NEXT_PUBLIC_AUTH_API_URL=https://<auth-app>.azurewebsites.net/api
NEXT_PUBLIC_FILE_API_URL=https://<file-app>.azurewebsites.net/api
NEXT_PUBLIC_SHARE_API_URL=https://<share-app>.azurewebsites.net/api
```

5. Deploy.

### Cach Azure: Static Web Apps

Neu dung Azure Static Web Apps:

- App location: `frontend-nextjs`
- Build command: `npm run build`
- Output location: `.next`

Neu gap loi voi Next.js SSR, chuyen sang Vercel cho nhanh va on dinh hon trong deadline 1 thang.

## 6. Thu tu lam de it loi

1. Chay local.
2. Tao Azure PostgreSQL va 3 database.
3. Deploy `auth-service`, test login/register.
4. Deploy `file-service`, test upload/list/delete.
5. Deploy `share-service`, test create/public share.
6. Deploy frontend.
7. Cap nhat CORS theo domain frontend that.
8. Chup screenshot lam bao cao.

## 7. Ghi vao bao cao

Co the ghi:

```text
De toi uu tai nguyen may ca nhan va phu hop voi deadline 1 thang, nhom su dung phuong an chay truc tiep bang Python/Node.js khi phat trien. Khi deploy, source code backend duoc dua len Azure App Service, frontend deploy len Vercel/Azure Static Web Apps, database dung Azure PostgreSQL va file storage dung Azure Blob Storage.
```

# Online File Storage Microservices

Monorepo do an Cloud Computing theo kien truc Microservices, tap trung vao cach chay va deploy khong Docker de nhe may va kip tien do 1 thang.

- `frontend-nextjs`: Next.js + React + TypeScript + TailwindCSS
- `auth-service`: Django REST Framework, JWT, user profile
- `file-service`: Django REST Framework, file metadata, quota, Azure Blob-ready config
- `share-service`: Django REST Framework, public share link
- `docs`: tai lieu setup, workflow, API contract va deploy

## Chay local

Yeu cau cai san:

- Git
- Python 3.11+
- Node.js 20+
- PostgreSQL local hoac Azure PostgreSQL

Tao file moi truong:

```powershell
Copy-Item .env.example .env
```

Tao 3 database PostgreSQL:

```sql
CREATE DATABASE auth_service;
CREATE DATABASE file_service;
CREATE DATABASE share_service;
```

Chay tung service o terminal rieng:

```powershell
cd auth-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

Lam tuong tu:

- `file-service`: port `8002`
- `share-service`: port `8003`

Frontend:

```powershell
cd frontend-nextjs
npm install
npm run dev
```

Dia chi local:

- Frontend: http://localhost:3000
- Auth API: http://localhost:8001/api/
- File API: http://localhost:8002/api/
- Share API: http://localhost:8003/api/

## Deploy

Huong deploy chinh:

- Frontend: Vercel hoac Azure Static Web Apps
- Backend: 3 Azure App Service Python rieng
- Database: Azure Database for PostgreSQL
- Storage: Azure Blob Storage

Xem chi tiet tai [docs/NO_DOCKER_DEPLOY.md](docs/NO_DOCKER_DEPLOY.md).

## Tai lieu quan trong

- Roadmap 1 thang: [docs/ONE_MONTH_PLAN.md](docs/ONE_MONTH_PLAN.md)
- Setup/deploy khong Docker: [docs/NO_DOCKER_DEPLOY.md](docs/NO_DOCKER_DEPLOY.md)
- API contract: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
- Checklist demo: [docs/DEMO_CHECKLIST.md](docs/DEMO_CHECKLIST.md)
- Lenh hay dung: [scripts.md](scripts.md)

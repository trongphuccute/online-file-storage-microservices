# Lenh Thuong Dung

## Tao moi truong local

```powershell
Copy-Item .env.example .env
```

## Chay Auth Service

```powershell
cd auth-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

## Chay File Service

```powershell
cd file-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8002
```

## Chay Share Service

```powershell
cd share-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8003
```

## Chay Frontend

```powershell
cd frontend-nextjs
npm install
npm run dev
```

## Tao branch theo thanh vien

```powershell
git checkout -b auth-service-branch
git checkout -b file-service-branch
git checkout -b frontend-share-branch
```

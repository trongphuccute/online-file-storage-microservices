# Ke Hoach Toi Uu Cho Du An 1 Thang

Muc tieu: co ban demo end-to-end chay duoc, dung dung cong nghe trong de tai, tranh mo rong tinh nang qua muc.

## 1. MVP bat buoc

Can hoan thanh truoc khi lam tinh nang phu:

- Dang ky, dang nhap JWT
- Dashboard danh sach file
- Upload file va luu metadata
- Xoa file
- Tao share link public
- Preview anh truc tiep
- Preview PDF bang iframe/browser native
- Quota co ban theo tong dung luong metadata
- Chay local truc tiep bang Python/Node.js
- Tai lieu setup va demo

## 2. Cat giam de kip tien do

Khong nen lam trong thang dau neu chua xong MVP:

- Realtime notification
- Folder tree phuc tap
- Search nang cao
- Role/permission nhieu cap
- Payment/package quota
- Virus scan
- Multi-region Azure
- UI animation phuc tap

## 3. Kien truc toi uu

Van giu microservices theo docs:

- `auth-service`: login/register/profile
- `file-service`: upload/delete/list/quota
- `share-service`: create share/public share
- `frontend-nextjs`: dashboard va API client

Quy tac de giam do phuc tap:

- Moi service co database rieng.
- JWT secret dung chung trong `.env` de cac service verify token.
- Frontend goi truc tiep 3 API local trong giai do demo.
- File upload local co the chi luu metadata neu chua co Azure Blob.
- Azure Blob integration uu tien sau khi CRUD local on dinh.

## 4. Phan cong 3 nguoi

### Thanh vien 1: Auth + Deploy

- Register/login/profile
- JWT config chung
- PostgreSQL local/Azure
- Azure App Service setup
- Viet phan deploy trong report

### Thanh vien 2: File Service

- File model, upload, list, delete
- Quota co ban
- Azure Blob Storage integration
- Test API bang Postman/Thunder Client

### Thanh vien 3: Frontend + Share

- Next.js dashboard
- Login/register screen
- Upload/list/delete UI
- Share link UI
- Preview image/PDF
- Responsive va slide demo

## 5. Timeline 4 tuan

### Tuan 1: Nen tang

- Chay duoc 3 backend va frontend khong Docker
- Auth register/login xong
- Frontend co layout dashboard
- File/share service co health endpoint

Ket qua demo: mo web, health API xanh, login lay JWT.

### Tuan 2: File CRUD

- Upload/list/delete API
- Frontend goi API that
- Quota co ban
- Test voi PostgreSQL

Ket qua demo: user login va quan ly file co ban.

### Tuan 3: Share + Preview + Azure

- Tao share link
- Public share page/API
- Preview anh/PDF
- Ket noi Azure Blob Storage

Ket qua demo: upload file, tao link, mo link public xem preview.

### Tuan 4: Deploy + Fix + Bao cao

- Deploy backend toi Azure App Service
- Deploy frontend len Vercel hoac Azure Static Web Apps
- Chay test end-to-end
- Fix UI va API bug
- Viet report, slide, quay demo backup

Ket qua demo: co ban local on dinh va ban deploy neu kip.

## 6. Definition of Done

Moi tinh nang chi tinh la xong khi:

- Co API endpoint hoat dong.
- Co UI hoac cach test ro rang.
- Co huong dan env/config neu can.
- Khong lam hong cach chay local truc tiep.
- Co screenshot hoac ghi chu demo de dua vao report.

## 7. Thu tu uu tien

1. Local khong Docker chay duoc.
2. Auth JWT.
3. File CRUD.
4. Frontend dashboard goi API that.
5. Share link.
6. Preview image/PDF.
7. Azure Blob.
8. Azure deploy.
9. UI polish.
10. Chuc nang phu.

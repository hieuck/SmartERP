# 🚀 Getting Started - SmartERP

Hướng dẫn chạy dự án SmartERP trên máy local.

---

## 📋 Yêu Cầu

- Node.js v18+
- PostgreSQL v14+
- npm hoặc yarn

---

## 🔧 Setup Nhanh

### 1. Database

```bash
psql -U postgres
CREATE DATABASE smarterp_dev;
\q
```

### 2. Backend

```bash
cd smart-erp/backend/monolith-app
cp .env.example .env
# Edit .env: database credentials
npm install
npm install compression @types/compression
npm run migration:run
npm run start:dev
```

### 3. Frontend

```bash
cd smart-erp/frontend
cp .env.example .env
npm install
npm run dev
```

---

## ✅ Kiểm Tra

- Backend: http://localhost:3000/api/docs
- Frontend: http://localhost:5173
- Health: http://localhost:3000/api/health

---

## 📚 Chi Tiết

Xem file README.md trong từng folder để biết thêm chi tiết.

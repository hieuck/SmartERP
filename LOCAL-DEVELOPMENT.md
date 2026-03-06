# 🏠 SmartERP - Local Development Guide

Hướng dẫn chi tiết để chạy SmartERP trên máy local với runtime portable.

---

## 📋 Tổng Quan

SmartERP cung cấp 2 cách chạy local:

1. **Runtime Portable** (Khuyến nghị) - Dùng Node.js và PostgreSQL portable
2. **System Installation** - Dùng Node.js và PostgreSQL đã cài trên hệ thống

---

## 🚀 Quick Start (Runtime Portable)

### Bước 1: Kiểm tra trạng thái

```bash
check-status.bat
```

Kiểm tra:
- Backend có đang chạy không
- Frontend có đang chạy không
- PostgreSQL có đang chạy không

### Bước 2: Khởi động services

```bash
start-local.bat
```

Chọn mode:
- **1**: Backend only (http://localhost:3000)
- **2**: Frontend only (http://localhost:5173)
- **3**: Both Backend + Frontend

Script tự động:
- Kiểm tra runtime Node.js
- Install dependencies nếu chưa có
- Khởi động services trong terminal riêng

### Bước 3: Truy cập ứng dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

---

## 📁 Scripts Có Sẵn

### check-status.bat

Kiểm tra trạng thái các services:

```bash
check-status.bat
```

**Output:**
```
[OK] Backend is running
[X] Frontend is not running
[OK] PostgreSQL is listening on port 5432
```

### start-local.bat

Khởi động development servers:

```bash
start-local.bat
```

**Features:**
- Interactive menu
- Auto-install dependencies
- Separate terminal windows
- Uses runtime Node.js

### test-with-runtime.bat

Chạy backend tests với coverage:

```bash
test-with-runtime.bat
```

**Output:**
- Test results (788 tests)
- Coverage report (60%+)

---

## 🔧 Setup Chi Tiết

### 1. Database Setup

#### Option A: Runtime PostgreSQL (Portable)

```bash
# Khởi động
cd runtime\postgresql\bin
pg_ctl -D ..\data start

# Tạo database
psql -U postgres
CREATE DATABASE smarterp_dev;
\q
```

#### Option B: System PostgreSQL

```bash
# Tạo database
psql -U postgres
CREATE DATABASE smarterp_dev;
\q
```

### 2. Backend Setup

```bash
cd backend\monolith-app

# Copy environment file
copy .env.example .env

# Edit .env với database credentials
notepad .env

# Install dependencies (runtime)
..\..\runtime\nodejs\npm.cmd install

# Run migrations
..\..\runtime\nodejs\npm.cmd run migration:run

# Start development server
..\..\runtime\nodejs\npm.cmd run start:dev
```

**Backend URLs:**
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/health

### 3. Frontend Setup

```bash
cd frontend

# Copy environment file
copy .env.example .env

# Install dependencies (runtime)
..\runtime\nodejs\npm.cmd install

# Start development server
..\runtime\nodejs\npm.cmd run dev
```

**Frontend URL:**
- App: http://localhost:5173

---

## 🧪 Testing

### Backend Tests

```bash
# All tests with coverage (recommended)
test-with-runtime.bat

# Unit tests only
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd run test

# E2E tests
..\..\runtime\nodejs\npm.cmd run test:e2e

# Watch mode
..\..\runtime\nodejs\npm.cmd run test:watch
```

**Current Status:**
- ✅ 788/788 tests passing (100%)
- ✅ Coverage: 60.02%
- ✅ Core modules: 60-93% coverage

### Frontend Tests

```bash
cd frontend
..\runtime\nodejs\npm.cmd run test
```

---

## 🛠️ Development Workflow

### Typical Day

1. **Morning - Start services:**
```bash
start-local.bat
# Choose option 3 (Both)
```

2. **Development:**
- Edit code in `backend/monolith-app/src/` or `frontend/src/`
- Hot reload tự động
- Check logs trong terminal windows

3. **Testing:**
```bash
# Run tests khi cần
test-with-runtime.bat
```

4. **Evening - Stop services:**
- Close terminal windows
- Hoặc Ctrl+C trong mỗi terminal

### Git Workflow

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "feat: your feature description"

# Push
git push origin main
```

---

## 📊 Monitoring

### Backend Logs

Backend logs hiển thị trong terminal:
- Request logs
- Error logs
- Database queries (nếu debug mode)

### Frontend Logs

Frontend logs hiển thị trong:
- Terminal (Vite logs)
- Browser Console (app logs)

### Database Logs

PostgreSQL logs (nếu cần):
```bash
cd runtime\postgresql\data\log
type postgresql-*.log
```

---

## 🐛 Troubleshooting

### Backend không khởi động

**Lỗi: Port 3000 already in use**

```bash
# Windows: Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Lỗi: Database connection failed**

1. Kiểm tra PostgreSQL đang chạy:
```bash
check-status.bat
```

2. Kiểm tra credentials trong `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=smarterp_dev
```

3. Test connection:
```bash
cd runtime\postgresql\bin
psql -U postgres -d smarterp_dev
```

### Frontend không khởi động

**Lỗi: Port 5173 already in use**

```bash
# Windows: Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Lỗi: Cannot connect to backend**

1. Kiểm tra backend đang chạy:
```bash
curl http://localhost:3000/api/health
```

2. Kiểm tra CORS trong backend `.env`:
```
CORS_ORIGIN=*
```

### Runtime Node.js không tìm thấy

**Lỗi: Runtime Node.js not found**

1. Kiểm tra folder tồn tại:
```bash
dir runtime\nodejs\node.exe
```

2. Nếu không có, download Node.js portable

### Tests fail

**Lỗi: Cannot find module**

```bash
# Reinstall dependencies
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd install
```

---

## 🔄 Common Tasks

### Update Dependencies

```bash
# Backend
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd update

# Frontend
cd frontend
..\runtime\nodejs\npm.cmd update
```

### Database Migrations

```bash
cd backend\monolith-app

# Create new migration
..\..\runtime\nodejs\npm.cmd run migration:create -- -n MigrationName

# Run migrations
..\..\runtime\nodejs\npm.cmd run migration:run

# Revert last migration
..\..\runtime\nodejs\npm.cmd run migration:revert
```

---

## 📚 Tài Liệu Liên Quan

- [GETTING-STARTED.md](./GETTING-STARTED.md) - Quick start guide
- [RUNTIME-GUIDE.md](./RUNTIME-GUIDE.md) - Runtime portable guide
- [backend/monolith-app/README.md](./backend/monolith-app/README.md) - Backend docs
- [frontend/README.md](./frontend/README.md) - Frontend docs

---

**Happy Coding! 🚀**

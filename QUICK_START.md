# 🚀 SmartERP - Quick Start Guide

## 1-Click Startup

Chạy toàn bộ project chỉ với 1 lệnh.

### Yêu Cầu Trước Tiên

Cài đặt các công cụ sau:

- **Node.js** 16+ (https://nodejs.org/)
- **Docker** (https://www.docker.com/products/docker-desktop)
- **Docker Compose** (thường đi kèm Docker Desktop)

Kiểm tra:

```bash
node --version
docker --version
docker-compose --version
```

### Chạy Trên Windows

```powershell
# Mở PowerShell và chạy:
.\scripts\start-all.ps1
```

Nếu gặp lỗi permission, chạy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\start-all.ps1
```

### Chạy Trên macOS / Linux

```bash
# Mở Terminal và chạy:
chmod +x scripts/start-all.sh
./scripts/start-all.sh
```

### Kết Quả

Nếu thành công, bạn sẽ thấy:

```
🎉 SmartERP đã khởi động thành công!

📍 Truy cập:
   • Frontend:  http://localhost:5173
   • API:       http://localhost:3000
   • API Docs:  http://localhost:3000/api/docs
   • Database:  localhost:5432
   • Redis:     localhost:6379
```

Mở browser và truy cập: **http://localhost:5173**

---

## Startup Thủ Công (Nếu Script Không Chạy)

### Bước 1: Khởi động Database & Cache

```bash
docker-compose up -d postgres redis
```

Chờ 10 giây để services khởi động.

### Bước 2: Khởi tạo Database

```bash
cd src/backend
npm run db:init
cd ../..
```

### Bước 3: Khởi động Backend

Mở terminal mới:

```bash
cd src/backend
npm run start:dev
```

Chờ đến khi thấy:

```
[Nest] ... - 03/11/2026, 10:00:00 AM     LOG [NestFactory] Application successfully started
```

### Bước 4: Khởi động Frontend

Mở terminal mới:

```bash
cd src/frontend
npm run dev
```

Chờ đến khi thấy:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

---

## Dừng Project

### Cách 1: Dừng Script

Nhấn `Ctrl+C` trong terminal chạy script.

### Cách 2: Dừng Thủ Công

```bash
# Dừng Docker services
docker-compose down

# Dừng Backend & Frontend: Nhấn Ctrl+C trong mỗi terminal
```

---

## Troubleshooting

### ❌ "Docker is not running"

**Giải pháp**: Mở Docker Desktop

### ❌ "Port 5173 already in use"

**Giải pháp**:

```bash
# Tìm process dùng port 5173
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### ❌ "npm: command not found"

**Giải pháp**: Cài đặt Node.js từ https://nodejs.org/

### ❌ "Database connection failed"

**Giải pháp**:

```bash
# Kiểm tra PostgreSQL đang chạy
docker ps | grep postgres

# Nếu không chạy, khởi động lại
docker-compose up -d postgres
```

### ❌ "Cannot find module"

**Giải pháp**:

```bash
# Cài lại dependencies
cd src/backend && npm install && cd ../..
cd src/frontend && npm install && cd ../..
```

---

## Các Lệnh Hữu Ích

### Backend

```bash
cd src/backend

# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Testing
npm run test
npm run test:watch
npm run test:cov

# Database
npm run db:init          # Khởi tạo DB
npm run db:drop-create   # Reset DB
npm run migration:run    # Chạy migrations

# Linting
npm run lint
npm run format
```

### Frontend

```bash
cd src/frontend

# Development
npm run dev

# Production
npm run build
npm run preview

# Testing
npm run test
npm run test:ui
npm run test:coverage
npm run test:e2e

# Linting
npm run lint
```

### Docker

```bash
# Xem logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f backend

# Dừng services
docker-compose down

# Xóa volumes (cảnh báo: mất dữ liệu)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

---

## Cấu Trúc Project

```
smart-erp/
├── src/
│   ├── backend/          # NestJS API
│   ├── frontend/         # React + Vite
│   ├── mobile/           # React Native
│   └── shared/types/     # Shared types
├── database/             # Migrations
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── docker-compose.yml    # Docker config
├── .env                  # Environment variables
└── turbo.json           # Monorepo config
```

---

## Tài Liệu Thêm

- **Architecture**: Xem `PROJECT_STRUCTURE_ASSESSMENT.md`
- **API Docs**: http://localhost:3000/api/docs (khi backend chạy)
- **Giao tiếp Tiếng Việt**: Xem `.kiro/steering/vietnamese-communication.md`

---

## Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra logs:
   - Backend: `src/backend/logs/`
   - Frontend: Terminal

2. Xem troubleshooting ở trên

3. Kiểm tra `.env` file có đúng không

4. Thử reset: `docker-compose down -v && docker-compose up -d`

---

**Chúc bạn sử dụng SmartERP vui vẻ! 🎉**

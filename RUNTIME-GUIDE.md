# SmartERP Runtime Guide

## Giới thiệu

SmartERP sử dụng **portable runtime** để đảm bảo môi trường phát triển nhất quán, không phụ thuộc vào cài đặt hệ thống.

Runtime bao gồm:
- **Node.js portable**: Chạy backend và frontend
- **PostgreSQL portable**: Database server

## Cấu trúc thư mục

```
smart-erp/
├── runtime/
│   ├── nodejs/           # Node.js portable
│   │   ├── node.exe
│   │   ├── npm.cmd
│   │   └── ...
│   └── postgresql/       # PostgreSQL portable
│       ├── bin/
│       ├── data/
│       └── ...
├── test-with-runtime.bat # Script chạy tests
└── ...
```

## Scripts có sẵn

### 1. test-with-runtime.bat

Chạy backend tests với coverage sử dụng runtime Node.js:

```bash
test-with-runtime.bat
```

**Chức năng:**
- Kiểm tra runtime Node.js tồn tại
- Hiển thị Node.js version
- Chạy `npm run test:cov` trong backend/monolith-app
- Hiển thị coverage report

## Sử dụng Runtime thủ công

### Backend

```bash
# Windows
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd install
..\..\runtime\nodejs\npm.cmd run start:dev
```

### Frontend

```bash
# Windows
cd frontend
..\runtime\nodejs\npm.cmd install
..\runtime\nodejs\npm.cmd run dev
```

### Tests

```bash
# Backend tests
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd run test

# Backend tests with coverage
..\..\runtime\nodejs\npm.cmd run test:cov

# E2E tests
..\..\runtime\nodejs\npm.cmd run test:e2e
```

## PostgreSQL Runtime

### Khởi động PostgreSQL

```bash
cd runtime\postgresql\bin
pg_ctl -D ..\data start
```

### Dừng PostgreSQL

```bash
cd runtime\postgresql\bin
pg_ctl -D ..\data stop
```

### Kết nối PostgreSQL

```bash
cd runtime\postgresql\bin
psql -U postgres
```

## Lưu ý quan trọng

### ✅ DO

- Sử dụng runtime cho development và testing
- Giữ runtime trong `.gitignore` (đã config)
- Update runtime khi cần thiết
- Backup data trước khi update PostgreSQL

### ❌ DON'T

- Commit runtime vào git (quá lớn)
- Sửa đổi trực tiếp trong runtime/
- Dùng runtime cho production (dùng Docker)

## Troubleshooting

### Runtime Node.js không tìm thấy

**Lỗi:**
```
ERROR: Runtime Node.js not found at: runtime\nodejs
```

**Giải pháp:**
1. Kiểm tra `runtime/nodejs/node.exe` tồn tại
2. Download Node.js portable nếu chưa có
3. Giải nén vào `runtime/nodejs/`

### PostgreSQL không khởi động

**Lỗi:**
```
could not start server
```

**Giải pháp:**
1. Kiểm tra port 5432 đã được sử dụng chưa
2. Kiểm tra `runtime/postgresql/data/` tồn tại
3. Init database nếu chưa có:
```bash
cd runtime\postgresql\bin
initdb -D ..\data -U postgres
```

### Tests fail với runtime

**Lỗi:**
```
Cannot find module 'xxx'
```

**Giải pháp:**
1. Chạy `npm install` với runtime:
```bash
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd install
```
2. Clear cache:
```bash
..\..\runtime\nodejs\npm.cmd cache clean --force
```

## So sánh: Runtime vs System

| Tiêu chí | Runtime | System |
|----------|---------|--------|
| Cài đặt | Không cần | Cần cài Node.js |
| Version | Cố định | Có thể khác nhau |
| Portable | ✅ Có | ❌ Không |
| Performance | Tương đương | Tương đương |
| Dùng cho | Dev/Test | Dev/Test/Prod |

## Best Practices

### Development workflow

1. **Lần đầu setup:**
```bash
# Install dependencies với runtime
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd install

cd ..\..\frontend
..\runtime\nodejs\npm.cmd install
```

2. **Chạy tests:**
```bash
# Dùng script có sẵn
test-with-runtime.bat

# Hoặc thủ công
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd run test:cov
```

3. **Development:**
```bash
# Backend
cd backend\monolith-app
..\..\runtime\nodejs\npm.cmd run start:dev

# Frontend (terminal khác)
cd frontend
..\runtime\nodejs\npm.cmd run dev
```

### CI/CD

Không dùng runtime cho CI/CD. Dùng Docker hoặc system Node.js:

```yaml
# .github/workflows/test.yml
- uses: actions/setup-node@v3
  with:
    node-version: '18'
- run: npm install
- run: npm run test:cov
```

## Tài liệu liên quan

- [GETTING-STARTED.md](./GETTING-STARTED.md) - Hướng dẫn setup dự án
- [backend/monolith-app/README.md](./backend/monolith-app/README.md) - Backend docs
- [frontend/README.md](./frontend/README.md) - Frontend docs

---

**Lưu ý**: Runtime chỉ dùng cho development/testing. Production dùng Docker hoặc system installation.

# Hướng Dẫn Nhanh - Smart ERP

## 🚀 Khởi Động Nhanh

### Bước 1: Cài Đặt Dependencies

```bash
cd backend/monolith-app
npm install
```

### Bước 2: Cấu Hình Môi Trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cấu hình tối thiểu trong `.env`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=erp_production

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=*
```

### Bước 3: Khởi Động Database

**Sử dụng Docker (Khuyến nghị):**

```bash
# Từ thư mục gốc plaster-warehouse-erp
docker-compose up -d postgres redis
```

**Hoặc cài đặt thủ công:**
- PostgreSQL 15+
- Redis 7+

### Bước 4: Chạy Migrations

```bash
npm run migration:run
```

### Bước 5: Build và Khởi Động

```bash
# Build
npm run build

# Khởi động
npm start

# Hoặc chạy development mode
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3000**

---

## 📝 Đăng Ký và Sử Dụng

### 1. Đăng Ký Tenant (Công Ty) Mới

**Endpoint:** `POST /api/auth/register-tenant`

**Request Body:**
```json
{
  "tenantName": "Công Ty TNHH ABC",
  "tenantCode": "ABC",
  "adminEmail": "admin@abc.com",
  "adminPassword": "Password123!",
  "adminName": "Nguyễn Văn A",
  "phone": "0901234567",
  "address": "123 Đường ABC, Quận 1, TP.HCM"
}
```

**Response:**
```json
{
  "tenant": {
    "id": "uuid",
    "name": "Công Ty TNHH ABC",
    "code": "ABC",
    "status": "active",
    "trialEndsAt": "2026-03-15T00:00:00.000Z"
  },
  "user": {
    "id": "uuid",
    "email": "admin@abc.com",
    "name": "Nguyễn Văn A",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Tenant registered successfully with 14-day free trial"
}
```

**Sử dụng cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Công Ty TNHH ABC",
    "tenantCode": "ABC",
    "adminEmail": "admin@abc.com",
    "adminPassword": "Password123!",
    "adminName": "Nguyễn Văn A",
    "phone": "0901234567",
    "address": "123 Đường ABC, Quận 1, TP.HCM"
  }'
```

### 2. Đăng Nhập

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@abc.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@abc.com",
    "name": "Nguyễn Văn A",
    "role": "admin",
    "tenantId": "uuid"
  }
}
```

**Sử dụng cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@abc.com",
    "password": "Password123!"
  }'
```

### 3. Truy Cập API với Token

Sau khi đăng nhập, sử dụng `accessToken` trong header:

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📚 API Documentation

Sau khi khởi động ứng dụng, truy cập Swagger UI tại:

**http://localhost:3000/api/docs**

Tại đây bạn có thể:
- Xem tất cả các API endpoints
- Test API trực tiếp từ trình duyệt
- Xem request/response schemas
- Xem ví dụ cho mỗi endpoint

---

## 🔑 Các Chức Năng Chính

### Quản Lý Sản Phẩm
- `GET /api/products` - Danh sách sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `GET /api/products/:id` - Chi tiết sản phẩm
- `PATCH /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Quản Lý Kho
- `GET /api/inventory` - Danh sách tồn kho
- `POST /api/inventory` - Tạo phiếu nhập kho
- `PATCH /api/inventory/:id/adjust` - Điều chỉnh tồn kho

### Quản Lý Đơn Hàng
- `GET /api/orders` - Danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `PATCH /api/orders/:id/status` - Cập nhật trạng thái

### Quản Lý Khách Hàng
- `GET /api/customers` - Danh sách khách hàng
- `POST /api/customers` - Tạo khách hàng mới
- `GET /api/customers/:id` - Chi tiết khách hàng

### Quản Lý Nhà Cung Cấp
- `GET /api/suppliers` - Danh sách nhà cung cấp
- `POST /api/suppliers` - Tạo nhà cung cấp mới

---

## 🧪 Testing

### Chạy Tests

```bash
# Unit tests
npm test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Test API Live

```bash
npm run test:api-live
```

---

## 🐛 Troubleshooting

### Lỗi: Cannot connect to database

**Giải pháp:**
1. Kiểm tra PostgreSQL đang chạy: `docker ps` hoặc `pg_isready`
2. Kiểm tra thông tin kết nối trong `.env`
3. Thử kết nối thủ công: `psql -h localhost -U postgres -d erp_production`

### Lỗi: Cannot connect to Redis

**Giải pháp:**
1. Kiểm tra Redis đang chạy: `docker ps` hoặc `redis-cli ping`
2. Kiểm tra `REDIS_URL` trong `.env`

### Lỗi: Port 3000 already in use

**Giải pháp:**
1. Thay đổi `PORT` trong `.env`
2. Hoặc kill process đang dùng port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   ```

---

## 📖 Tài Liệu Bổ Sung

- [Architecture Documentation](../../docs/ARCHITECTURE.md)
- [API Design Standards](.kiro/steering/api-design.md)
- [Security Guidelines](.kiro/steering/security-guidelines.md)
- [Testing Standards](.kiro/steering/testing-standards.md)

---

## 🆘 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs: `docker-compose logs` hoặc console output
2. Xem API documentation tại `/api/docs`
3. Kiểm tra file `.env` đã cấu hình đúng chưa

---

**Phiên bản:** 1.0.0  
**Cập nhật:** 2026-03-01

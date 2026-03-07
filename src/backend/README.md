# Smart ERP - Monolith Application

Hệ thống ERP quản lý doanh nghiệp vừa và nhỏ (SME) với kiến trúc Modular Monolith.

## 🚀 Khởi Động Nhanh

```bash
# 1. Cài đặt
npm install

# 2. Cấu hình
cp .env.example .env

# 3. Khởi động database
docker-compose up -d postgres redis

# 4. Chạy migrations
npm run migration:run

# 5. Build và chạy
npm run build
npm start
```

Ứng dụng chạy tại: **http://localhost:3000**  
API Documentation: **http://localhost:3000/api/docs**

## 📝 Đăng Ký và Sử Dụng

### Đăng Ký Công Ty Mới

```bash
curl -X POST http://localhost:3000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Công Ty ABC",
    "tenantCode": "ABC",
    "adminEmail": "admin@abc.com",
    "adminPassword": "Password123!",
    "adminName": "Nguyễn Văn A"
  }'
```

### Đăng Nhập

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@abc.com",
    "password": "Password123!"
  }'
```

## 📚 Tài Liệu

- [Quick Start Guide](./QUICK-START.md) - Hướng dẫn chi tiết
- [API Documentation](http://localhost:3000/api/docs) - Swagger UI
- [Refactoring Report](../../.kiro/REFACTORING-COMPLETION-REPORT.md) - Báo cáo refactoring

## 🏗️ Kiến Trúc

- **Framework:** NestJS 10.x
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Language:** TypeScript 5.3
- **Architecture:** Modular Monolith

## 📦 Modules

34 business modules bao gồm:
- Auth, User, Role, Permission
- Product, Category, Inventory
- Order, Customer, Supplier
- Payment, Invoice, Accounting
- HR, Payroll, Production
- Notification, Audit, và nhiều hơn nữa

## 🧪 Testing

```bash
npm test              # Unit tests
npm run test:cov      # Coverage
npm run test:e2e      # E2E tests
```

## 📊 Status

- ✅ TypeScript: 0 errors
- ✅ Build: Success
- ✅ Tests: Passing
- ✅ API: 34 modules ready

## 📄 License

Private - Plaster Warehouse ERP

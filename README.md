# SmartERP - Enterprise Resource Planning System

[![Build Status](https://github.com/your-org/smart-erp/workflows/CI%20Pipeline/badge.svg)](https://github.com/your-org/smart-erp/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0--mvp-green.svg)](PROJECT_STATUS.md)

Modern, scalable ERP system with **offline-first architecture** for uninterrupted business operations.

**Status:** 75% Complete - Ready for Manual Testing | [View Progress](PROJECT_STATUS.md)

---

## 🌟 Key Features

### 💼 Core ERP Modules
- **Accounting:** General ledger, accounts payable/receivable
- **Inventory:** Stock management, warehouses, low stock alerts
- **Sales:** Customers, orders, invoices, payments
- **Purchasing:** Suppliers, purchase orders, receiving
- **Manufacturing:** BOMs, work orders, production tracking
- **HR:** Employees, attendance, payroll, leave management
- **Project Management:** Tasks, time tracking, resource allocation
- **E-commerce:** Product catalog, shopping cart, online orders

### 🔌 Offline-First Architecture

**What is Offline-First?**

Applications work seamlessly without internet. Data stored locally first, then synced when online.

**Why for ERP?**

- Traditional ERP fails when offline → Business stops
- Offline-first ERP → Work continues, auto-sync later
- Perfect for: Field sales, warehouses, remote branches, mobile workers

**Current Coverage:** 17% (14/82 entities)
- ✅ Products, Customers, Suppliers, Users
- ✅ Orders, Payments, Invoices, Warehouses
- ✅ Stock, Stock Receipts, Notifications, Attendance

**Architecture:**

```
User Interface (React + TypeScript)
    ↓
Local Database (IndexedDB + Dexie.js)
    ↓
Sync Manager (Conflict Resolution)
    ↓
Service Worker (Background Sync)
    ↕ HTTP/WebSocket
Backend API (NestJS + TypeScript)
    ↓
Database (PostgreSQL + Redis)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/smart-erp.git
cd smart-erp

# Install dependencies
cd src/backend && npm install
cd ../frontend && npm install
```

### Database Setup

```bash
cd src/backend

# Create database
npm run db:drop-create

# Run migrations
npm run migration:run

# Seed data (optional)
npm run seed
```

### Start Development

**Option 1: Docker (Recommended)**
```bash
docker-compose up -d
```

**Option 2: Manual**
```bash
# Terminal 1: Backend
cd src/backend
npm run start:dev

# Terminal 2: Frontend
cd src/frontend
npm run dev
```

### Access

- Frontend: http://localhost:5175
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/health

---

## 📖 Documentation

### User Guides
- [Offline-First Guide](docs/OFFLINE_FIRST_GUIDE.md)
- [FAQ](docs/FAQ.md)
- [Manual Test Plan](docs/DAY_2_3_MANUAL_TEST_PLAN.md)

### Technical Docs
- [MVP Launch Plan](docs/MVP_LAUNCH_PLAN.md)
- [Project Status](PROJECT_STATUS.md)
- [Security Audit](docs/SECURITY_AUDIT.md)
- [Database Schema](docs/DATABASE_SCHEMA_DESIGN.md)

### Architecture
- [Architecture Overview](docs/architecture/)
- [Deployment Guide](docs/deployment/)
- [Infrastructure](docs/infrastructure/)

---

## 🏗️ Tech Stack

### Backend
- **Framework:** NestJS 10
- **Language:** TypeScript 5
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **ORM:** TypeORM 0.3
- **API Docs:** Swagger/OpenAPI

### Frontend
- **Framework:** React 18
- **Language:** TypeScript 5
- **Build Tool:** Vite 5
- **UI Library:** Ant Design 5
- **State:** Redux Toolkit
- **Offline:** Dexie.js (IndexedDB)
- **Service Worker:** Workbox

### DevOps
- **CI/CD:** GitHub Actions
- **Containers:** Docker
- **Monitoring:** Sentry, Google Analytics 4
- **Health Checks:** 6 endpoints

---

## 🔒 Security

**Vulnerabilities:** 40 (dev dependencies only)
- Risk: LOW (no production impact)
- Status: Documented in [SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)
- Action: Fix post-MVP (Week 2-4)

**Security Features:**
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Environment variables for secrets
- ✅ HTTPS only in production

---

## 🧪 Testing

```bash
# Backend tests
cd src/backend
npm test
npm run test:cov

# Frontend tests
cd src/frontend
npm test
npm run test:cov
```

**Coverage:** Target 80%+

---

## 🚢 Deployment

### CI/CD Workflows

- **ci.yml:** Test, lint, build (on PR)
- **deploy-staging.yml:** Deploy to staging (on develop)
- **deploy-production.yml:** Deploy to production (on main)

### Production Deployment

See [PRODUCTION_DEPLOYMENT_GUIDE.md](docs/PRODUCTION_DEPLOYMENT_GUIDE.md)

---

## 📊 Project Status

**Progress:** 75% (3/4 MVP phases completed)

| Phase | Status | Date |
|-------|--------|------|
| Day 1: Dependencies + Builds | ✅ COMPLETED | 2026-03-15 |
| Day 4-7: Monitoring | ✅ COMPLETED | 2026-03-15 |
| Day 8-10: CI/CD | ✅ COMPLETED | 2026-03-15 |
| Day 2-3: Manual Testing | 🔄 READY | - |
| Day 11-14: Production Deployment | ⏭️ PLANNED | - |

**Features:** 54% (58/108)
**Offline-First:** 17% (14/82 entities)

[View Detailed Status](PROJECT_STATUS.md)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Run linter before commit

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 👥 Team & Support

**Repository:** https://github.com/your-org/smart-erp
**Issues:** https://github.com/your-org/smart-erp/issues
**Discussions:** https://github.com/your-org/smart-erp/discussions

---

## 🙏 Acknowledgments

- NestJS team for amazing framework
- React team for powerful UI library
- Ant Design for beautiful components
- Dexie.js for IndexedDB wrapper
- All contributors and supporters

---

**Made with ❤️ by SmartERP Team**

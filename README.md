# SmartERP - Enterprise Resource Planning System

Modern, scalable ERP system with **offline-first architecture** for uninterrupted business operations.

## 🌟 Key Features

### 💼 Core ERP Modules
- Accounting, Inventory, Sales, Purchasing, Manufacturing, HR, Project Management, E-commerce

### 🔌 Offline-First Architecture

**What is Offline-First?**

Applications work seamlessly without internet. Data stored locally first, then synced when online.

**Why for ERP?**

Traditional ERP fails when offline → Business stops
Offline-first ERP → Work continues, auto-sync later

**Architecture Diagram**

```
User Interface (React)
    ↓
Local Database (IndexedDB) - All data cached
    ↓
Sync Manager - Bidirectional sync, conflict resolution
    ↓
Service Worker - Background sync, caching
    ↕ HTTP/WebSocket
Backend API (NestJS) - Sync endpoints
    ↓
Database (PostgreSQL) - Multi-tenant, sync metadata
```

**Sync Strategies**

1. Version-Based (Recommended) - Optimistic locking, manual conflict resolution
2. Last-Write-Wins - Simple, server wins
3. Operational Transformation - For collaborative editing

**Offline Capabilities**

| Feature | Support | Notes |
|---------|---------|-------|
| View/Create/Update/Delete | ✅ Full | Queued for sync |
| Search | ✅ Full | Local IndexedDB |
| Reports | ⚠️ Partial | Cached only |
| Real-time | ❌ No | Needs connection |

**Use Cases**
- Field sales without internet
- Warehouse with poor WiFi
- Remote branches
- Mobile workers

## 🚀 Quick Start

```bash
# Clone & install
git clone <repo>
cd smart-erp
npm install

# Setup database
cd src/backend
npm run db:drop-create
npm run migration:run

# Start (Docker)
docker-compose up -d

# Or manual
cd src/backend && npm run start:dev
cd src/frontend && npm run dev
```

Access: http://localhost:5175

## 📖 Documentation

- API Docs: http://localhost:3000/api/docs
- [Database Schema](./docs/DATABASE_SCHEMA_DESIGN.md)
- [Offline Guide](./docs/OFFLINE_FIRST_GUIDE.md)

## 🏗️ Tech Stack

Backend: NestJS, TypeORM, PostgreSQL, Redis
Frontend: React, TypeScript, Dexie.js, Workbox

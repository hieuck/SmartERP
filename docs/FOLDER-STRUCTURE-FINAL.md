# Cấu Trúc Thư Mục SmartERP - Final Version

**Ngày cập nhật**: 2026-03-07  
**Trạng thái**: ✅ Hoàn thành sau landing page integration

## Tổng Quan

SmartERP là monorepo chứa 3 ứng dụng chính:
- Backend (NestJS)
- Frontend (React + Vite)
- Mobile (React Native)

## Cấu Trúc Root Level

```
smart-erp/
├── .git/                    # Git repository
├── .github/                 # GitHub workflows, actions, templates
├── .husky/                  # Git hooks (pre-commit, pre-push)
├── .turbo/                  # Turborepo cache
├── .vscode/                 # VS Code settings
├── config/                  # Configuration files
│   ├── docker/             # Docker compose files
│   ├── kubernetes/         # K8s manifests
│   ├── mongodb/            # MongoDB config
│   ├── monitoring/         # Prometheus, Grafana
│   ├── nginx/              # Nginx reverse proxy
│   └── postgres/           # PostgreSQL config
├── docs/                    # Documentation
│   ├── architecture/       # Architecture diagrams, ADRs
│   ├── deployment/         # Deployment guides
│   ├── features/           # Feature specifications
│   ├── guides/             # User guides, tutorials
│   ├── reports/            # Session reports, analysis
│   └── *.md               # Various documentation files
├── scripts/                 # Automation scripts
│   ├── autonomous-worker.ps1
│   ├── backup-automation.ps1/sh
│   ├── deploy-production.ps1/sh
│   ├── final-system-test.ps1/sh
│   └── ...
├── src/                     # Source code (3 apps)
│   ├── backend/            # NestJS backend
│   ├── frontend/           # React + Vite frontend
│   ├── mobile/             # React Native mobile
│   └── shared/             # Shared code (types, utils)
├── .dockerignore
├── .env*                    # Environment files
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── CHANGELOG.md             # Change log
├── CONTRIBUTING.md          # Contribution guidelines
├── jest.config.js           # Jest root config
├── LICENSE
├── README.md                # Project overview
├── ROADMAP.md               # Development roadmap
├── SECURITY.md              # Security policy
├── tsconfig.test.json       # TypeScript test config
└── turbo.json               # Turborepo config
```

## Chi Tiết Từng Thư Mục

### 1. `/config` - Configuration Files

```
config/
├── docker/
│   ├── docker-compose.yml           # Development environment
│   ├── docker-compose.prod.yml      # Production environment
│   └── docker-compose.test.yml      # Testing environment
├── kubernetes/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   └── services.yaml
├── mongodb/
│   └── mongod.conf
├── monitoring/
│   ├── prometheus.yml
│   └── grafana-dashboards/
├── nginx/
│   ├── nginx.conf
│   └── ssl/
└── postgres/
    └── postgresql.conf
```

**Mục đích**: Tách biệt configuration khỏi code, dễ quản lý môi trường khác nhau.

### 2. `/docs` - Documentation

```
docs/
├── architecture/
│   ├── adr/                         # Architecture Decision Records
│   ├── diagrams/                    # System diagrams
│   └── patterns/                    # Design patterns
├── deployment/
│   ├── aws-deployment.md
│   ├── docker-deployment.md
│   └── kubernetes-deployment.md
├── features/
│   ├── inventory-management.md
│   ├── order-management.md
│   └── production-management.md
├── guides/
│   ├── getting-started.md
│   ├── api-documentation.md
│   └── troubleshooting.md
├── reports/
│   ├── SESSION-2026-03-07-REPORT.md
│   └── RESEARCH-SESSION-2026-03-07.md
├── AUTONOMOUS-DEVELOPMENT-SETUP.md
├── ERPNEXT-ARCHITECTURE-ANALYSIS.md
├── FOLDER-STRUCTURE-FINAL.md        # This file
├── IMPLEMENTATION-RECOMMENDATIONS.md
├── LANDING-PAGE-INTEGRATION-PLAN.md
├── MASTER-ACTION-PLAN.md
├── ODOO-ARCHITECTURE-ANALYSIS.md
├── PERFORMANCE-OPTIMIZATION-PLAN.md
├── PRODUCT-OVERVIEW.md
├── README.md
└── TECHNICAL-PATTERNS-GUIDE.md
```

**Mục đích**: Tập trung tất cả documentation, dễ tìm kiếm và maintain.

### 3. `/scripts` - Automation Scripts

```
scripts/
├── autonomous-worker.ps1            # Autonomous development worker
├── backup-automation.ps1/sh         # Database backup automation
├── code-quality-check.js            # Code quality checks
├── deploy-production.ps1/sh         # Production deployment
├── final-system-test.ps1/sh         # System integration tests
├── migrate-folder-structure.md      # Migration guide
├── setup-backup-cron.sh             # Cron job setup
├── test-changed-files.js            # Test only changed files
└── worker-24-7.ps1                  # 24/7 worker script
```

**Mục đích**: Automation scripts cho CI/CD, testing, deployment.

### 4. `/src` - Source Code

#### 4.1. `/src/backend` - NestJS Backend

```
src/backend/
├── common/                          # Common/Shared utilities
│   ├── api-optimization/           # API optimization utilities
│   ├── cache/                      # Cache utilities
│   ├── cdn/                        # CDN integration
│   ├── compression/                # Response compression
│   ├── controllers/                # Base controllers
│   ├── database/                   # Database utilities
│   ├── decorators/                 # Custom decorators
│   ├── dto/                        # Base DTOs
│   ├── entities/                   # Base entities
│   ├── etag/                       # ETag support
│   ├── filters/                    # Exception filters
│   ├── guards/                     # Auth guards
│   ├── helpers/                    # Helper functions
│   ├── interceptors/               # Interceptors (logging, transform)
│   ├── interfaces/                 # Common interfaces
│   ├── logger/                     # Logger service
│   ├── metrics/                    # Metrics collection
│   ├── middleware/                 # Middleware
│   ├── pagination/                 # Pagination utilities
│   ├── response/                   # Response formatting
│   ├── security/                   # Security utilities
│   ├── services/                   # Base services
│   ├── common.module.ts
│   └── SECURITY.md
├── config/                          # Configuration
│   ├── cache.config.ts
│   ├── database.config.ts
│   ├── typeorm-migration.config.ts
│   └── typeorm.config.ts
├── core/                            # Core business logic
│   ├── auth/                       # Authentication & Authorization
│   ├── permission/                 # Permission management
│   ├── settings/                   # System settings
│   ├── tenant/                     # Multi-tenancy core
│   └── user/                       # User management
├── domains/                         # Business domains (DDD)
│   ├── accounting/                 # Accounting domain
│   ├── ecommerce/                  # E-commerce domain
│   │   ├── order/                  # Order management
│   │   ├── product-catalog/        # Product catalog
│   │   └── shopping-cart/          # Shopping cart
│   ├── hr/                         # HR domain
│   ├── inventory/                  # Inventory domain
│   ├── manufacturing/              # Manufacturing domain
│   ├── project/                    # Project management
│   │   ├── entities/               # Project entities
│   │   ├── dto/                    # Project DTOs
│   │   ├── project.controller.ts
│   │   ├── project.service.ts
│   │   ├── task.controller.ts
│   │   ├── task.service.ts
│   │   ├── time-tracking.controller.ts
│   │   └── time-tracking.service.ts
│   ├── purchasing/                 # Purchasing domain
│   └── sales/                      # Sales domain
├── extensions/                      # Extensions (empty, for future)
├── integrations/                    # External integrations
│   ├── integration/                # Integration framework
│   ├── payment-gateway/            # Payment gateways
│   └── shipping/                   # Shipping providers
├── migrations/                      # Database migrations
│   ├── 1741334400000-AddResetPasswordAndAvatarFields.ts
│   ├── 1741614251000-CreateReportBuilder.ts
│   ├── 20260307215647-CreateEcommerceProductCatalogCart.ts
│   ├── 20260307220926-CreateEcommerceOrder.ts
│   ├── 20260307230000-CreateProjectManagement.ts
│   ├── 20260307240000-AddPerformanceIndexes.ts
│   └── ...
├── modules/                         # ⚠️ LEGACY - To be migrated to domains/
│   └── production/                 # ⚠️ Should move to domains/manufacturing
│       ├── dto/
│       ├── entities/
│       ├── production.controller.ts
│       ├── production.service.ts
│       └── production.module.ts
├── platform/                        # Platform services
│   ├── audit/                      # Audit logging
│   ├── dashboard/                  # Dashboard service
│   ├── document/                   # Document management
│   ├── email/                      # Email service
│   ├── notification/               # Notification service
│   ├── report/                     # Report builder
│   │   ├── entities/               # Report entities
│   │   ├── dto/                    # Report DTOs
│   │   ├── report.controller.ts
│   │   ├── report.service.ts
│   │   ├── report-template.service.ts
│   │   └── report.module.ts
│   ├── search/                     # Search service
│   └── workflow/                   # Workflow engine
├── shared/                          # Shared resources
│   └── controllers/                # Shared controllers
├── utilities/                       # Utility services
│   ├── health/                     # Health checks
│   ├── import-export/              # Import/Export utilities
│   └── scheduled-jobs/             # Cron jobs
├── app.module.ts                    # Root module
├── main.ts                          # Entry point
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

**Kiến trúc Backend - 4 Layers**:

1. **Common Layer** (`common/`): Shared utilities, decorators, guards, interceptors
2. **Core Layer** (`core/`): Core business logic (auth, user, tenant, permission)
3. **Domain Layer** (`domains/`): Business domains following DDD principles
4. **Platform Layer** (`platform/`): Platform services (audit, email, notification, report, workflow)

**Bổ sung**:
- `modules/`: ⚠️ LEGACY folder, to be migrated to `domains/`
- `integrations/`: External integrations (payment, shipping)
- `utilities/`: Utility services (health, import-export, scheduled jobs)
- `config/`: Configuration files
- `migrations/`: Database migrations

**⚠️ Legacy Code Warning**:
- `modules/production/` - Old code, should be migrated to `domains/manufacturing/`
- Marked as "Legacy Modules (to be migrated)" in `app.module.ts`
- New code should NEVER be added to `modules/`, always use `domains/` instead

#### 4.2. `/src/frontend` - React + Vite Frontend

```
src/frontend/
├── e2e/                             # E2E tests (Playwright)
├── public/                          # Static assets
├── src/
│   ├── __tests__/                  # Unit tests
│   ├── components/                 # React components
│   │   ├── bi/                     # Business Intelligence
│   │   ├── collaboration/          # Collaboration features
│   │   ├── common/                 # Common components
│   │   ├── custom-fields/          # Custom fields
│   │   ├── documents/              # Document viewer
│   │   ├── import-export/          # Import/Export
│   │   ├── layout/                 # Layout components
│   │   ├── marketing/              # Marketing components ✨ NEW
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Pricing.tsx
│   │   │   └── CTA.tsx
│   │   ├── marketplace/            # Marketplace
│   │   ├── notifications/          # Notifications
│   │   ├── search/                 # Search
│   │   ├── tenancy/                # Tenancy
│   │   ├── warehouse/              # Warehouse
│   │   └── workflow/               # Workflow
│   ├── constants/                  # Constants
│   ├── hooks/                      # Custom hooks
│   ├── pages/                      # Page components
│   │   ├── audit/                  # Audit logs
│   │   ├── auth/                   # Login, Register
│   │   ├── customers/              # Customer management
│   │   ├── inventory/              # Inventory pages
│   │   ├── invoices/               # Invoice pages
│   │   ├── notifications/          # Notification center
│   │   ├── orders/                 # Order pages
│   │   ├── payments/               # Payment pages
│   │   ├── production/             # Production pages
│   │   ├── products/               # Product pages
│   │   ├── promotions/             # Promotions
│   │   ├── public/                 # Public pages
│   │   │   ├── LandingPage.tsx    # Landing page ✨ UPDATED
│   │   │   └── RegisterPage.tsx
│   │   ├── reports/                # Reports
│   │   ├── search/                 # Search results
│   │   ├── settings/               # Settings
│   │   ├── suppliers/              # Supplier pages
│   │   ├── tenancy/                # Tenancy management
│   │   ├── users/                  # User management
│   │   ├── warehouses/             # Warehouse pages
│   │   └── Dashboard.tsx           # Main dashboard
│   ├── services/                   # API services
│   ├── store/                      # Redux store
│   ├── theme/                      # Theme config
│   ├── utils/                      # Utilities
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── Dockerfile
├── index.html
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

**Thay đổi quan trọng**:
- ✅ Thêm `components/marketing/` với 4 components (Hero, Features, Pricing, CTA)
- ✅ Update `pages/public/LandingPage.tsx` để sử dụng marketing components
- ✅ Tất cả sử dụng Ant Design (đồng nhất với main app)
- ❌ Xóa separate Next.js landing page app

#### 4.3. `/src/mobile` - React Native Mobile

```
src/mobile/
├── android/                         # Android native code
├── ios/                             # iOS native code
├── src/
│   ├── components/                 # React Native components
│   ├── navigation/                 # Navigation config
│   ├── screens/                    # Screen components
│   ├── services/                   # API services
│   ├── store/                      # Redux store
│   └── utils/                      # Utilities
├── App.tsx
├── package.json
└── tsconfig.json
```

#### 4.4. `/src/shared` - Shared Code

```
src/shared/
├── types/                           # Shared TypeScript types
├── utils/                           # Shared utilities
├── constants/                       # Shared constants
└── validators/                      # Shared validators
```

**Mục đích**: Code reuse giữa backend, frontend, mobile.

## So Sánh Với Odoo/ERPNext

### Odoo Structure
```
odoo/
├── addons/                          # Modules (như domains/)
│   ├── account/                    # Accounting
│   ├── crm/                        # CRM
│   ├── sale/                       # Sales
│   └── website/                    # Website/Landing ✨
├── odoo/                            # Core framework
└── setup.py
```

### ERPNext Structure
```
erpnext/
├── erpnext/
│   ├── accounts/                   # Accounting
│   ├── crm/                        # CRM
│   ├── selling/                    # Sales
│   └── www/                        # Website/Landing ✨
└── setup.py
```

### SmartERP Structure (After Integration)
```
smart-erp/
├── src/
│   ├── backend/domains/            # Business domains
│   ├── frontend/
│   │   ├── src/components/marketing/  # Marketing components ✨
│   │   └── src/pages/public/          # Public pages (landing) ✨
│   └── mobile/
└── ...
```

**Kết luận**: SmartERP giờ đây follow pattern của Odoo/ERPNext - landing page integrated vào main app, không phải separate microservice.

## Lợi Ích Của Cấu Trúc Hiện Tại

### 1. Monorepo Benefits
- ✅ Shared code giữa backend, frontend, mobile
- ✅ Unified versioning và deployment
- ✅ Easier refactoring across apps
- ✅ Single CI/CD pipeline

### 2. Domain-Driven Design (Backend)
- ✅ Clear separation of concerns
- ✅ Scalable architecture
- ✅ Easy to add new domains
- ✅ Platform services reusable

### 3. Landing Page Integration
- ✅ Tiết kiệm $25/month hosting
- ✅ Đơn giản hóa deployment (1 app thay vì 2)
- ✅ Đồng nhất design system (Ant Design)
- ✅ Dễ maintain và update
- ✅ Follow industry best practices (Odoo/ERPNext)

### 4. Configuration Separation
- ✅ Environment-specific configs
- ✅ Easy to switch environments
- ✅ Infrastructure as code

### 5. Documentation Organization
- ✅ Centralized documentation
- ✅ Easy to find information
- ✅ Version controlled

## Migration History

### Phase 1: Initial Structure (Before)
```
smart-erp/
├── backend/                         # ❌ Wrong level
├── frontend/                        # ❌ Wrong level
└── mobile/                          # ❌ Wrong level
```

### Phase 2: Moved to src/ (2026-03-06)
```
smart-erp/
├── src/
│   ├── backend/                    # ✅ Correct
│   ├── frontend/                   # ✅ Correct
│   ├── mobile/                     # ✅ Correct
│   └── landing-page/               # ❌ Separate Next.js app
└── ...
```

### Phase 3: Landing Page Integration (2026-03-07)
```
smart-erp/
├── src/
│   ├── backend/                    # ✅ Correct
│   ├── frontend/                   # ✅ Correct
│   │   └── src/
│   │       ├── components/marketing/  # ✅ NEW
│   │       └── pages/public/          # ✅ UPDATED
│   ├── mobile/                     # ✅ Correct
│   └── shared/                     # ✅ Correct
└── ...
```

## Best Practices

### 1. Naming Conventions
- **Folders**: kebab-case (`product-catalog`, `shopping-cart`)
- **Files**: PascalCase for components (`Hero.tsx`, `Features.tsx`)
- **Files**: kebab-case for utilities (`api-client.ts`, `date-utils.ts`)

### 2. File Organization
- Group by feature/domain, not by type
- Keep related files close together
- Use index files for clean imports

### 3. Documentation
- Keep docs up-to-date
- Document architectural decisions (ADRs)
- Include examples and diagrams

### 4. Configuration
- Use environment variables
- Never commit secrets
- Document all config options

## Kết Luận

Cấu trúc thư mục SmartERP hiện tại:
- ✅ **Monorepo** với 3 apps (backend, frontend, mobile)
- ✅ **Domain-Driven Design** cho backend
- ✅ **Landing page integrated** vào frontend (follow Odoo/ERPNext)
- ✅ **Configuration separated** khỏi code
- ✅ **Documentation centralized** và organized
- ✅ **Scripts automated** cho CI/CD

Cấu trúc này đã được tối ưu hóa dựa trên:
- Industry best practices (Odoo, ERPNext)
- Monorepo patterns (Turborepo)
- Domain-Driven Design principles
- Cost optimization (giảm hosting costs)
- Maintainability và scalability

---

**Tài liệu liên quan**:
- `LANDING-PAGE-INTEGRATION-PLAN.md` - Chi tiết landing page integration
- `LANDING-PAGE-COUNTER-ARGUMENT.md` - Lý do integrate thay vì separate
- `ODOO-ARCHITECTURE-ANALYSIS.md` - Phân tích kiến trúc Odoo
- `ERPNEXT-ARCHITECTURE-ANALYSIS.md` - Phân tích kiến trúc ERPNext

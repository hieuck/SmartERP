# SmartERP Folder Structure Analysis & Best Practices

**Date**: 2026-03-07  
**Purpose**: Phân tích cấu trúc thư mục hiện tại và đề xuất cải thiện dựa trên Odoo/ERPNext best practices

---

## 🔍 Current Structure Issues

### ❌ Vấn Đề 1: Root Level Clutter

**Hiện tại**:
```
smart-erp/
├── backend/
├── frontend/
├── mobile/
├── infrastructure/
├── monitoring/
├── scripts/
├── shared/
├── docs/
├── data/
├── dist/
├── node_modules/
├── ROADMAP.md
├── CHANGELOG.md
├── 6+ docker-compose files
├── 10+ config files (.env, .eslintrc, etc.)
└── ...
```

**Vấn đề**:
- ❌ Quá nhiều files/folders ở root level (20+ items)
- ❌ Không rõ ràng đâu là source code, đâu là config
- ❌ `node_modules/` ở root level (nên ở trong từng app)
- ❌ `dist/` ở root level (build artifacts không nên commit)
- ❌ `data/` ở root level (runtime data không nên trong source)

**So sánh với Odoo/ERPNext**:
- ✅ Odoo: Root level chỉ có `odoo/` (framework) + `addons/` (modules) + config files
- ✅ ERPNext: Root level chỉ có `erpnext/` (modules) + `frappe/` (framework) + config files

---

### ❌ Vấn Đề 2: Backend Structure

**Hiện tại**:
```
backend/
├── monolith-app/
│   └── src/
│       └── modules/     # 33 modules flat
├── shared/
├── migrations/
├── test/
├── performance-tests/
├── security-tests/
├── data/
└── node_modules/
```

**Vấn đề**:
- ❌ `monolith-app/` tên không chuẩn (nên là `src/` hoặc `app/`)
- ❌ 33 modules flat trong `modules/` (không có grouping)
- ❌ `shared/` ở backend level (nên ở root hoặc trong src)
- ❌ `test/`, `performance-tests/`, `security-tests/` tách rời (nên gom lại)

**So sánh với Odoo/ERPNext**:
- ✅ Odoo: Modules được group theo domain (`account/`, `sale/`, `stock/`, etc.)
- ✅ ERPNext: Modules được group theo domain (`accounts/`, `selling/`, `stock/`, etc.)

---

### ❌ Vấn Đề 3: Module Organization

**Hiện tại** (33 modules flat):
```
backend/monolith-app/src/modules/
├── accounting/
├── analytics/
├── asset/
├── audit/
├── auth/
├── barcode/
├── category/
├── collaboration/
├── crm/
├── currency/
├── customer/
├── custom-fields/
├── dashboard/
├── document/
├── email/
├── hr/
├── import-export/
├── integration/
├── inventory/
├── invoice/
├── manufacturing/
├── module-marketplace/
├── notification/
├── order/
├── payment/
├── payment-gateway/
├── permission/
├── product/
├── report/
├── scheduled-jobs/
├── search/
├── settings/
├── shipping/
├── subscription/
├── supplier/
├── tenant/
├── user/
├── warehouse/
├── webhook/
└── workflow/
```

**Vấn đề**:
- ❌ Không có grouping theo domain
- ❌ Khó tìm module liên quan (accounting vs invoice vs payment)
- ❌ Không rõ module nào là core, nào là optional

**So sánh với Odoo** (grouped):
```
addons/
├── account/              # Accounting domain
│   ├── account/          # Core accounting
│   ├── account_payment/  # Payments
│   └── account_invoice/  # Invoices
├── sale/                 # Sales domain
│   ├── sale/
│   └── sale_management/
├── stock/                # Inventory domain
│   ├── stock/
│   └── stock_account/
└── ...
```

---

## ✅ Recommended Structure (Based on Odoo/ERPNext)

### Option 1: Odoo-Style (Module Grouping)

```
smart-erp/
├── apps/                           # Applications (like Odoo's addons/)
│   ├── core/                       # Core modules (required)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── tenant/
│   │   ├── permission/
│   │   └── settings/
│   ├── accounting/                 # Accounting domain
│   │   ├── account/                # Chart of accounts, GL
│   │   ├── invoice/                # Invoicing
│   │   ├── payment/                # Payments
│   │   └── currency/               # Multi-currency
│   ├── sales/                      # Sales domain
│   │   ├── crm/
│   │   ├── order/
│   │   └── customer/
│   ├── inventory/                  # Inventory domain
│   │   ├── stock/                  # Stock management
│   │   ├── warehouse/
│   │   └── barcode/
│   ├── purchasing/                 # Purchasing domain
│   │   ├── purchase/
│   │   └── supplier/
│   ├── manufacturing/              # Manufacturing domain
│   │   └── mrp/
│   ├── hr/                         # HR domain
│   │   └── hr/
│   ├── platform/                   # Platform features
│   │   ├── workflow/
│   │   ├── notification/
│   │   ├── email/
│   │   ├── document/
│   │   ├── report/
│   │   ├── dashboard/
│   │   ├── search/
│   │   ├── audit/
│   │   └── analytics/
│   ├── integrations/               # Integrations
│   │   ├── payment-gateway/
│   │   ├── shipping/
│   │   ├── webhook/
│   │   └── integration/
│   └── extensions/                 # Extensions
│       ├── custom-fields/
│       ├── module-marketplace/
│       ├── collaboration/
│       └── subscription/
├── framework/                      # Framework code (like Frappe)
│   ├── core/                       # Core framework
│   │   ├── database/
│   │   ├── orm/
│   │   ├── cache/
│   │   └── queue/
│   ├── api/                        # API framework
│   ├── auth/                       # Auth framework
│   └── utils/                      # Utilities
├── frontend/                       # Frontend app
│   ├── src/
│   │   ├── modules/                # Module-specific UI
│   │   │   ├── accounting/
│   │   │   ├── sales/
│   │   │   └── ...
│   │   ├── shared/                 # Shared components
│   │   └── core/                   # Core UI
│   └── package.json
├── mobile/                         # Mobile app
│   └── src/
├── shared/                         # Shared code (types, utils)
│   ├── types/
│   └── utils/
├── config/                         # Configuration files
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   ├── nginx/
│   └── kubernetes/
├── scripts/                        # Build/deploy scripts
├── docs/                           # Documentation
├── tests/                          # E2E tests
│   ├── e2e/
│   ├── performance/
│   └── security/
├── .github/                        # GitHub workflows
├── ROADMAP.md
├── CHANGELOG.md
├── README.md
└── package.json                    # Root package.json (workspace)
```

### Option 2: ERPNext-Style (Flat Modules with Controllers)

```
smart-erp/
├── smarterp/                       # Main app (like erpnext/)
│   ├── accounting/
│   ├── sales/
│   ├── inventory/
│   ├── purchasing/
│   ├── manufacturing/
│   ├── hr/
│   ├── crm/
│   ├── ...
│   ├── controllers/                # ⭐ Shared controllers
│   │   ├── base_controller.py
│   │   ├── transaction_controller.py
│   │   └── ...
│   └── config/
├── framework/                      # Framework (like frappe/)
│   ├── model/
│   ├── database/
│   ├── api/
│   └── ...
├── frontend/
├── mobile/
├── config/
├── scripts/
├── docs/
└── tests/
```

---

## 🎯 Recommended: Hybrid Approach

Kết hợp ưu điểm của cả Odoo và ERPNext:

```
smart-erp/
├── src/                            # Source code
│   ├── backend/                    # Backend app
│   │   ├── core/                   # Core modules (auth, user, tenant)
│   │   ├── domains/                # ⭐ Business domains (grouped)
│   │   │   ├── accounting/
│   │   │   │   ├── account/
│   │   │   │   ├── invoice/
│   │   │   │   ├── payment/
│   │   │   │   └── currency/
│   │   │   ├── sales/
│   │   │   │   ├── crm/
│   │   │   │   ├── order/
│   │   │   │   └── customer/
│   │   │   ├── inventory/
│   │   │   │   ├── stock/
│   │   │   │   ├── warehouse/
│   │   │   │   └── barcode/
│   │   │   ├── purchasing/
│   │   │   │   ├── purchase/
│   │   │   │   └── supplier/
│   │   │   ├── manufacturing/
│   │   │   └── hr/
│   │   ├── platform/               # Platform features
│   │   │   ├── workflow/
│   │   │   ├── notification/
│   │   │   ├── email/
│   │   │   ├── document/
│   │   │   ├── report/
│   │   │   ├── dashboard/
│   │   │   └── analytics/
│   │   ├── integrations/           # Integrations
│   │   │   ├── payment-gateway/
│   │   │   ├── shipping/
│   │   │   └── webhook/
│   │   ├── shared/                 # ⭐ Shared code (controllers, utils)
│   │   │   ├── controllers/
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── utils/
│   │   ├── database/               # Database
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── tests/                  # Tests
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   ├── e2e/
│   │   │   ├── performance/
│   │   │   └── security/
│   │   ├── main.ts
│   │   └── app.module.ts
│   ├── frontend/                   # Frontend app
│   │   ├── src/
│   │   │   ├── modules/            # Module-specific UI
│   │   │   │   ├── accounting/
│   │   │   │   ├── sales/
│   │   │   │   └── ...
│   │   │   ├── shared/             # Shared components
│   │   │   ├── core/               # Core UI
│   │   │   └── App.tsx
│   │   └── package.json
│   ├── mobile/                     # Mobile app
│   │   └── src/
│   └── shared/                     # Shared across apps
│       ├── types/
│       └── constants/
├── config/                         # Configuration
│   ├── docker/
│   ├── nginx/
│   └── kubernetes/
├── scripts/                        # Scripts
├── docs/                           # Documentation
├── .github/                        # CI/CD
├── ROADMAP.md
├── CHANGELOG.md
├── README.md
└── package.json
```

---

## 📋 Module Structure Standard

Mỗi module nên tuân theo cấu trúc chuẩn (học từ Odoo):

```
module-name/
├── entities/                       # Database entities
│   └── module-name.entity.ts
├── dto/                            # Data transfer objects
│   ├── create-module-name.dto.ts
│   ├── update-module-name.dto.ts
│   └── query-module-name.dto.ts
├── controllers/                    # HTTP controllers
│   └── module-name.controller.ts
├── services/                       # Business logic
│   └── module-name.service.ts
├── repositories/                   # Data access (if needed)
│   └── module-name.repository.ts
├── guards/                         # Module-specific guards
├── decorators/                     # Module-specific decorators
├── tests/                          # Tests
│   ├── module-name.service.spec.ts
│   ├── module-name.controller.spec.ts
│   └── module-name.e2e.spec.ts
├── module-name.module.ts           # Module definition
└── README.md                       # Module documentation
```

---

## 🎯 Benefits of Recommended Structure

### 1. Clear Domain Separation
- ✅ Dễ tìm modules liên quan (accounting/account, accounting/invoice)
- ✅ Dễ hiểu business logic (sales domain, inventory domain)
- ✅ Dễ onboard developers mới

### 2. Scalability
- ✅ Dễ thêm modules mới vào domain
- ✅ Dễ tách domain thành microservice nếu cần
- ✅ Dễ quản lý dependencies giữa modules

### 3. Maintainability
- ✅ Code organization rõ ràng
- ✅ Dễ refactor (chỉ ảnh hưởng 1 domain)
- ✅ Dễ test (test theo domain)

### 4. Team Collaboration
- ✅ Teams có thể work trên different domains
- ✅ Ít conflicts khi merge code
- ✅ Clear ownership (team owns domain)

---

## 🚀 Migration Plan

### Phase 1: Analyze Current Modules (Week 1)
1. List all 33 modules
2. Group by domain (accounting, sales, inventory, etc.)
3. Identify shared code
4. Document dependencies

### Phase 2: Create New Structure (Week 2)
1. Create `src/backend/domains/` folders
2. Create `src/backend/platform/` folders
3. Create `src/backend/integrations/` folders
4. Create `src/backend/shared/` folder

### Phase 3: Move Modules (Week 3-4)
1. Move core modules first (auth, user, tenant)
2. Move accounting domain
3. Move sales domain
4. Move inventory domain
5. Move remaining domains
6. Move platform features
7. Move integrations

### Phase 4: Update Imports (Week 5)
1. Update all imports in moved modules
2. Update tests
3. Update documentation

### Phase 5: Cleanup (Week 6)
1. Remove old `modules/` folder
2. Update CI/CD
3. Update README
4. Update ROADMAP

---

## 📝 Decision: Which Structure to Use?

### Recommendation: **Hybrid Approach**

**Why?**
1. ✅ Clear domain separation (like Odoo)
2. ✅ Shared controllers pattern (like ERPNext)
3. ✅ Scalable for future growth
4. ✅ Easy to understand for new developers
5. ✅ Follows NestJS best practices

**When to migrate?**
- Option A: **Now** (before Phase 1 development)
  - Pros: Clean start, no technical debt
  - Cons: Takes 6 weeks, delays Phase 1

- Option B: **Gradually** (during Phase 1-4)
  - Pros: No delay, refactor as we go
  - Cons: More complex, need careful planning

**My recommendation**: **Option A (Now)**
- Better to have clean structure before adding 80%+ features
- Easier to follow roadmap with clean structure
- Less confusion for autonomous development

---

## 🎓 References

- Odoo Module Structure: https://www.odoo.com/documentation/17.0/developer/reference/backend/module.html
- ERPNext DocType System: https://frappeframework.com/docs/user/en/basics/doctypes
- NestJS Best Practices: https://docs.nestjs.com/

---

**Created**: 2026-03-07  
**Status**: 📋 Proposal  
**Next Step**: Get user approval for migration plan

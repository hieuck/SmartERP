# Architecture Violation Analysis - SmartERP

**Date:** 2026-03-08  
**Analyst:** Tech Lead (Kiro)

## 📊 SUMMARY

**Total Services Analyzed:** 30+  
**Services Using Raw TypeORM:** 28  
**Services Using SecureRepository:** 2 (accounting, manufacturing/production)  
**Violation Rate:** 93%

---

## 🔴 VIOLATION PATTERNS IDENTIFIED

### Pattern 1: E-Commerce & Product Management (5 services)

**Services:**

- `domains/ecommerce/product-catalog/product-catalog.service.ts`
- `platform/search/search.service.ts` (Product search)
- `platform/dashboard/dashboard.service.ts` (Product metrics)

**Issues:**

- ❌ No SecureRepository
- ❌ No tenant isolation
- ❌ No permission checks
- ❌ Uses `createQueryBuilder` directly

**Impact:** HIGH - Customer-facing, multi-tenant critical

---

### Pattern 2: Sales & CRM (4 services)

**Services:**

- `domains/sales/order/order.service.ts`
- `domains/sales/crm/crm.service.ts`
- `domains/sales/customer/customer.service.ts`

**Issues:**

- ❌ No SecureRepository
- ❌ Tenant isolation incomplete
- ❌ No permission checks on sensitive data

**Impact:** CRITICAL - Revenue data, customer PII

---

### Pattern 3: Platform Services (12 services)

**Services:**

- `platform/notification/notification.service.ts`
- `platform/workflow/workflow.service.ts`
- `platform/workflow/approval.service.ts`
- `platform/support/support.service.ts`
- `platform/report/report.service.ts`
- `platform/report/report-template.service.ts`
- `platform/issue-tracking/issue-tracking.service.ts`
- `platform/email/email.service.ts`
- `platform/audit/audit.service.ts`
- `platform/document/document.service.ts`
- `platform/system-admin/system-admin.service.ts`

**Issues:**

- ❌ No SecureRepository
- ❌ Mixed tenant isolation (some have, some don't)
- ❌ No permission checks

**Impact:** HIGH - Core platform functionality

---

### Pattern 4: Integration Services (2 services)

**Services:**

- `integrations/shipping/shipping.service.ts`
- `integrations/payment-gateway/payment-gateway.service.ts`

**Issues:**

- ❌ No SecureRepository
- ❌ No tenant isolation
- ❌ External API calls without proper security

**Impact:** CRITICAL - Payment & shipping data

---

### Pattern 5: Core Auth & Tenant (4 services)

**Services:**

- `core/auth/auth.service.ts`
- `core/tenant/tenant.service.ts`
- `core/tenant/subscription.service.ts`
- `core/user/user.service.ts`

**Issues:**

- ⚠️ Special case - these manage tenants themselves
- ❌ Still need SecureRepository for audit trail
- ❌ No permission checks on admin operations

**Impact:** CRITICAL - Security foundation

---

### Pattern 6: Project Management (1 service)

**Services:**

- `domains/project/time-tracking.service.ts`

**Issues:**

- ❌ No SecureRepository
- ❌ No tenant isolation
- ❌ Time tracking data not secured

**Impact:** MEDIUM - Billing & payroll implications

---

## ✅ GOOD EXAMPLES (Reference for Refactoring)

### 1. Accounting Service

**File:** `domains/accounting/account/accounting.service.ts`

**What's Good:**

```typescript
// ✅ Initializes SecureRepository
this.secureAccountRepo = new SecureRepository(
  accountRepository,
  permissionService,
  'Account',
);

// ✅ All methods use SecureRepository
async findAllAccounts(user: User, type?: AccountType): Promise<Account[]> {
  return this.secureAccountRepo.find(user, { where, order: { code: 'ASC' } });
}

// ✅ User is first parameter
async createAccount(user: User, data: Partial<Account>): Promise<Account> {
  return this.secureAccountRepo.save(user, data);
}
```

**Pattern to Replicate:**

1. Inject both Repository + PermissionService
2. Initialize SecureRepository in constructor
3. User parameter first in all methods
4. Use secureRepo.find/findOne/save/remove
5. Cache with tenant-aware keys

---

### 2. Manufacturing Production Service

**File:** `domains/manufacturing/mrp/production.service.ts`

**What's Good:**

- Same pattern as Accounting
- Proper workflow integration
- Audit trail complete

---

## 📋 REFACTORING PRIORITY

### Priority 1: CRITICAL (Week 2)

1. **Sales & CRM** (Pattern 2) - Revenue & customer data
2. **Payment & Shipping** (Pattern 4) - Financial transactions
3. **Core Auth** (Pattern 5) - Security foundation

### Priority 2: HIGH (Week 3)

4. **E-Commerce** (Pattern 1) - Customer-facing
5. **Platform Services** (Pattern 3) - Core functionality

### Priority 3: MEDIUM (Week 4)

6. **Project Management** (Pattern 6) - Internal tools

---

## 🎯 REFACTORING STRATEGY

### Step 1: Create Refactoring Template

Based on Accounting service pattern

### Step 2: Refactor by Pattern (not by service)

- Pattern 2 (Sales) first - 4 services
- Pattern 4 (Integrations) - 2 services
- Pattern 5 (Core) - 4 services
- Pattern 1 (E-Commerce) - 5 services
- Pattern 3 (Platform) - 12 services
- Pattern 6 (Project) - 1 service

### Step 3: Update Tests

- Use SecureRepository mocking pattern
- Mock PermissionService
- Update all test suites

### Step 4: Integration Testing

- Test tenant isolation
- Test permission checks
- Test audit trail

---

## 📊 ESTIMATED EFFORT

**Per Service:**

- Simple service: 30-45 min
- Complex service: 1-2 hours
- Tests: 30 min

**Total:**

- Pattern 2 (4 services): 4-6 hours
- Pattern 4 (2 services): 2-3 hours
- Pattern 5 (4 services): 4-6 hours
- Pattern 1 (5 services): 5-8 hours
- Pattern 3 (12 services): 12-18 hours
- Pattern 6 (1 service): 1 hour

**Grand Total:** 28-42 hours (3.5-5 days)

---

## 🚀 NEXT STEPS

1. ✅ Analysis complete
2. ⏭️ Research Odoo/ERPNext Sales patterns (1h)
3. ⏭️ Create refactoring template (30min)
4. ⏭️ POC: Refactor 1 service from Pattern 2 (1h)
5. ⏭️ Validate & scale to remaining services

---

**Analysis Complete:** 2026-03-08 23:45  
**Time Spent:** 45 minutes  
**Ready for:** Research Phase

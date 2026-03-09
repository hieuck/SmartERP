# Security Test Templates - Quick Start

**Created:** 2026-03-09 (Week 1 Day 2)  
**Status:** ✅ Ready for Team Use  
**Purpose:** Enable team to add security tests to all 30 services

---

## 📦 What's Included

This directory contains everything needed to add comprehensive security tests to SmartERP services.

### 1. Templates (Copy-Paste Ready)

- **`tenant-isolation-test.template.ts`** - Tenant isolation test cases
- **`permission-denial-test.template.ts`** - Permission denial test cases

### 2. Documentation (Comprehensive Guide)

- **`security-test-templates.md`** - Main documentation (2000+ words)
  - Overview & why security tests are critical
  - Quick start guide
  - Detailed usage guide
  - Best practices
  - Common pitfalls
  - Examples by service type

### 3. Review Checklist (Quality Assurance)

- **`security-test-review-checklist.md`** - Review criteria
  - Test coverage completeness
  - Test quality standards
  - Mock configuration
  - Assertion specificity
  - Security best practices
  - Approval criteria

### 4. Sample Implementation (Reference)

- **`src/backend/domains/inventory/product/product.security.spec.ts`**
  - Real working example
  - 20 security tests
  - Demonstrates both templates
  - Can be used as reference

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Copy Template

```bash
# For tenant isolation tests
cp docs/testing/tenant-isolation-test.template.ts src/backend/domains/your-domain/your-service.tenant.spec.ts

# For permission denial tests
cp docs/testing/permission-denial-test.template.ts src/backend/domains/your-domain/your-service.permission.spec.ts
```

### Step 2: Replace Placeholders

Find and replace:

- `{{EntityName}}` → `Product`, `Order`, `Invoice`, etc.
- `{{entityName}}` → `product`, `order`, `invoice`, etc.
- `{{entity-name}}` → `product`, `order`, `invoice`, etc.

### Step 3: Adjust Mock Data

Update mock data to match your entity structure.

### Step 4: Run Tests

```bash
cd src/backend
npm test -- your-service.tenant.spec.ts
npm test -- your-service.permission.spec.ts
```

---

## 📊 Coverage Requirements

### Minimum per Service

- **6 Tenant Isolation Tests**
  - Tenant filter applied
  - Cross-tenant access prevention (3 tests)
  - TenantId auto-set
  - Cache key isolation

- **6 Permission Denial Tests**
  - Read permission denial
  - Write permission denial (2 tests)
  - Delete permission denial
  - Role-based access
  - Error messages

**Total: 12 security tests minimum per service**

### For 30 Services

- **360 security tests minimum**
- **Target: 100% security coverage**
- **Timeline: Week 1-2**

---

## 📖 Documentation Structure

### For Developers

1. **Read:** `security-test-templates.md` (30 min)
2. **Copy:** Template files
3. **Implement:** Add tests to your service
4. **Verify:** Run tests locally

### For Reviewers (QA Engineer)

1. **Use:** `security-test-review-checklist.md`
2. **Check:** All checklist items
3. **Approve:** If criteria met
4. **Request Changes:** If issues found

---

## 🎯 Success Criteria

### Day 2 (Today) - ✅ COMPLETE

- [x] Tenant Isolation Test Template created
- [x] Permission Denial Test Template created
- [x] Comprehensive documentation (>2000 words)
- [x] Review checklist created
- [x] Sample implementation (ProductService)

### Day 3 (Tomorrow) - Team Starts

- [ ] Team reviews documentation
- [ ] Team adds security tests to 5 services
- [ ] QA Engineer reviews first batch
- [ ] Iterate based on feedback

### Week 1 End

- [ ] 15 services have security tests
- [ ] All tests passing
- [ ] Coverage >80%

### Week 2 End

- [ ] All 30 services have security tests
- [ ] 100% security coverage
- [ ] Production ready

---

## 🔍 File Locations

```
docs/testing/
├── README.md (this file)
├── security-test-templates.md (main guide)
├── security-test-review-checklist.md (review criteria)
├── tenant-isolation-test.template.ts (template)
└── permission-denial-test.template.ts (template)

src/backend/domains/inventory/product/
└── product.security.spec.ts (sample implementation)

src/common/test/
└── test-helpers.ts (createMockUser utility)
```

---

## 💡 Key Concepts

### Tenant Isolation

**What:** Ensure users can ONLY access data from their own tenant.

**Why:** GDPR compliance, prevent data leaks, multi-tenancy security.

**How:** Test that tenantId filter is applied to all queries.

### Permission Denial

**What:** Ensure permission checks are enforced BEFORE database access.

**Why:** Prevent unauthorized access, enforce RBAC, block privilege escalation.

**How:** Test that ForbiddenException is thrown when permissions denied.

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't Mock Raw TypeORM

```typescript
// WRONG
mockRepository.createQueryBuilder = jest.fn();
```

### ✅ Mock SecureRepository Methods

```typescript
// CORRECT
mockRepository.find = jest.fn();
mockRepository.findOne = jest.fn();
```

### ❌ Don't Skip Permission Mocking

```typescript
// WRONG - No PermissionService
const module = await Test.createTestingModule({
  providers: [YourService],
}).compile();
```

### ✅ Always Mock PermissionService

```typescript
// CORRECT
const module = await Test.createTestingModule({
  providers: [YourService, { provide: PermissionService, useValue: mockPermissionService }],
}).compile();
```

---

## 🎓 Learning Path

### Beginner (Day 1)

1. Read `security-test-templates.md` overview
2. Look at `product.security.spec.ts` sample
3. Copy template for simple service
4. Run tests

### Intermediate (Day 2-3)

1. Understand all test patterns
2. Add tests to complex services
3. Handle edge cases
4. Review others' tests

### Advanced (Week 2)

1. Create custom test patterns
2. Optimize test performance
3. Add integration tests
4. Mentor team members

---

## 📞 Support

### Questions?

- **Documentation:** Read `security-test-templates.md`
- **Examples:** Check `product.security.spec.ts`
- **Review:** Use `security-test-review-checklist.md`
- **QA Engineer:** Ask for help if stuck

### Issues?

- **Tests failing:** Check mock configuration
- **Coverage low:** Add missing test cases
- **Unclear requirements:** Review documentation
- **Blocker:** Escalate to QA Engineer or Tech Lead

---

## 📈 Progress Tracking

### Week 1 Day 2 (Today)

- ✅ Templates created
- ✅ Documentation complete
- ✅ Sample implementation ready
- ✅ Review checklist ready

### Week 1 Day 3 (Tomorrow)

- [ ] Team training session
- [ ] First 5 services get security tests
- [ ] QA review and feedback

### Week 1 Day 4-5

- [ ] 10 more services
- [ ] Address feedback
- [ ] Refine templates if needed

### Week 2

- [ ] Remaining 15 services
- [ ] 100% security coverage
- [ ] Production ready

---

## 🎯 Impact

### Before Security Tests

- ❌ 0% security test coverage
- 🔴 Tenant data leakage risk
- 🔴 Unauthorized access possible
- 🔴 GDPR violation potential

### After Security Tests

- ✅ 100% security test coverage
- ✅ Tenant isolation verified
- ✅ Permission checks enforced
- ✅ GDPR compliant
- ✅ Production ready

---

## 🚀 Next Steps

### For Developers

1. **Tomorrow (Day 3):** Attend training session
2. **This Week:** Add security tests to assigned services
3. **Next Week:** Help others, review PRs

### For QA Engineer

1. **Tomorrow (Day 3):** Conduct training session
2. **This Week:** Review all security test PRs
3. **Next Week:** Final quality check, production readiness

### For Tech Lead

1. **Tomorrow (Day 3):** Approve approach
2. **This Week:** Monitor progress
3. **Next Week:** Sign off on security coverage

---

**Created by:** QA Engineer  
**Date:** 2026-03-09  
**Version:** 1.0.0  
**Status:** ✅ Ready for Team Use

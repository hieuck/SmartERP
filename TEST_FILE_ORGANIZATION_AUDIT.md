# Test File Organization Audit Report
**Date:** 2026-03-09  
**Project:** smart-erp  
**Auditor:** QA Engineer  
**Standard Reference:** file-organization.md

---

## Executive Summary

The smart-erp project has **significant test file organization violations** across all three sub-projects (backend, frontend, mobile). The primary issue is that **backend uses co-located .spec.ts files** (NestJS convention) instead of centralizing tests in `__tests__/` directories as required by file-organization.md standards.

**Overall Status:** ⚠️ **NEEDS REMEDIATION**

---

## 1. Backend Tests (`src/backend/src/`)

### Current State: ❌ **NON-COMPLIANT**

**Issue:** Backend has **100+ .spec.ts files co-located with source code** instead of organized in `__tests__/` directory.

#### Test Files Found (Co-located):

**Total Count:** 100+ .spec.ts files scattered across:
- Common module: 10 files
- Core module: 10 files  
- Tenant module: 4 files
- User module: 2 files
- Accounting domain: 9 files
- E-Commerce domain: 5 files
- HR domain: 7 files
- Inventory domain: 11 files
- Manufacturing domain: 6 files
- Project domain: 3 files
- Purchasing domain: 2 files
- Sales domain: 6 files
- Test domain: 1 file
- Integrations: 6 files
- Platform module: 20+ files
- Utilities: 4 files

#### Existing __tests__ Directory:

**Status:** ✓ **EXISTS BUT UNDERUTILIZED**

```
src/backend/src/__tests__/
├── e2e/
│   └── e2e/
│       └── user-journey.e2e-spec.ts ✓
├── integration/
│   └── (empty)
├── performance/
│   ├── api-performance.spec.ts ✓
│   ├── k6-security-baseline.js ✓
│   └── README.md ✓
└── utils/
    └── (empty)
```

**Problem:** Only 2 test files in `__tests__/` (1 e2e, 1 performance) while 100+ are co-located.

### Backend Recommendation:

**Option A (Recommended - Align with NestJS Convention):**
- Keep `.spec.ts` files co-located with source (NestJS standard practice)
- Update file-organization.md to document this exception for NestJS projects
- Organize integration/e2e tests in `__tests__/` directory

**Option B (Strict Compliance):**
- Move all `.spec.ts` files to `__tests__/unit/` maintaining directory structure
- Requires significant refactoring of Jest configuration

---

## 2. Frontend Tests (`src/frontend/src/`)

### Current State: ✓ **MOSTLY COMPLIANT**

**Status:** Frontend follows better organization practices.

#### Existing __tests__ Directory:

```
src/frontend/src/__tests__/
├── e2e/
│   ├── auth.spec.ts ✓
│   ├── dashboard.spec.ts ✓
│   ├── orders.spec.ts ✓
│   ├── products.spec.ts ✓
│   └── README.md ✓
├── integration/
│   ├── advanced-features.test.tsx ✓
│   ├── orders.test.tsx ✓
│   ├── production.test.tsx ✓
│   └── reports.test.tsx ✓
├── performance/
│   └── integration.test.tsx ✓
├── enterprise-features.test.tsx ✓
├── integration.test.tsx ✓
└── setup.ts ✓
```

#### Co-located Test Files:

**Found:** 1 file
- ✗ `components/common/__tests__/ErrorBoundary.test.tsx`

**Issue:** Component test is in `__tests__/` subdirectory within component folder instead of centralized `__tests__/` directory.

### Frontend Recommendation:

**Move to centralized location:**
```
Move: src/frontend/src/components/common/__tests__/ErrorBoundary.test.tsx
To:   src/frontend/src/__tests__/unit/components/common/ErrorBoundary.test.tsx
```

---

## 3. Mobile Tests (`src/mobile/src/`)

### Current State: ⚠️ **INCOMPLETE**

**Status:** Mobile project has `__tests__/` directory but it's empty.

#### Existing __tests__ Directory:

```
src/mobile/src/__tests__/
└── integration/
    └── (empty)
```

#### Empty Test Directories in Services:

Multiple service directories have empty `__tests__/` subdirectories:
- ✗ `services/api/__tests__/` (empty)
- ✗ `services/auth/__tests__/` (empty)
- ✗ `services/barcode/__tests__/` (empty)
- ✗ `services/camera/__tests__/` (empty)
- ✗ `services/storage/__tests__/` (empty)
- ✗ `services/sync/__tests__/` (empty)
- ✗ `services/store/slices/__tests__/` (empty)

### Mobile Recommendation:

**Consolidate test structure:**
1. Remove empty `__tests__/` subdirectories from individual services
2. Organize all tests in centralized `src/mobile/src/__tests__/` directory:
   ```
   src/mobile/src/__tests__/
   ├── unit/
   │   ├── services/
   │   ├── hooks/
   │   ├── store/
   │   └── components/
   ├── integration/
   └── e2e/
   ```

---

## 4. Test Configuration Files

### Root Level Configuration: ✓ **CORRECT**

```
smart-erp/
├── jest.config.js ✓
├── jest.setup.js ✓
└── tsconfig.test.json ✓
```

**Status:** Centralized at project root as required.

### Backend-Specific Configuration: ✓ **CORRECT**

```
smart-erp/src/backend/
└── jest.config.js ✓
```

### Frontend-Specific Configuration: ✓ **CORRECT**

```
smart-erp/src/frontend/
├── vitest.config.ts ✓
├── tsconfig.test.json ✓
└── playwright.config.ts ✓
```

### Mobile-Specific Configuration: ✓ **CORRECT**

```
smart-erp/src/mobile/
├── jest.config.js ✓
└── jest.setup.js ✓
```

---

## 5. Test Utilities & Fixtures

### Backend Test Utilities:

**Location:** `src/backend/src/common/test/`
- ✓ `test-helpers.ts` (correctly placed)

**Status:** ✓ **CORRECT**

### Frontend Test Utilities:

**Location:** `src/frontend/src/__tests__/`
- ✓ `setup.ts` (correctly placed)

**Status:** ✓ **CORRECT**

### Mobile Test Utilities:

**Status:** ⚠️ **MISSING** - No centralized test utilities found

---

## 6. Summary of Findings

### ✅ What's Correct:

1. **Test configuration files** at appropriate levels (root, project-specific)
2. **Frontend organization** mostly follows standards with centralized `__tests__/`
3. **E2E tests** properly organized in `__tests__/e2e/`
4. **Performance tests** properly organized in `__tests__/performance/`
5. **Test utilities** in correct locations (backend, frontend)

### ⚠️ What Needs Fixing:

1. **Backend: 100+ co-located .spec.ts files** violate centralization standard
2. **Frontend: 1 component test** in wrong location
3. **Mobile: Empty test directories** scattered across services
4. **Mobile: No test utilities** established
5. **Mobile: No unit tests** currently present

### 🔴 Critical Issues:

| Issue | Severity | Impact | Files Affected |
|-------|----------|--------|-----------------|
| Backend co-located tests | HIGH | Violates file-organization.md | 100+ files |
| Frontend component test location | MEDIUM | Inconsistent organization | 1 file |
| Mobile empty test dirs | MEDIUM | Confusing structure | 7 directories |
| Mobile missing tests | HIGH | No test coverage | Entire mobile project |

---

## 7. Recommendations

### Immediate Actions (Priority 1):

1. **Backend:** Document NestJS exception in file-organization.md
   - NestJS convention allows co-located `.spec.ts` files
   - Update standard to reflect this exception
   - Ensure integration/e2e tests use `__tests__/` directory

2. **Frontend:** Move component test
   ```bash
   mv src/frontend/src/components/common/__tests__/ErrorBoundary.test.tsx \
      src/frontend/src/__tests__/unit/components/common/ErrorBoundary.test.tsx
   ```

3. **Mobile:** Clean up empty test directories
   ```bash
   rm -rf src/mobile/src/services/*/\_\_tests\_\_/
   rm -rf src/mobile/src/store/slices/\_\_tests\_\_/
   ```

### Short-term Actions (Priority 2):

1. **Mobile:** Create proper test structure
   ```
   src/mobile/src/__tests__/
   ├── unit/
   │   ├── services/
   │   ├── hooks/
   │   ├── store/
   │   └── components/
   ├── integration/
   └── e2e/
   ```

2. **Mobile:** Establish test utilities
   - Create `src/mobile/src/__tests__/utils/` for test helpers
   - Create `src/mobile/src/__tests__/fixtures/` for mock data

3. **All Projects:** Add pre-commit hook to validate test file locations

### Long-term Actions (Priority 3):

1. **Update file-organization.md** with:
   - NestJS exception for co-located `.spec.ts` files
   - Mobile test structure guidelines
   - Test utility organization standards

2. **Create test organization guide** in `docs/testing/`
   - Backend: Co-located unit tests + centralized integration/e2e
   - Frontend: Centralized `__tests__/` with subdirectories
   - Mobile: Centralized `__tests__/` with subdirectories

3. **Implement CI/CD validation** to enforce test file locations

---

## 8. Compliance Checklist

### Backend:
- [x] Test configuration at project level
- [x] E2E tests in `__tests__/e2e/`
- [x] Performance tests in `__tests__/performance/`
- [ ] Document NestJS co-location exception
- [ ] Move integration tests to `__tests__/integration/`

### Frontend:
- [x] Test configuration at project level
- [x] E2E tests in `__tests__/e2e/`
- [x] Integration tests in `__tests__/integration/`
- [x] Performance tests in `__tests__/performance/`
- [ ] Move component test to centralized location
- [x] Test utilities in `__tests__/`

### Mobile:
- [x] Test configuration at project level
- [ ] Create proper `__tests__/` structure
- [ ] Remove empty test directories
- [ ] Create test utilities
- [ ] Add unit tests
- [ ] Add integration tests

---

## 9. Files Requiring Action

### Move (1 file):
```
src/frontend/src/components/common/__tests__/ErrorBoundary.test.tsx
→ src/frontend/src/__tests__/unit/components/common/ErrorBoundary.test.tsx
```

### Delete (7 empty directories):
```
src/mobile/src/services/api/__tests__/
src/mobile/src/services/auth/__tests__/
src/mobile/src/services/barcode/__tests__/
src/mobile/src/services/camera/__tests__/
src/mobile/src/services/storage/__tests__/
src/mobile/src/services/sync/__tests__/
src/mobile/src/store/slices/__tests__/
```

### Create (Mobile test structure):
```
src/mobile/src/__tests__/unit/
src/mobile/src/__tests__/unit/services/
src/mobile/src/__tests__/unit/hooks/
src/mobile/src/__tests__/unit/store/
src/mobile/src/__tests__/unit/components/
src/mobile/src/__tests__/utils/
src/mobile/src/__tests__/fixtures/
```

---

## 10. Conclusion

The smart-erp project has **mixed compliance** with file-organization standards:

- **Backend:** Non-compliant but follows NestJS convention (acceptable with documentation)
- **Frontend:** Mostly compliant with minor issues (1 file to move)
- **Mobile:** Incomplete with empty directories and missing tests

**Overall Assessment:** ⚠️ **NEEDS REMEDIATION**

**Estimated Effort:**
- Backend: Document exception (1 hour)
- Frontend: Move 1 file (15 minutes)
- Mobile: Restructure + cleanup (2-3 hours)

**Total:** ~4 hours to achieve full compliance

---

**Report Generated:** 2026-03-09  
**Next Review:** After remediation actions completed

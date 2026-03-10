# Smart-ERP Frontend Refactoring Action Plan

**Status:** READY FOR IMPLEMENTATION  
**Date:** March 10, 2026  
**Priority:** Medium (No critical issues, focus on improvements)

---

## 📋 Overview

The Smart-ERP frontend is well-structured and follows modern React best practices. This action plan outlines improvements to achieve 100% compliance with standards.

**Current Status:** ✅ 95% Compliant  
**Target Status:** ✅ 100% Compliant

---

## 🎯 Phase 1: Documentation (Week 1)

### Task 1.1: Add JSDoc to Components

**Scope:** All components in `src/components/`

**Action Items:**

1. **Common Components** (`src/components/common/`)
   - [ ] EmptyState.tsx - Already has docs, verify completeness
   - [ ] ErrorBoundary.tsx - Add JSDoc
   - [ ] ExpandableContent.tsx - Add JSDoc
   - [ ] LazyDataLoader.tsx - Add JSDoc
   - [ ] LazyImage.tsx - Add JSDoc
   - [ ] LoadingSpinner.tsx - Add JSDoc
   - [ ] MobileFormItemCard.tsx - Add JSDoc
   - [ ] MobileListCard.tsx - Add JSDoc
   - [ ] PageHeader.tsx - Add JSDoc
   - [ ] StandardFormPage.tsx - Add JSDoc
   - [ ] StandardListPage.tsx - Add JSDoc

2. **Feature Components** (All subdirectories)
   - [ ] Add JSDoc to all components in `bi/`, `collaboration/`, `custom-fields/`, etc.

**Template:**
```typescript
/**
 * ComponentName
 *
 * Brief description of what the component does.
 *
 * @param {ComponentNameProps} props - Component props
 * @returns {JSX.Element} Rendered component
 *
 * @example
 * <ComponentName prop1="value" prop2={true} />
 */
export default function ComponentName(props: ComponentNameProps) {
  // ...
}
```

**Effort:** 2-3 days | **Priority:** High

---

### Task 1.2: Add JSDoc to Custom Hooks

**Scope:** All hooks in `src/hooks/`

**Action Items:**

- [ ] useInactivityLogout.ts - Add JSDoc
- [ ] useLazyData.ts - Add JSDoc
- [ ] useLazyImage.ts - Add JSDoc
- [ ] usePayments.ts - Add JSDoc
- [ ] useReports.ts - Add JSDoc
- [ ] useResponsive.ts - Already has docs, verify completeness
- [ ] useSettings.ts - Add JSDoc

**Template:**
```typescript
/**
 * useHookName
 *
 * Brief description of what the hook does.
 *
 * @param {HookParams} params - Hook parameters
 * @returns {HookReturn} Hook return value
 *
 * @example
 * const { data, loading } = useHookName({ param: 'value' });
 */
export function useHookName(params: HookParams): HookReturn {
  // ...
}
```

**Effort:** 1 day | **Priority:** High

---

### Task 1.3: Add JSDoc to Service Functions

**Scope:** All services in `src/services/`

**Action Items:**

For each service file, add JSDoc to all exported functions:

```typescript
/**
 * Fetches all customers with pagination and filtering
 *
 * @param {GetAllParams} params - Query parameters
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.limit - Items per page
 * @param {string} [params.search] - Search query
 * @returns {Promise<PaginatedResponse<Customer>>} Paginated customer list
 * @throws {ApiError} If request fails
 *
 * @example
 * const customers = await customerService.getAll({ page: 1, limit: 10 });
 */
async getAll(params: GetAllParams): Promise<PaginatedResponse<Customer>> {
  // ...
}
```

**Effort:** 2-3 days | **Priority:** High

---

## 🎯 Phase 2: Type Safety (Week 2)

### Task 2.1: Enable Strict TypeScript

**Scope:** `tsconfig.json`

**Action Items:**

1. Review current `tsconfig.json`
2. Enable strict mode options:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true,
       "strictBindCallApply": true,
       "strictPropertyInitialization": true,
       "noImplicitAny": true,
       "noImplicitThis": true,
       "alwaysStrict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true
     }
   }
   ```
3. Fix any type errors that arise
4. Run `npm run build` to verify

**Effort:** 1-2 days | **Priority:** High

---

### Task 2.2: Add Types for API Responses

**Scope:** `src/services/` and `src/types/` (create if needed)

**Action Items:**

1. Create `src/types/` directory if it doesn't exist
2. Create type files for each domain:
   - `src/types/customer.ts`
   - `src/types/order.ts`
   - `src/types/product.ts`
   - `src/types/invoice.ts`
   - etc.

3. Define types for API responses:
   ```typescript
   // src/types/customer.ts
   export interface Customer {
     id: string;
     name: string;
     email: string;
     phone: string;
     address: string;
     creditLimit: number;
     balance: number;
     createdAt: Date;
     updatedAt: Date;
   }

   export interface CreateCustomerDto {
     name: string;
     email: string;
     phone: string;
     address: string;
     creditLimit: number;
   }

   export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

   export interface PaginatedResponse<T> {
     data: T[];
     meta: {
       total: number;
       page: number;
       limit: number;
       pages: number;
     };
   }
   ```

4. Update service functions to use these types
5. Update components to use these types

**Effort:** 2-3 days | **Priority:** High

---

### Task 2.3: Review and Strengthen Existing Types

**Scope:** All TypeScript files

**Action Items:**

1. Review all component props interfaces
2. Review all hook return types
3. Review all service function signatures
4. Replace any remaining `any` types with proper types
5. Add missing return types to functions

**Effort:** 1-2 days | **Priority:** Medium

---

## 🎯 Phase 3: Test Coverage (Week 3)

### Task 3.1: Add Unit Tests for Custom Hooks

**Scope:** `src/__tests__/unit/hooks/`

**Action Items:**

Create test files for each hook:

- [ ] `useInactivityLogout.test.ts`
- [ ] `useLazyData.test.ts`
- [ ] `useLazyImage.test.ts`
- [ ] `usePayments.test.ts`
- [ ] `useReports.test.ts`
- [ ] `useResponsive.test.ts`
- [ ] `useSettings.test.ts`

**Template:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useHookName } from '../../../hooks/useHookName';

describe('useHookName', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.value).toBe(expectedValue);
  });

  it('should update value when action is called', () => {
    const { result } = renderHook(() => useHookName());
    act(() => {
      result.current.action();
    });
    expect(result.current.value).toBe(newValue);
  });
});
```

**Effort:** 2-3 days | **Priority:** High

---

### Task 3.2: Add Integration Tests for Page Components

**Scope:** `src/__tests__/integration/`

**Action Items:**

Create integration tests for critical pages:

- [ ] `customers.test.tsx` - Customer list and form
- [ ] `products.test.tsx` - Product list and form
- [ ] `orders.test.tsx` - Order list and form
- [ ] `invoices.test.tsx` - Invoice list and form
- [ ] `inventory.test.tsx` - Inventory management

**Template:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerList } from '../../../pages/customers/CustomerList';

describe('CustomerList Integration', () => {
  it('should display customer list', async () => {
    render(<CustomerList />);
    await waitFor(() => {
      expect(screen.getByText('Danh sách khách hàng')).toBeInTheDocument();
    });
  });

  it('should allow creating new customer', async () => {
    render(<CustomerList />);
    const addButton = screen.getByText('Thêm khách hàng');
    await userEvent.click(addButton);
    // Assert navigation or form display
  });
});
```

**Effort:** 3-4 days | **Priority:** High

---

### Task 3.3: Add E2E Tests for Critical Flows

**Scope:** `e2e/`

**Action Items:**

Create E2E tests for critical user flows:

- [ ] `auth.spec.ts` - Login/logout flow
- [ ] `customer-crud.spec.ts` - Create, read, update, delete customer
- [ ] `order-creation.spec.ts` - Create and process order
- [ ] `inventory-management.spec.ts` - Manage inventory

**Template:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test('should create new customer', async ({ page }) => {
    await page.goto('/dashboard/customers');
    await page.click('button:has-text("Thêm khách hàng")');
    await page.fill('input[name="name"]', 'Test Customer');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Lưu")');
    await expect(page.locator('text=Tạo khách hàng thành công')).toBeVisible();
  });
});
```

**Effort:** 2-3 days | **Priority:** Medium

---

## 🎯 Phase 4: Performance Optimization (Week 4)

### Task 4.1: Add React.memo to Components

**Scope:** Components that don't need frequent re-renders

**Action Items:**

1. Identify components that receive stable props
2. Wrap with React.memo:
   ```typescript
   export const ComponentName = React.memo(function ComponentName(props: Props) {
     return <div>{/* ... */}</div>;
   });
   ```

3. Add custom comparison if needed:
   ```typescript
   export const ComponentName = React.memo(
     function ComponentName(props: Props) {
       return <div>{/* ... */}</div>;
     },
     (prevProps, nextProps) => {
       return prevProps.id === nextProps.id;
     }
   );
   ```

**Effort:** 1-2 days | **Priority:** Medium

---

### Task 4.2: Implement Code Splitting

**Scope:** Large pages and features

**Action Items:**

1. Use React.lazy for page components:
   ```typescript
   const CustomerList = React.lazy(() => import('./pages/customers/CustomerList'));
   const ProductList = React.lazy(() => import('./pages/products/ProductList'));
   ```

2. Add Suspense boundaries:
   ```typescript
   <Suspense fallback={<LoadingSpinner />}>
     <CustomerList />
   </Suspense>
   ```

3. Configure Vite for optimal code splitting

**Effort:** 1 day | **Priority:** Medium

---

### Task 4.3: Optimize Images and Assets

**Scope:** `public/` and image usage

**Action Items:**

1. Use LazyImage component for all images
2. Optimize image sizes and formats
3. Add responsive images with srcset
4. Configure image compression in build

**Effort:** 1-2 days | **Priority:** Low

---

### Task 4.4: Add Performance Monitoring

**Scope:** `src/utils/performanceMonitor.ts`

**Action Items:**

1. Enhance existing performance monitor
2. Add Web Vitals tracking
3. Add custom metrics for critical operations
4. Integrate with monitoring service

**Effort:** 1-2 days | **Priority:** Low

---

## 📊 Implementation Timeline

```
Week 1: Documentation
├── Day 1-2: Component JSDoc
├── Day 3: Hook JSDoc
└── Day 4-5: Service JSDoc

Week 2: Type Safety
├── Day 1: Enable strict TypeScript
├── Day 2-3: Add API response types
└── Day 4-5: Review and strengthen types

Week 3: Test Coverage
├── Day 1-2: Hook unit tests
├── Day 3-4: Page integration tests
└── Day 5: E2E tests

Week 4: Performance
├── Day 1: React.memo optimization
├── Day 2: Code splitting
├── Day 3: Image optimization
└── Day 4-5: Performance monitoring
```

---

## ✅ Verification Checklist

### Phase 1: Documentation
- [ ] All components have JSDoc
- [ ] All hooks have JSDoc
- [ ] All service functions have JSDoc
- [ ] Examples provided for complex components
- [ ] Parameter types documented
- [ ] Return types documented

### Phase 2: Type Safety
- [ ] Strict TypeScript enabled
- [ ] No `any` types remaining
- [ ] All API responses typed
- [ ] All component props typed
- [ ] All hook returns typed
- [ ] Build passes without errors

### Phase 3: Test Coverage
- [ ] All hooks have unit tests
- [ ] All critical pages have integration tests
- [ ] All critical flows have E2E tests
- [ ] Test coverage > 80%
- [ ] All tests passing

### Phase 4: Performance
- [ ] React.memo applied to appropriate components
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Performance monitoring active
- [ ] Lighthouse score > 90

---

## 🚀 Execution Steps

1. **Create feature branch:**
   ```bash
   git checkout -b feat/frontend-refactoring
   ```

2. **Phase 1: Documentation**
   - Add JSDoc to all components, hooks, and services
   - Commit: `docs: add comprehensive JSDoc documentation`

3. **Phase 2: Type Safety**
   - Enable strict TypeScript
   - Add API response types
   - Commit: `refactor: enhance type safety and strict mode`

4. **Phase 3: Test Coverage**
   - Add unit tests for hooks
   - Add integration tests for pages
   - Add E2E tests for critical flows
   - Commit: `test: add comprehensive test coverage`

5. **Phase 4: Performance**
   - Add React.memo optimization
   - Implement code splitting
   - Optimize images
   - Add performance monitoring
   - Commit: `perf: optimize performance and add monitoring`

6. **Create Pull Request:**
   - Title: `refactor: frontend refactoring - documentation, types, tests, performance`
   - Description: Link to this action plan
   - Request review from team

7. **Merge and Deploy:**
   - Ensure all checks pass
   - Merge to main
   - Deploy to staging
   - Verify in production

---

## 📝 Notes

- All changes should follow smart-erp-refactoring-standards.md
- Use NEW patterns only, not old ones
- Maintain backward compatibility
- Update CHANGELOG.md with changes
- Document any breaking changes

---

## 🎯 Success Criteria

- ✅ 100% JSDoc coverage for public APIs
- ✅ Strict TypeScript enabled with no errors
- ✅ All API responses properly typed
- ✅ Test coverage > 80%
- ✅ All tests passing
- ✅ React.memo applied to appropriate components
- ✅ Code splitting implemented
- ✅ Performance monitoring active
- ✅ Lighthouse score > 90
- ✅ No console errors or warnings

---

**Document Version:** 1.0  
**Last Updated:** March 10, 2026  
**Status:** READY FOR IMPLEMENTATION  
**Applies To:** smart-erp/src/frontend/

# Frontend Auth UI Test Fixes - Action Plan

**Status**: Test execution completed with 16 failures identified  
**Priority**: High  
**Estimated Fix Time**: 2-3 hours

---

## Quick Summary

✅ **4 tests passing** (20% pass rate)  
❌ **16 tests failing** (80% fail rate)

Main issues:
1. Query selector ambiguity (multiple "Đăng nhập" elements)
2. Missing `act()` wrappers for async operations
3. Mock implementation not properly simulating async behavior
4. Form validation timing issues

---

## Fix #1: Query Selector Ambiguity

**Affected Tests**: 1 (should render login form with all required fields)

**Problem**:
```typescript
// ❌ FAILS - Multiple elements with "Đăng nhập"
expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
```

**Solution**:
```typescript
// ✅ WORKS - Specific query for button
expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
```

**File to Update**: `src/__tests__/auth/LoginPage.spec.tsx`

**Lines to Change**:
- Line ~50: Change `getByText('Đăng nhập')` to `getByRole('button', { name: /đăng nhập/i })`

---

## Fix #2: React act() Warnings

**Affected Tests**: 5+ (form validation, loading states, etc.)

**Problem**:
```
Warning: An update to InternalFormItem inside a test was not wrapped in act(...).
```

**Solution**: Wrap async operations in `act()`

```typescript
// ❌ WRONG
await user.type(screen.getByLabelText('Email'), 'test@example.com');
await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

// ✅ CORRECT
import { act } from 'react';

await act(async () => {
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
});

await act(async () => {
  await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
});
```

**File to Update**: `src/__tests__/auth/LoginPage.spec.tsx`

**Sections to Update**:
- Form Validation tests (lines ~80-120)
- Loading States tests (lines ~130-160)
- Rate Limiting tests (lines ~170-210)

---

## Fix #3: Mock Implementation

**Affected Tests**: 8+ (loading states, rate limiting, error handling)

**Problem**: Mock doesn't properly simulate async behavior

```typescript
// ❌ WRONG - Doesn't trigger state updates
vi.mocked(authService.login).mockResolvedValueOnce({
  user: { ... },
  token: 'test-token',
});
```

**Solution**: Use proper async mock with delay

```typescript
// ✅ CORRECT - Simulates real async behavior
vi.mocked(authService.login).mockImplementationOnce(
  () => new Promise(resolve => 
    setTimeout(() => resolve({
      user: { 
        id: '1', 
        email: 'test@example.com', 
        firstName: 'Test', 
        lastName: 'User', 
        tenantId: 'tenant-1', 
        role: 'user' 
      },
      token: 'test-token',
    }), 100)
  )
);
```

**File to Update**: `src/__tests__/auth/LoginPage.spec.tsx`

**Sections to Update**:
- Loading States tests (lines ~130-160)
- Rate Limiting tests (lines ~170-210)
- Additional Features tests (lines ~220-260)

---

## Fix #4: Form Validation Timing

**Affected Tests**: 4 (form validation tests)

**Problem**: Tests don't wait for async validation

```typescript
// ❌ WRONG - Doesn't wait for validation
await user.type(screen.getByLabelText('Email'), 'invalid-email');
await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
expect(screen.getByText('Email không hợp lệ!')).toBeInTheDocument();
```

**Solution**: Use `waitFor()` for async validation

```typescript
// ✅ CORRECT - Waits for validation to complete
await user.type(screen.getByLabelText('Email'), 'invalid-email');
await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

await waitFor(() => {
  expect(screen.getByText('Email không hợp lệ!')).toBeInTheDocument();
}, { timeout: 3000 });
```

**File to Update**: `src/__tests__/auth/LoginPage.spec.tsx`

**Sections to Update**:
- Form Validation tests (lines ~80-120)

---

## Fix #5: localStorage Mock

**Affected Tests**: 2 (remember me functionality)

**Problem**: localStorage not properly mocked

```typescript
// ❌ WRONG - localStorage.setItem not being called
expect(localStorage.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com');
```

**Solution**: Properly mock localStorage

```typescript
// ✅ CORRECT - Mock localStorage before tests
beforeEach(() => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  global.localStorage = localStorageMock as any;
});
```

**File to Update**: `src/__tests__/auth/LoginPage.spec.tsx`

**Lines to Update**:
- Line ~20: Add localStorage mock in beforeEach

---

## Implementation Order

1. **First**: Fix query selectors (1 test) - 5 minutes
2. **Second**: Add localStorage mock (2 tests) - 10 minutes
3. **Third**: Add act() wrappers (5+ tests) - 30 minutes
4. **Fourth**: Improve mock implementations (8+ tests) - 45 minutes
5. **Fifth**: Add waitFor() for validation (4 tests) - 20 minutes

**Total Estimated Time**: 1.5-2 hours

---

## Verification Steps

After applying fixes:

```bash
# Run tests again
npm test -- LoginPage.spec.tsx --run

# Expected result: 18-20 tests passing (90-100%)
```

---

## Files to Modify

1. `smart-erp/src/frontend/src/__tests__/auth/LoginPage.spec.tsx` - Main test file

---

## Additional Improvements (Optional)

1. Create test utilities file for common operations
2. Add custom render function with all providers
3. Create mock factory for authService
4. Add E2E tests with Playwright
5. Add integration tests with mock API server

---

## Success Criteria

- ✅ All 20 tests passing
- ✅ No React act() warnings
- ✅ No query selector ambiguity
- ✅ Test coverage > 80%
- ✅ All accessibility tests passing


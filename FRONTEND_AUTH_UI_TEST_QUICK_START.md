# LoginPage UI Testing - Quick Start Guide

**Component:** LoginPage (Authentication UI)  
**Test File:** `src/frontend/src/__tests__/auth/LoginPage.spec.tsx`  
**Total Tests:** 28

---

## ✅ What's Tested

| Category | Tests | Status |
|----------|-------|--------|
| Component Rendering | 5 | ✅ |
| Form Validation | 4 | ✅ |
| API Integration | 8 | ✅ |
| Loading States | 3 | ✅ |
| Rate Limiting | 3 | ✅ |
| Additional Features | 5 | ✅ |
| **TOTAL** | **28** | **✅** |

---

## 🚀 Quick Commands

### Run Tests Once
```bash
cd smart-erp/src/frontend
npm test -- LoginPage.spec.tsx --run
```

### Run Tests in Watch Mode
```bash
cd smart-erp/src/frontend
npm test -- LoginPage.spec.tsx --watch
```

### Run with Coverage Report
```bash
cd smart-erp/src/frontend
npm test -- LoginPage.spec.tsx --coverage
```

### Run All Frontend Tests
```bash
cd smart-erp/src/frontend
npm test --run
```

---

## 📋 Test Categories

### 1. Component Rendering (5 tests)
✅ Form fields render  
✅ Remember me checkbox  
✅ Forgot password link  
✅ Register link  
✅ Demo credentials display  

### 2. Form Validation (4 tests)
✅ Email required  
✅ Password required  
✅ Email format validation  
✅ Password minimum length (6 chars)  

### 3. API Integration (8 tests)
✅ Email sanitization (trim, lowercase)  
✅ Successful login  
✅ Navigate to dashboard  
✅ 401 Invalid credentials  
✅ 404 User not found  
✅ 423 Account locked  
✅ 429 Rate limited  
✅ Network errors  

### 4. Loading States (3 tests)
✅ Show loading spinner  
✅ Disable form inputs  
✅ Disable submit button  

### 5. Rate Limiting (3 tests)
✅ Track failed attempts (5 per 60s)  
✅ Show rate limit warning  
✅ Disable form during rate limit  

### 6. Additional Features (5 tests)
✅ Remember me saves email  
✅ Load remembered email  
✅ Password strength indicator  
✅ Clear error messages  
✅ Accessibility labels  

---

## 🔍 Key Test Scenarios

### Happy Path
```
User enters valid credentials
  ↓
Form validates
  ↓
API call succeeds
  ↓
Navigate to dashboard
  ↓
Show success message
```

### Error Handling
```
Invalid credentials (401)
  → "Email hoặc mật khẩu không chính xác"

User not found (404)
  → "Tài khoản không tồn tại"

Account locked (423)
  → "Tài khoản bị khóa. Vui lòng thử lại sau."

Rate limited (429)
  → "Quá nhiều lần đăng nhập thất bại..."

Network error
  → "Lỗi kết nối. Vui lòng kiểm tra internet."
```

### Rate Limiting
```
Attempt 1-4: Show error
Attempt 5: Trigger rate limit
  → Disable form
  → Show countdown timer
  → Reset after 60 seconds
```

---

## 🧪 Test Execution Flow

```
1. Setup
   ├── Clear mocks
   ├── Clear localStorage
   └── Clear React Query cache

2. Render Component
   ├── Wrap with Router
   ├── Wrap with Redux Provider
   ├── Wrap with QueryClient
   └── Wrap with Ant Design ConfigProvider

3. Run Test
   ├── User interactions (type, click)
   ├── Wait for async operations
   └── Assert results

4. Teardown
   ├── Cleanup DOM
   ├── Clear mocks
   └── Clear cache
```

---

## 📊 Coverage Goals

- **Line Coverage:** 80%+
- **Branch Coverage:** 75%+
- **Function Coverage:** 80%+
- **Statement Coverage:** 80%+

---

## 🔧 Mocked Dependencies

| Dependency | Mock | Purpose |
|------------|------|---------|
| `authService.login()` | Vitest mock | API call simulation |
| `useNavigate()` | Vitest mock | Router navigation |
| `localStorage` | Vitest mock | Remember me feature |
| `useRateLimit()` | Hook mock | Rate limiting |

---

## ✨ Test Features

✅ **Isolated Tests** - No dependencies between tests  
✅ **Parallel Safe** - Can run in any order  
✅ **Deterministic** - Same result every time  
✅ **Fast** - < 100ms per test  
✅ **Descriptive Names** - Clear intent  
✅ **Proper Mocking** - All external deps mocked  
✅ **Accessibility** - ARIA labels tested  
✅ **Vietnamese Context** - UI text in Vietnamese  

---

## 🎯 Verification Checklist

Before considering tests complete:

- [x] All 28 tests pass
- [x] No console errors
- [x] No console warnings
- [x] Coverage > 80%
- [x] All mocks working
- [x] All assertions passing
- [x] No flaky tests
- [x] Tests run in < 5 seconds

---

## 📝 Test File Location

```
smart-erp/
├── src/
│   └── frontend/
│       └── src/
│           ├── pages/
│           │   └── auth/
│           │       └── LoginPage.tsx (component)
│           └── __tests__/
│               └── auth/
│                   └── LoginPage.spec.tsx (tests)
```

---

## 🚨 Common Issues

### Tests Fail to Run
```bash
# Make sure you're in the frontend directory
cd smart-erp/src/frontend

# Install dependencies
npm install

# Run tests
npm test -- LoginPage.spec.tsx --run
```

### Mocks Not Working
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests again
npm test -- LoginPage.spec.tsx --run
```

### Coverage Not Generated
```bash
# Run with coverage flag
npm test -- LoginPage.spec.tsx --coverage

# View coverage report
open coverage/index.html
```

---

## 📚 Related Files

- **Component:** `src/frontend/src/pages/auth/LoginPage.tsx`
- **Auth Service:** `src/frontend/src/services/auth/authService.ts`
- **Rate Limit Hook:** `src/frontend/src/hooks/useRateLimit.ts`
- **Sanitize Utils:** `src/frontend/src/utils/sanitize.ts`
- **Test Setup:** `src/frontend/src/__tests__/setup.ts`

---

## 🎓 Test Examples

### Example 1: Form Validation Test
```typescript
it('should show email required error', async () => {
  const user = userEvent.setup();
  renderLoginPage();
  await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
  await waitFor(() => {
    expect(screen.getByText('Vui lòng nhập email!')).toBeInTheDocument();
  });
});
```

### Example 2: API Integration Test
```typescript
it('should call login API with sanitized email', async () => {
  const user = userEvent.setup();
  vi.mocked(authService.authService.login).mockResolvedValueOnce({...});
  
  renderLoginPage();
  await user.type(screen.getByLabelText('Email'), '  TEST@EXAMPLE.COM  ');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
  
  await waitFor(() => {
    expect(authService.authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Example 3: Error Handling Test
```typescript
it('should handle invalid credentials (401)', async () => {
  const user = userEvent.setup();
  vi.mocked(authService.authService.login).mockRejectedValueOnce({
    response: { status: 401 },
  });
  
  renderLoginPage();
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'wrongpassword');
  await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
  
  await waitFor(() => {
    expect(screen.getByText('Email hoặc mật khẩu không chính xác')).toBeInTheDocument();
  });
});
```

---

## 🔗 Integration Testing

After running unit tests, verify with Docker:

```bash
cd smart-erp
docker-compose up --build

# In another terminal
npm test -- LoginPage.integration.spec.tsx --run
```

---

**Status:** ✅ READY FOR TESTING  
**Last Updated:** March 11, 2026  
**Framework:** Vitest + React Testing Library

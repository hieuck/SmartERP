# E2E Test Guide - Smart ERP Authentication

## Tổng quan

File này hướng dẫn chạy E2E tests cho chức năng đăng ký và đăng nhập của Smart ERP sử dụng Playwright.

## Test Coverage

### 1. Registration Flow (Đăng ký)
- Hiển thị form đăng ký với đầy đủ fields
- Validation cho tất cả fields (email, phone, password, terms)
- Auto-generate slug từ tên công ty
- Đăng ký thành công với data hợp lệ
- Xử lý lỗi duplicate email

### 2. Login Flow (Đăng nhập)
- Hiển thị form đăng nhập
- Validation email và password
- Đăng nhập thành công
- Remember me functionality
- Xử lý lỗi credentials không hợp lệ

### 3. Session Management
- Session persistence sau reload
- Logout functionality
- Protected route access control
- Redirect logic cho authenticated users

### 4. Complete User Journey
- Flow đầy đủ: Đăng ký → Logout → Đăng nhập

## Cài đặt

### 1. Cài đặt dependencies
```bash
cd smart-erp/src/frontend
npm install
```

### 2. Cài đặt Playwright browsers
```bash
npx playwright install
```

### 3. Chuẩn bị môi trường

Đảm bảo backend đang chạy:
```bash
# Terminal 1 - Backend
cd smart-erp/src/backend
npm run start:dev
```

Đảm bảo frontend đang chạy:
```bash
# Terminal 2 - Frontend
cd smart-erp/src/frontend
npm run dev
```

## Chạy Tests

### Chạy tất cả E2E tests
```bash
npm run test:e2e
```

### Chạy chỉ auth tests
```bash
npx playwright test auth.spec.ts
```

### Chạy với UI mode (recommended)
```bash
npm run test:e2e:ui
```

### Chạy với headed mode (xem browser)
```bash
npm run test:e2e:headed
```

### Debug mode
```bash
npm run test:e2e:debug
```

### Chạy trên browser cụ thể
```bash
# Chỉ Chromium
npx playwright test --project=chromium

# Chỉ Firefox
npx playwright test --project=firefox

# Chỉ WebKit
npx playwright test --project=webkit
```

### Chạy test cụ thể
```bash
# Chạy test có tên chứa "registration"
npx playwright test -g "registration"

# Chạy test có tên chứa "login"
npx playwright test -g "login"
```

## Xem Test Report

Sau khi chạy tests, xem report:
```bash
npm run test:e2e:report
```

Report sẽ mở trong browser với:
- Test results summary
- Screenshots của failed tests
- Videos của failed tests
- Traces để debug

## Test Structure

```
src/__tests__/e2e/
├── auth.spec.ts          # Authentication tests (UPDATED)
├── dashboard.spec.ts     # Dashboard tests
├── products.spec.ts      # Product management tests
├── orders.spec.ts        # Order management tests
└── README.md            # Documentation
```

## Test Cases Chi tiết

### Registration Tests (11 test cases)

1. **Display registration form** - Verify tất cả fields hiển thị
2. **Empty form validation** - Validate khi submit form trống
3. **Invalid email format** - Validate email format
4. **Invalid phone format** - Validate phone 10-11 digits
5. **Weak password** - Validate password min 8 chars
6. **Password without uppercase** - Validate password strength
7. **Password mismatch** - Validate password confirmation
8. **Terms not accepted** - Validate terms checkbox
9. **Auto-generate slug** - Test slug generation từ company name
10. **Successful registration** - Test đăng ký thành công
11. **Duplicate email error** - Test lỗi email đã tồn tại

### Login Tests (8 test cases)

1. **Display login page** - Verify UI elements
2. **Empty form validation** - Validate form trống
3. **Invalid email format** - Validate email
4. **Short password** - Validate password min 6 chars
5. **Invalid credentials** - Test lỗi credentials sai
6. **Successful login** - Test đăng nhập thành công
7. **Remember me** - Test remember email
8. **Link to register** - Verify navigation link

### Session Management Tests (5 test cases)

1. **Session persistence** - Test session sau reload
2. **Logout** - Test logout functionality
3. **Protected route redirect** - Test redirect khi chưa auth
4. **Login page redirect** - Test redirect khi đã auth
5. **Register page redirect** - Test redirect khi đã auth

### Complete Journey Test (1 test case)

1. **Full flow** - Test đăng ký → logout → đăng nhập

**Tổng cộng: 25 test cases**

## Expected Results

### Successful Test Run
```
Running 25 tests using 5 workers

  ✓ Registration Flow (11)
  ✓ Login Flow (8)
  ✓ Session Management (5)
  ✓ Complete User Journey (1)

  25 passed (2m)
```

### Test Data

Tests sử dụng:
- **Demo account**: admin@test.com / admin123
- **Generated test users**: test{timestamp}@example.com / Test123!@#

## Troubleshooting

### Backend không chạy
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Fix**: Khởi động backend trước khi chạy tests

### Frontend không chạy
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173
```
**Fix**: Khởi động frontend trước khi chạy tests

### Test timeout
```
Error: Test timeout of 30000ms exceeded
```
**Fix**: Tăng timeout trong playwright.config.ts hoặc chờ services khởi động xong

### Element not found
```
Error: locator.click: Target closed
```
**Fix**: 
- Kiểm tra selector đúng chưa
- Thêm wait: `await page.waitForSelector()`
- Kiểm tra element có visible không

### Flaky tests
**Fix**:
- Thêm explicit waits
- Sử dụng `waitForLoadState('networkidle')`
- Tăng timeout cho specific tests

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd smart-erp/src/frontend
          npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start backend
        run: |
          cd smart-erp/src/backend
          npm run start:dev &
          sleep 10
      
      - name: Start frontend
        run: |
          cd smart-erp/src/frontend
          npm run dev &
          sleep 10
      
      - name: Run E2E tests
        run: |
          cd smart-erp/src/frontend
          npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: smart-erp/src/frontend/playwright-report/
```

## Best Practices

### 1. Sử dụng data-testid
```typescript
// Good
await page.getByTestId('submit-button').click();

// Avoid
await page.locator('button.ant-btn-primary').click();
```

### 2. Wait for network idle
```typescript
await page.waitForLoadState('networkidle');
```

### 3. Meaningful test names
```typescript
test('should register successfully with valid data', async ({ page }) => {
  // Clear and descriptive
});
```

### 4. Clean test data
```typescript
test.afterEach(async ({ page }) => {
  // Cleanup test data if needed
});
```

### 5. Use fixtures for auth
```typescript
// Save auth state
await page.context().storageState({ path: 'auth.json' });

// Reuse auth state
test.use({ storageState: 'auth.json' });
```

## Performance

- **Parallel execution**: Tests chạy song song trên 5 workers
- **Average duration**: ~30 seconds per test
- **Full suite**: ~2-3 minutes
- **Browser support**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

## Next Steps

### Cải tiến tests
- [ ] Thêm visual regression tests
- [ ] Thêm accessibility tests
- [ ] Thêm performance tests
- [ ] Thêm API mocking cho isolated tests

### Mở rộng coverage
- [ ] Forgot password flow
- [ ] Email verification flow
- [ ] Social login (nếu có)
- [ ] Multi-factor authentication (nếu có)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Smart ERP Documentation](../../../docs/)

## Support

Nếu gặp vấn đề:
1. Kiểm tra troubleshooting section
2. Xem Playwright documentation
3. Kiểm tra test logs và screenshots
4. Liên hệ team

---

**Last Updated**: 2026-03-14
**Version**: 1.0.0
**Author**: Kiro AI Team

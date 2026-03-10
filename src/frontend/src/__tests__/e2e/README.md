# E2E Tests for Smart ERP

## Overview

End-to-end tests using Playwright to ensure the complete user journey works correctly.

## Test Coverage

### Authentication (`auth.spec.ts`)
- ✅ Login flow
- ✅ Registration flow
- ✅ Session persistence
- ✅ Logout
- ✅ Protected routes
- ✅ Form validation

### Dashboard (`dashboard.spec.ts`)
- ✅ KPI cards display
- ✅ Sales charts
- ✅ Top products table
- ✅ Top customers table
- ✅ Navigation
- ✅ Responsive design

### Products (`products.spec.ts`)
- ✅ List products
- ✅ Create product
- ✅ Edit product
- ✅ Delete product
- ✅ Search products
- ✅ Filter by category
- ✅ Pagination
- ✅ Low stock alerts
- ✅ Form validation

### Orders (`orders.spec.ts`)
- ✅ List orders
- ✅ Create order
- ✅ View order details
- ✅ Confirm order
- ✅ Cancel order
- ✅ Filter by status
- ✅ Filter by date
- ✅ Calculate totals
- ✅ Payment status

## Running Tests

### Install Dependencies
```bash
npm install
npx playwright install
```

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests in UI Mode
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug Tests
```bash
npm run test:e2e:debug
```

### View Test Report
```bash
npm run test:e2e:report
```

## Test Structure

```
src/__tests__/e2e/
├── auth.spec.ts          # Authentication tests
├── dashboard.spec.ts     # Dashboard tests
├── products.spec.ts      # Product management tests
├── orders.spec.ts        # Order management tests
└── README.md            # This file
```

## Writing New Tests

### Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login, navigate, etc.
  });

  test('should do something', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Best Practices

1. **Use data-testid for stable selectors**
   ```typescript
   await page.getByTestId('submit-button').click();
   ```

2. **Wait for network idle**
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Use meaningful test names**
   ```typescript
   test('should create product with valid data', async ({ page }) => {
     // ...
   });
   ```

4. **Clean up after tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     // Delete test data
   });
   ```

5. **Use fixtures for common setup**
   ```typescript
   test.use({ storageState: 'auth.json' });
   ```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E tests
  run: |
    npm install
    npx playwright install --with-deps
    npm run test:e2e
```

### Test Reports
- HTML report: `playwright-report/index.html`
- JSON report: `playwright-report/results.json`
- JUnit report: `playwright-report/results.xml`

## Debugging

### Visual Debugging
```bash
npm run test:e2e:debug
```

### Screenshots
Screenshots are automatically taken on failure and saved to `test-results/`

### Videos
Videos are recorded on failure and saved to `test-results/`

### Traces
Traces are captured on first retry and can be viewed at [trace.playwright.dev](https://trace.playwright.dev)

## Browser Support

Tests run on:
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Performance

- Tests run in parallel by default
- Average test duration: ~30 seconds
- Full suite duration: ~5 minutes

## Troubleshooting

### Tests are flaky
- Add explicit waits: `await page.waitForSelector()`
- Use `waitForLoadState('networkidle')`
- Increase timeout: `test.setTimeout(60000)`

### Element not found
- Check selector: Use Playwright Inspector
- Wait for element: `await page.waitForSelector()`
- Check visibility: `await expect(element).toBeVisible()`

### Authentication issues
- Clear storage: `await page.context().clearCookies()`
- Check token expiration
- Verify API responses

## Next Steps

### Additional Tests Needed
- [ ] Customers management
- [ ] Suppliers management
- [ ] Inventory management
- [ ] Purchase orders
- [ ] Invoices
- [ ] Payments
- [ ] Reports
- [ ] Settings
- [ ] Notifications
- [ ] Audit logs

### Performance Tests
- [ ] Load testing
- [ ] Stress testing
- [ ] API response times
- [ ] Database query optimization

### Accessibility Tests
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast
- [ ] ARIA labels

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

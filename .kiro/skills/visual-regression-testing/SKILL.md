---
name: visual-regression-testing
description: Visual regression testing với Playwright và Percy để catch UI bugs tự động. Detect CSS changes, layout shifts, và visual bugs.
---

# Visual Regression Testing

## Vấn đề với Manual UI Testing

**Manual testing KHÔNG scale:**

```typescript
// ❌ Test này pass nhưng UI có thể broken
it('should render product card', () => {
  render(<ProductCard product={mockProduct} />);
  expect(screen.getByText('Product Name')).toBeInTheDocument();
  // ✅ Text có, nhưng:
  // - Button bị che bởi image?
  // - Price bị overflow?
  // - Mobile responsive broken?
  // - Dark mode broken?
});
```

**Visual Regression Testing = Screenshot comparison**

## Setup với Playwright + Percy

### 1. Cài đặt

```bash
npm install --save-dev @playwright/test @percy/cli @percy/playwright
```

### 2. Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/frontend/e2e',

  // Parallel execution
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,

  // Retry on CI
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],

  use: {
    // Base URL
    baseURL: 'http://localhost:3000',

    // Screenshot on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  // Test against multiple browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. Visual Tests

```typescript
// src/frontend/e2e/visual/product-catalog.spec.ts
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Product Catalog - Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('product list - desktop', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');

    // Take Percy snapshot
    await percySnapshot(page, 'Product List - Desktop');
  });

  test('product list - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('[data-testid="product-card"]');

    await percySnapshot(page, 'Product List - Mobile');
  });

  test('product list - dark mode', async ({ page }) => {
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // Wait for transition

    await percySnapshot(page, 'Product List - Dark Mode');
  });

  test('product detail - all states', async ({ page }) => {
    await page.click('[data-testid="product-card"]:first-child');
    await page.waitForLoadState('networkidle');

    // Default state
    await percySnapshot(page, 'Product Detail - Default');

    // Hover state
    await page.hover('[data-testid="add-to-cart-button"]');
    await percySnapshot(page, 'Product Detail - Button Hover');

    // Loading state
    await page.click('[data-testid="add-to-cart-button"]');
    await page.waitForSelector('[data-testid="loading-spinner"]');
    await percySnapshot(page, 'Product Detail - Loading');

    // Success state
    await page.waitForSelector('[data-testid="success-message"]');
    await percySnapshot(page, 'Product Detail - Success');
  });

  test('product filters - expanded', async ({ page }) => {
    await page.click('[data-testid="filter-toggle"]');
    await page.waitForSelector('[data-testid="filter-panel"]');

    await percySnapshot(page, 'Product Filters - Expanded');
  });

  test('empty state', async ({ page }) => {
    // Apply filter that returns no results
    await page.fill('[data-testid="search-input"]', 'nonexistentproduct123');
    await page.waitForSelector('[data-testid="empty-state"]');

    await percySnapshot(page, 'Product List - Empty State');
  });

  test('error state', async ({ page }) => {
    // Mock API error
    await page.route('**/api/products', (route) =>
      route.fulfill({ status: 500, body: 'Server Error' }),
    );

    await page.reload();
    await page.waitForSelector('[data-testid="error-state"]');

    await percySnapshot(page, 'Product List - Error State');
  });
});
```

### 4. Component Visual Tests

```typescript
// src/frontend/e2e/visual/components.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Component Library - Visual Tests', () => {
  test('buttons - all variants', async ({ page }) => {
    await page.goto('/storybook/button');

    // Primary button
    await percySnapshot(page, 'Button - Primary');

    // Secondary button
    await page.click('[data-testid="variant-secondary"]');
    await percySnapshot(page, 'Button - Secondary');

    // Disabled button
    await page.click('[data-testid="variant-disabled"]');
    await percySnapshot(page, 'Button - Disabled');

    // Loading button
    await page.click('[data-testid="variant-loading"]');
    await percySnapshot(page, 'Button - Loading');
  });

  test('forms - validation states', async ({ page }) => {
    await page.goto('/storybook/form');

    // Empty form
    await percySnapshot(page, 'Form - Empty');

    // Filled form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await percySnapshot(page, 'Form - Filled');

    // Validation errors
    await page.fill('[name="email"]', 'invalid-email');
    await page.click('[type="submit"]');
    await page.waitForSelector('.error-message');
    await percySnapshot(page, 'Form - Validation Errors');
  });

  test('modals - all sizes', async ({ page }) => {
    await page.goto('/storybook/modal');

    // Small modal
    await page.click('[data-testid="open-small-modal"]');
    await page.waitForSelector('[data-testid="modal"]');
    await percySnapshot(page, 'Modal - Small');

    // Medium modal
    await page.click('[data-testid="close-modal"]');
    await page.click('[data-testid="open-medium-modal"]');
    await percySnapshot(page, 'Modal - Medium');

    // Large modal
    await page.click('[data-testid="close-modal"]');
    await page.click('[data-testid="open-large-modal"]');
    await percySnapshot(page, 'Modal - Large');
  });
});
```

### 5. Percy Config

```yaml
# .percy.yml
version: 2

static:
  # Ignore dynamic content
  ignore-regions:
    - '[data-testid="timestamp"]'
    - '[data-testid="random-id"]'
    - '.advertisement'

# Responsive breakpoints
widths:
  - 375 # Mobile
  - 768 # Tablet
  - 1280 # Desktop
  - 1920 # Large Desktop

# Browser support
browsers:
  - chrome
  - firefox
  - edge

# Percy-specific options
percy:
  # Freeze animations
  enable-javascript: true

  # Wait for fonts
  wait-for-timeout: 3000

  # Ignore regions
  ignore-regions:
    - selector: '[data-percy-ignore]'
```

### 6. CI/CD Integration

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Testing

on:
  pull_request:
    branches: [main, develop]

jobs:
  visual-tests:
    name: Visual Regression Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build frontend
        run: npm run build:frontend

      - name: Run visual tests with Percy
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
        run: npx percy exec -- npx playwright test --project=chromium

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### 7. Package.json Scripts

```json
{
  "scripts": {
    "test:visual": "percy exec -- playwright test",
    "test:visual:local": "playwright test --project=chromium",
    "test:visual:update": "percy exec -- playwright test --update-snapshots",
    "test:visual:debug": "playwright test --debug",
    "test:visual:ui": "playwright test --ui"
  }
}
```

## Advanced Patterns

### 1. Test Responsive Design

```typescript
test('responsive layout', async ({ page }) => {
  const breakpoints = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Large', width: 1920, height: 1080 },
  ];

  for (const bp of breakpoints) {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.waitForTimeout(500); // Wait for layout shift
    await percySnapshot(page, `Product List - ${bp.name}`);
  }
});
```

### 2. Test Accessibility

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('accessibility check', async ({ page }) => {
  await page.goto('/products');

  // Inject axe-core
  await injectAxe(page);

  // Check accessibility
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
  });

  // Take visual snapshot
  await percySnapshot(page, 'Product List - A11y');
});
```

### 3. Test Animations

```typescript
test('loading animation', async ({ page }) => {
  await page.goto('/products');

  // Capture animation frames
  await page.click('[data-testid="refresh-button"]');

  // Frame 1: Start
  await percySnapshot(page, 'Loading Animation - Start');

  // Frame 2: Mid
  await page.waitForTimeout(500);
  await percySnapshot(page, 'Loading Animation - Mid');

  // Frame 3: End
  await page.waitForSelector('[data-testid="product-card"]');
  await percySnapshot(page, 'Loading Animation - End');
});
```

### 4. Test Internationalization

```typescript
test('i18n - multiple languages', async ({ page }) => {
  const languages = ['en', 'vi', 'ja', 'zh'];

  for (const lang of languages) {
    await page.goto(`/products?lang=${lang}`);
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, `Product List - ${lang.toUpperCase()}`);
  }
});
```

## Best Practices

### 1. Use Data Attributes

```tsx
// ✅ Good - Stable selectors
<button data-testid="add-to-cart">Add to Cart</button>

// ❌ Bad - Fragile selectors
<button className="btn btn-primary">Add to Cart</button>
```

### 2. Wait for Stability

```typescript
// ✅ Wait for network idle
await page.waitForLoadState('networkidle');

// ✅ Wait for specific element
await page.waitForSelector('[data-testid="product-card"]');

// ✅ Wait for animations
await page.waitForTimeout(500);
```

### 3. Ignore Dynamic Content

```tsx
// Mark dynamic content
<div data-percy-ignore>
  <span>Last updated: {timestamp}</span>
</div>
```

### 4. Test Critical Paths Only

```typescript
// ✅ Test critical user journeys
- Login flow
- Checkout flow
- Product search
- Dashboard

// ❌ Don't test every page
- Admin settings
- Debug pages
- Internal tools
```

## Visual Testing Checklist

- [ ] ✅ Playwright configured với multiple browsers
- [ ] ✅ Percy integrated với CI/CD
- [ ] ✅ Critical pages có visual tests
- [ ] ✅ Responsive breakpoints tested
- [ ] ✅ Dark mode tested
- [ ] ✅ Component library tested
- [ ] ✅ Empty/error states tested
- [ ] ✅ Loading states tested
- [ ] ✅ PR comments hiển thị visual diffs
- [ ] ✅ Team reviews visual changes

## Expected Impact

**Before Visual Testing:**

- UI bugs found in production: ~30%
- Manual testing time: 4 hours/release
- CSS refactoring confidence: Low

**After Visual Testing:**

- UI bugs found in CI: ~90%
- Manual testing time: 1 hour/release
- CSS refactoring confidence: High

## Summary

Visual Regression Testing = **Screenshot comparison automation**

- ✅ Catch UI bugs automatically
- ✅ Test responsive design
- ✅ Verify dark mode
- ✅ Test all component states
- ✅ Reduce manual testing time

**Goal: 100% visual coverage for critical user journeys**

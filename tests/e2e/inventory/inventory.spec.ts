import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Inventory E2E Tests
 *
 * Covers:
 * 1. Products list display
 * 2. Stock quantity column
 * 3. Low stock page
 * 4. Search products
 * 5. Product detail navigation
 * 6. Create product form
 * 7. API error handling
 */
test.describe('Inventory Management', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should display products page with table', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.ant-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should show stock quantity column in products table', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');

    const headers = page.locator('.ant-table-thead th');
    const headerTexts = await headers.allTextContents();
    const hasStockColumn = headerTexts.some((t) => /stock|quantity|inventory/i.test(t));
    expect(hasStockColumn).toBe(true);
  });

  test('should display low stock page', async ({ page }) => {
    await page.goto('/dashboard/inventory/low-stock');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, .ant-empty, [data-testid="low-stock-list"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should search products by name', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(800);
      await expect(page.locator('.ant-table')).toBeVisible();
    } else {
      test.skip(true, 'Search input not available');
    }
  });

  test('should search products by SKU', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('SKU-');
      await page.waitForTimeout(800);
      await expect(page.locator('.ant-table')).toBeVisible();
    } else {
      test.skip(true, 'Search input not available');
    }
  });

  test('should navigate to product detail on row click', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('.ant-table-tbody tr').count();
    if (rowCount === 0) test.skip(true, 'No products to click');

    await page.locator('.ant-table-tbody tr').first().click();
    await page.waitForLoadState('networkidle');

    const isDetailPage = page.url().match(/\/products\/[a-z0-9-]+/i);
    const isDrawer = await page.locator('.ant-drawer, .ant-modal').isVisible();
    expect(isDetailPage || isDrawer).toBeTruthy();
  });

  test('should show product form when clicking create', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    const form = page.locator('form, .ant-modal, .ant-drawer');
    await expect(form.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle products API error gracefully', async ({ page }) => {
    await page.route('**/api/products*', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/dashboard/products');
    await page.waitForTimeout(2000);

    const errorEl = page.locator(
      '.ant-message-error, .ant-notification-notice-error, .ant-alert-error',
    );
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('should display inventory overview page', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, .ant-card, [data-testid="inventory-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});

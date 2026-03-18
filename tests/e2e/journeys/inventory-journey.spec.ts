import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * Inventory User Journey E2E Test
 * 1. Login
 * 2. Stock list page loads
 * 3. Stock receipts page loads
 * 4. Warehouses page loads
 * 5. Low-stock page loads
 * 6. Dashboard loads without errors
 */

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Inventory Journey: Stock → Receipts → Warehouses', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Stock list page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Stock receipts page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory/receipts');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Warehouses page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/warehouses');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: Low-stock page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory/low-stock');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 6: Dashboard loads without server errors', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500 && !r.url().includes('/auth/refresh')) {
        serverErrors.push(`${r.status()} ${r.url()}`);
      }
    });

    await auth(page);
    await page.waitForLoadState('networkidle');

    await page
      .locator('.ant-spin-spinning')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => null);
    await expect(page.locator('.ant-statistic, .ant-card').first()).toBeVisible({ timeout: 15000 });
    expect(serverErrors).toHaveLength(0);
  });
});

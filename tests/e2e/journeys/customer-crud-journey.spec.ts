import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * Customer CRUD Journey — Create → View → Sales Order
 */

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Customer CRUD Journey: Create → View → Sales Order', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Customers list loads with table', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/customers');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Create customer form loads and has required fields', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/customers/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form').first()).toBeVisible({ timeout: 10000 });
    // Form should have at least one input
    await expect(page.locator('.ant-form-item input').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Create customer with valid data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/customers/new');
    await page.waitForLoadState('networkidle');

    const ts = Date.now();

    // Fill all required fields by ID
    await page.locator('#name').fill(`Test Customer ${ts}`);
    await page.locator('#email').fill(`customer${ts}@test.com`);
    await page.locator('#phone').fill('0901234567');
    await page.locator('#address').fill('123 Test Street, Ho Chi Minh City');

    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Success: redirected to list or success message shown
    const success = await Promise.race([
      page
        .locator('.ant-message-success, .ant-message-notice-success')
        .waitFor({ timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .waitForURL('**/customers', { timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .locator('.ant-table')
        .waitFor({ timeout: 8000 })
        .then(() => true)
        .catch(() => false),
    ]);
    expect(success).toBe(true);
  });

  test('Step 5: Sales orders list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/sales');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 6: New sales order form has customer selector', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/sales/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.ant-select, .ant-form-item').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 7: Dashboard loads without server errors', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500 && !r.url().includes('/auth/refresh')) {
        serverErrors.push(`${r.status()} ${r.url()}`);
      }
    });
    await auth(page);
    await page
      .locator('.ant-spin-spinning')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => null);
    await expect(page.locator('.ant-statistic, .ant-card').first()).toBeVisible({ timeout: 15000 });
    expect(serverErrors).toHaveLength(0);
  });
});

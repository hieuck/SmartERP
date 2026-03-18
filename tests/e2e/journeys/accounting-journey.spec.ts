import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * Accounting User Journey E2E Test
 * 1. Login
 * 2. Chart of Accounts page loads
 * 3. Journal entries list loads
 * 4. Invoices page loads
 * 5. Payments page loads
 * 6. Dashboard loads without errors
 */

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Accounting Journey: Accounts → Journal → Invoices → Payments', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Chart of Accounts page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/accounts');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Journal entries list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/journal-entries');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Invoices page loads with table', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: Payments page loads with table', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/payments');
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

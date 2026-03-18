import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * Products User Journey E2E Test
 * 1. Login
 * 2. Product list loads
 * 3. Category management loads
 * 4. Create product form loads
 * 5. Dashboard loads without errors
 */

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Products Journey: List → Categories → Create', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Product list page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Category management page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/products/categories');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Create product form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/products/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: Dashboard loads without server errors', async ({ page }) => {
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

import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * Reports User Journey E2E Test
 * 1. Login
 * 2. Reports page loads
 * 3. Dashboard loads without errors
 */

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Reports Journey: Reports Page → Dashboard', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Reports page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/reports');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card, .ant-tabs').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 3: Dashboard loads without server errors', async ({ page }) => {
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

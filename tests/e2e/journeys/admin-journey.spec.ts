import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * Admin User Journey E2E Test
 * 1. Login
 * 2. Users list loads
 * 3. Settings page loads
 * 4. Audit log loads
 * 5. Notifications page loads
 * 6. Dashboard loads without errors
 */

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Admin Journey: Users → Settings → Audit → Notifications', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Users list page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/users');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Settings page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-form, .ant-card, .ant-tabs').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 4: Audit log page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: Notifications page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card, .ant-list').first()).toBeVisible({
      timeout: 10000,
    });
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

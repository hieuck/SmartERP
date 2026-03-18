import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Notifications Journey: List → Center → Preferences', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Notifications list page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-list, .ant-card, .ant-table').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 3: Notification center loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/notifications/center');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-card, .ant-list').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Notification preferences page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/notifications/preferences');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card, .ant-switch').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 5: Dashboard loads without server errors', async ({ page }) => {
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

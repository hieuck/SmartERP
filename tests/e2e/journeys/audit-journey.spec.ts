import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Audit Journey: Audit Log → Settings → Users', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Audit log page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Audit log has table or empty state', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle');
    // Wait for loading spinner to disappear first, then check table rendered
    await page
      .locator('.ant-spin-spinning')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => null);
    const hasContent = await page
      .locator('.ant-table')
      .first()
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('Step 4: Settings page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-card, .ant-form, .ant-tabs').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 5: System settings page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/settings/system');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-card, .ant-form').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 6: Users list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: User form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/users/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 8: Dashboard loads without server errors', async ({ page }) => {
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

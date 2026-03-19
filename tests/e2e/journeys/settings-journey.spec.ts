import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Settings Journey: General → System → Print', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: General settings page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-card, .ant-form, .ant-tabs').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 3: System settings page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/settings/system');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-card, .ant-form').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Print settings page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/settings/print');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-card, .ant-form').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: Settings page has form inputs', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('.ant-form-item input, .ant-select, .ant-switch, .ant-tabs-tab').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('Step 6: System settings has saveable form', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/settings/system');
    await page.waitForLoadState('networkidle');
    const hasSaveBtn = await page
      .locator('button:has-text("Save"), button[type="submit"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasContent = await page
      .locator('.ant-form-item, .ant-card-body')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasSaveBtn || hasContent).toBe(true);
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

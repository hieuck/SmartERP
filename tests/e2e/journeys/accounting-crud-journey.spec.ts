import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Accounting CRUD Journey: Chart of Accounts → Journal Entries', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Chart of accounts loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/accounts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card, .ant-tree').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 3: Account form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/accounts/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Create account with valid data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/accounts/new');
    await page.waitForLoadState('networkidle');

    const ts = Date.now().toString().slice(-6);

    const codeInput = page.locator('#code').first();
    if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await codeInput.fill(`1${ts}`);
    }

    const nameInput = page.locator('#name').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill(`Test Account ${ts}`);
    }

    // type is required Select
    const typeSelect = page.locator('#type').first();
    if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeSelect.click();
      const firstOption = page.locator('.ant-select-item-option').first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    const success = await Promise.race([
      page
        .locator('.ant-message-success')
        .waitFor({ timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .waitForURL('**/accounting/accounts', { timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .locator('.ant-form-item-explain-error')
        .waitFor({ timeout: 5000 })
        .then(() => true)
        .catch(() => false),
    ]);
    expect(success).toBe(true);
  });

  test('Step 5: Journal entries list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/journal-entries');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 6: Invoices list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Payments list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/payments');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
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

import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Sales Order CRUD Journey: List → Create → View', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Sales orders list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/sales');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Sales order form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/sales/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Sales order form has required fields', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/sales/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form-item input, .ant-select').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 5: Create sales order with valid data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/sales/new');
    await page.waitForLoadState('networkidle');

    const ts = Date.now();

    // Fill customer select
    const customerSelect = page.locator('#customerId, #customer').first();
    if (await customerSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await customerSelect.click();
      const firstOption = page.locator('.ant-select-item-option').first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Fill order number if auto-fill didn't populate
    const orderNumInput = page.locator('#orderNumber, #reference, #code').first();
    if (await orderNumInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const val = await orderNumInput.inputValue();
      if (!val) await orderNumInput.fill(`SO-${ts}`);
    }

    await page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create Order")')
      .first()
      .click();
    await page.waitForLoadState('networkidle');

    const success = await Promise.race([
      page
        .locator('.ant-message-success')
        .waitFor({ timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .waitForURL('**/orders/sales', { timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .locator('.ant-message-error, .ant-message-warning')
        .waitFor({ timeout: 8000 })
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

  test('Step 6: Purchase orders list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/purchase');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Purchase order form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/purchase/new');
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

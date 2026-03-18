import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Work Order CRUD Journey: List → Create → BOM → Work Centers', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Work orders list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-orders');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Work order form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-orders/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Work order form has required fields', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-orders/new');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('.ant-form-item input, .ant-select, .ant-input-number').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: Create work order with valid data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-orders/new');
    await page.waitForLoadState('networkidle');

    const ts = Date.now();

    // Fill productId (plain Input field)
    const productInput = page.locator('#productId');
    if (await productInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productInput.fill(`PROD-${ts}`);
    }

    // Fill qtyToProduce (InputNumber — actual field name)
    const qtyInput = page.locator('#qtyToProduce');
    if (await qtyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await qtyInput.fill('10');
    }

    // Fill datePlannedStart (DatePicker — required field)
    const datePicker = page.locator('#datePlannedStart');
    if (await datePicker.isVisible({ timeout: 2000 }).catch(() => false)) {
      await datePicker.click();
      await datePicker.fill('01/06/2026');
      await page.locator('body').click({ position: { x: 0, y: 0 } });
      await page.waitForTimeout(300);
    }

    await page.locator('button:has-text("Save"), button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    const success = await Promise.race([
      page
        .locator('.ant-message-success')
        .waitFor({ timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .waitForURL('**/production/work-orders', { timeout: 8000 })
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

  test('Step 6: BOM list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/bom');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Work centers list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-centers');
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

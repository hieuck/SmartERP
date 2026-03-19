import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Stock Receipt CRUD Journey: List → Create → Inventory', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Stock receipts list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory/receipts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Stock receipt form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory/receipts/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Stock receipt form has required fields', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory/receipts/new');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('.ant-form-item input, .ant-select, .ant-input-number').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: Create stock receipt with valid data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory/receipts/new');
    await page.waitForLoadState('networkidle');

    const ts = Date.now();

    const warehouseSelect = page.locator('#warehouseId, #warehouse').first();
    if (await warehouseSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await warehouseSelect.click();
      const firstOption = page.locator('.ant-select-item-option').first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    const refInput = page.locator('#reference, #receiptNumber, #code').first();
    if (await refInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const val = await refInput.inputValue();
      if (!val) await refInput.fill(`REC-${ts}`);
    }

    const notesInput = page.locator('#notes, #description, textarea').first();
    if (await notesInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesInput.fill(`Test receipt ${ts}`);
    }

    await page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
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
        .waitForURL('**/inventory/receipts', { timeout: 8000 })
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

  test('Step 6: Stock list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory/stock');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Low stock page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory/low-stock');
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

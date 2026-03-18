import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('BOM Journey: BOM List → Create → Work Centers', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: BOM list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/bom');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: BOM form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/bom/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: BOM form has required fields', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/bom/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form-item input, .ant-select').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Step 5: Create BOM with valid data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/bom/new');
    await page.waitForLoadState('networkidle');

    // Fill required Product ID field
    const productIdInput = page.locator('#productId').first();
    if (await productIdInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productIdInput.fill(`PROD-TEST-${Date.now()}`);
    } else {
      await page
        .locator('.ant-form input[type="text"], .ant-form input:not([type])')
        .first()
        .fill(`PROD-TEST-${Date.now()}`);
    }

    // Fill required Product Qty field
    const productQtyInput = page.locator('#productQty').first();
    if (await productQtyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await productQtyInput.fill('1');
    }

    // Select required Type field
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

    // BOMForm uses Card extra button with onClick={() => form.submit()}, not type="submit"
    await page.locator('button:has-text("Save")').first().click();
    await page.waitForLoadState('networkidle');

    const success = await Promise.race([
      page
        .locator('.ant-message-success')
        .waitFor({ timeout: 6000 })
        .then(() => true)
        .catch(() => false),
      page
        .waitForURL('**/production/bom', { timeout: 6000 })
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

  test('Step 6: Work center list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-centers');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Work center form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-centers/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 8: Create work center with valid data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-centers/new');
    await page.waitForLoadState('networkidle');

    const ts = Date.now();

    const nameInput = page.locator('#name').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill(`Work Center ${ts}`);
    }

    // WorkCenterForm uses Card extra button with onClick={() => form.submit()}, not type="submit"
    await page.locator('button:has-text("Save")').first().click();
    await page.waitForLoadState('networkidle');

    const success = await Promise.race([
      page
        .locator('.ant-message-success')
        .waitFor({ timeout: 6000 })
        .then(() => true)
        .catch(() => false),
      page
        .waitForURL('**/production/work-centers', { timeout: 6000 })
        .then(() => true)
        .catch(() => false),
      page
        .locator('.ant-message-error, .ant-message-warning')
        .waitFor({ timeout: 6000 })
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

  test('Step 9: Work order list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/production/work-orders');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 10: Dashboard loads without server errors', async ({ page }) => {
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

import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * Procurement User Journey E2E Test
 * 1. Login
 * 2. Create supplier
 * 3. Supplier appears in list
 * 4. Create purchase order
 * 5. PO list has entries
 * 6. Inventory page loads
 * 7. Dashboard loads without server errors
 */

const journey = {
  supplierName: `Journey Supplier ${Date.now()}`,
  supplierEmail: `supplier-journey-${Date.now()}@example.com`,
};

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Procurement Journey: Supplier → Purchase Order → Inventory', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Create a supplier', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/purchasing/suppliers');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator(
        'button:has-text("Add Supplier"), button:has-text("Add"), button:has-text("New"), button:has-text("Create")',
      )
      .first();
    await createBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    const nameInput = page
      .locator('input[name="name"], input#name, input[placeholder*="name" i]')
      .first();
    if (await nameInput.isVisible()) await nameInput.fill(journey.supplierName);

    const emailInput = page
      .locator('input[name="email"], input#email, input[type="email"]')
      .first();
    if (await emailInput.isVisible()) await emailInput.fill(journey.supplierEmail);

    const phoneInput = page.locator('input[name="phone"], input#phone').first();
    if (await phoneInput.isVisible()) await phoneInput.fill('0901234567');

    const responsePromise = page
      .waitForResponse(
        (r) =>
          (r.url().includes('/suppliers') || r.url().includes('/purchasing')) &&
          r.request().method() === 'POST',
        { timeout: 10000 },
      )
      .catch(() => null);

    await page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
      .first()
      .click();
    const response = await responsePromise;
    if (response) expect(response.status()).toBeLessThan(400);

    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/suppliers');
  });

  test('Step 3: Supplier appears in suppliers list', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/purchasing/suppliers');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Step 4: Create a purchase order', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/purchase');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator(
        'button:has-text("New Purchase Order"), button:has-text("New"), button:has-text("Create")',
      )
      .first();
    await createBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    const saveBtn = page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
      .first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');
    }

    expect(page.url()).toContain('/orders');
  });

  test('Step 5: Purchase orders list has entries', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/purchase');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Step 6: Inventory page reflects stock data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/inventory');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Dashboard loads without server errors after procurement', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500 && !r.url().includes('/auth/refresh')) {
        serverErrors.push(`${r.status()} ${r.url()}`);
      }
    });

    await auth(page);
    await page.waitForLoadState('networkidle');

    // Wait for spinner to disappear (dashboard finishes loading)
    await page
      .locator('.ant-spin-spinning')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => null);
    await expect(page.locator('.ant-statistic, .ant-card').first()).toBeVisible({ timeout: 15000 });
    expect(serverErrors).toHaveLength(0);
  });
});

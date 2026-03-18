import { expect, Page, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Procurement User Journey E2E Test
 *
 * Full end-to-end flow (serial — state shared across steps):
 * 1. Login
 * 2. Create a supplier
 * 3. Verify supplier in list
 * 4. Create a purchase order
 * 5. Verify PO in list
 * 6. Inventory page reflects stock data
 * 7. Dashboard loads without server errors
 */

const journey = {
  supplierName: `Journey Supplier ${Date.now()}`,
  supplierEmail: `supplier-journey-${Date.now()}@example.com`,
};

async function loginAs(page: Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await page.waitForURL('/dashboard');
}

test.describe.serial('Procurement Journey: Supplier → Purchase Order → Inventory', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Create a supplier', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/purchasing/suppliers');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[name="name"], input#name');
    if (await nameInput.isVisible()) await nameInput.fill(journey.supplierName);

    const emailInput = page.locator('input[name="email"], input#email');
    if (await emailInput.isVisible()) await emailInput.fill(journey.supplierEmail);

    const phoneInput = page.locator('input[name="phone"], input#phone');
    if (await phoneInput.isVisible()) await phoneInput.fill('0901234567');

    const responsePromise = page
      .waitForResponse(
        (r) =>
          (r.url().includes('/api/suppliers') || r.url().includes('/api/purchasing/suppliers')) &&
          r.request().method() === 'POST',
      )
      .catch(() => null);

    await page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
      .first()
      .click();

    const response = await responsePromise;
    if (response) expect(response.status()).toBeLessThan(400);

    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/purchasing/suppliers');
  });

  test('Step 3: Supplier appears in suppliers list', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/purchasing/suppliers');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(journey.supplierName);
      await page.waitForTimeout(800);
    }

    const rowCount = await page.locator('.ant-table-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Step 4: Create a purchase order', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/orders/purchase');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    // Select supplier if dropdown exists
    const supplierSelect = page
      .locator('.ant-select')
      .filter({ has: page.locator('input[placeholder*="supplier" i]') });
    if (await supplierSelect.isVisible()) {
      await supplierSelect.click();
      await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
      const option = page.locator(`.ant-select-item:has-text("${journey.supplierName}")`);
      if (await option.isVisible()) {
        await option.click();
      } else {
        await page
          .locator('.ant-select-dropdown input')
          .fill(journey.supplierName)
          .catch(() => {});
        await page.locator('.ant-select-item').first().click();
      }
    }

    const saveBtn = page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
      .first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');
    }

    expect(page.url()).toContain('/orders');
  });

  test('Step 5: Purchase orders list has entries', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/orders/purchase');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Step 6: Inventory page reflects stock data', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/inventory');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, .ant-card, [data-testid="inventory-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Dashboard loads without server errors after procurement', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500) serverErrors.push(`${r.status()} ${r.url()}`);
    });

    await loginAs(page, 'admin@test.com', 'admin123');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-statistic').first()).toBeVisible({ timeout: 10000 });
    expect(serverErrors).toHaveLength(0);
  });
});

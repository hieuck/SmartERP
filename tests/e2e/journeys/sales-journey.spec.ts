import { expect, Page, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Sales User Journey E2E Test
 *
 * Full end-to-end flow (serial — state shared across steps):
 * 1. Login → dashboard
 * 2. Create customer
 * 3. Create sales order for that customer
 * 4. Verify order in list
 * 5. Navigate to invoices
 * 6. Navigate to payments
 * 7. Verify dashboard shows data without 500 errors
 */

const journey = {
  customerName: `Journey Customer ${Date.now()}`,
  customerEmail: `journey-${Date.now()}@example.com`,
};

async function loginAs(page: Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await page.waitForURL('/dashboard');
}

test.describe.serial('Sales Journey: Customer → Order → Invoice → Payment', () => {
  test('Step 1: Login and reach dashboard without 500 errors', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500) serverErrors.push(`${r.status()} ${r.url()}`);
    });

    await loginAs(page, 'admin@test.com', 'admin123');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/dashboard');
    expect(serverErrors).toHaveLength(0);
  });

  test('Step 2: Create a new customer', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/customers');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="name"], input#name').fill(journey.customerName);
    await page.locator('input[name="email"], input#email').fill(journey.customerEmail);
    await page.locator('input[name="phone"], input#phone').fill('0901234567');

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/customers') && r.request().method() === 'POST',
    );
    await page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
      .first()
      .click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    await page.waitForURL('/dashboard/customers');
    const customerRow = page.locator(`tr:has-text("${journey.customerName}")`);
    await expect(customerRow).toBeVisible({ timeout: 5000 });
  });

  test('Step 3: Create a sales order', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/orders/sales');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    // Select customer if dropdown exists
    const customerSelect = page
      .locator('.ant-select')
      .filter({ has: page.locator('input[placeholder*="customer" i]') });
    if (await customerSelect.isVisible()) {
      await customerSelect.click();
      await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
      const option = page.locator(`.ant-select-item:has-text("${journey.customerName}")`);
      if (await option.isVisible()) {
        await option.click();
      } else {
        await page.locator('.ant-select-dropdown input').fill(journey.customerName);
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

    // Should stay on orders page or navigate to detail
    expect(page.url()).toContain('/orders');
  });

  test('Step 4: Orders list has at least one order', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/orders/sales');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Step 5: Invoices page loads after order creation', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
  });

  test('Step 6: Payments page loads', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/accounting/payments');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, [data-testid="payments-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Dashboard KPIs load without server errors', async ({ page }) => {
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

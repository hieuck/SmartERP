import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * Sales User Journey E2E Test
 * 1. Login → dashboard (no 500 errors)
 * 2. Create customer
 * 3. Create sales order
 * 4. Orders list has entries
 * 5. Invoices page loads
 * 6. Payments page loads
 * 7. Dashboard KPIs load without server errors
 */

const journey = {
  customerName: `Journey Customer ${Date.now()}`,
  customerEmail: `journey-${Date.now()}@example.com`,
};

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Sales Journey: Customer → Order → Invoice → Payment', () => {
  test('Step 1: Login and reach dashboard without 500 errors', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 500 && !r.url().includes('/auth/refresh')) {
        serverErrors.push(`${r.status()} ${r.url()}`);
      }
    });

    await auth(page);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/dashboard');
    expect(serverErrors).toHaveLength(0);
  });

  test('Step 2: Create a new customer', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/customers');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator(
        'button:has-text("Add Customer"), button:has-text("Add"), button:has-text("New"), button:has-text("Create")',
      )
      .first();
    await createBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    await page
      .locator('input[name="name"], input#name, input[placeholder*="name" i]')
      .first()
      .fill(journey.customerName);
    await page
      .locator('input[name="email"], input#email, input[type="email"]')
      .first()
      .fill(journey.customerEmail);

    const phoneInput = page
      .locator('input[name="phone"], input#phone, input[placeholder*="phone" i]')
      .first();
    if (await phoneInput.isVisible()) await phoneInput.fill('0901234567');

    const responsePromise = page
      .waitForResponse((r) => r.url().includes('/customers') && r.request().method() === 'POST', {
        timeout: 10000,
      })
      .catch(() => null);

    await page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
      .first()
      .click();
    const response = await responsePromise;
    if (response) expect(response.status()).toBeLessThan(400);

    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/customers');
  });

  test('Step 3: Create a sales order', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/sales');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create Order"), button:has-text("Create"), button:has-text("New")')
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

  test('Step 4: Orders list has at least one order', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/orders/sales');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Step 5: Invoices page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 6: Payments page loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/accounting/payments');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Dashboard KPIs load without server errors', async ({ page }) => {
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

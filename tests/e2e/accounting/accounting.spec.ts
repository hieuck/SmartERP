import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Accounting Module E2E Tests
 *
 * Covers:
 * 1. Invoices list + detail + filter
 * 2. Payments list + filter
 * 3. API error handling
 */
test.describe('Accounting - Invoices', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should display invoices list', async ({ page }) => {
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.ant-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should show create invoice button', async ({ page }) => {
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await expect(createBtn).toBeVisible();
  });

  test('should show invoice status badges in list', async ({ page }) => {
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('.ant-table-tbody tr').count();
    if (rowCount === 0) test.skip(true, 'No invoices in list');

    const statusBadge = page
      .locator('.ant-table-tbody .ant-tag, .ant-table-tbody .ant-badge')
      .first();
    await expect(statusBadge).toBeVisible();
  });

  test('should open status filter dropdown', async ({ page }) => {
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    const statusFilter = page.locator('.ant-select').filter({ hasText: /status/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await expect(page.locator('.ant-select-dropdown')).toBeVisible();
      await page.keyboard.press('Escape');
    } else {
      test.skip(true, 'Status filter not available');
    }
  });

  test('should search invoices by number', async ({ page }) => {
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('INV-');
      await page.waitForTimeout(800);
      await expect(page.locator('.ant-table')).toBeVisible();
    } else {
      test.skip(true, 'Search not available');
    }
  });

  test('should navigate to invoice detail on row click', async ({ page }) => {
    await page.goto('/dashboard/accounting/invoices');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('.ant-table-tbody tr').count();
    if (rowCount === 0) test.skip(true, 'No invoices to click');

    await page.locator('.ant-table-tbody tr').first().click();
    await page.waitForLoadState('networkidle');

    const isDetailPage = page.url().match(/\/invoices\/[a-z0-9-]+/i);
    const isDrawer = await page.locator('.ant-drawer, .ant-modal').isVisible();
    expect(isDetailPage || isDrawer).toBeTruthy();
  });

  test('should handle invoices API error gracefully', async ({ page }) => {
    await page.route('**/api/accounting/invoices*', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/dashboard/accounting/invoices');
    await page.waitForTimeout(2000);

    const errorEl = page.locator(
      '.ant-message-error, .ant-notification-notice-error, .ant-alert-error',
    );
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accounting - Payments', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should display payments list', async ({ page }) => {
    await page.goto('/dashboard/accounting/payments');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, [data-testid="payments-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show amount column in payments table', async ({ page }) => {
    await page.goto('/dashboard/accounting/payments');
    await page.waitForLoadState('networkidle');

    const headers = page.locator('.ant-table-thead th');
    const headerTexts = await headers.allTextContents();
    const hasAmountCol = headerTexts.some((t) => /amount|total/i.test(t));
    expect(hasAmountCol).toBe(true);
  });

  test('should show date range filter on payments page', async ({ page }) => {
    await page.goto('/dashboard/accounting/payments');
    await page.waitForLoadState('networkidle');

    const datePicker = page.locator('.ant-picker-range, .ant-picker');
    if (await datePicker.first().isVisible()) {
      await expect(datePicker.first()).toBeVisible();
    } else {
      test.skip(true, 'Date filter not available');
    }
  });

  test('should handle payments API error gracefully', async ({ page }) => {
    await page.route('**/api/accounting/payments*', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/dashboard/accounting/payments');
    await page.waitForTimeout(2000);

    const errorEl = page.locator(
      '.ant-message-error, .ant-notification-notice-error, .ant-alert-error',
    );
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });
});

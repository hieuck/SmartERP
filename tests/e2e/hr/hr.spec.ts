import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * HR Module E2E Tests
 *
 * Covers:
 * 1. Employees list + CRUD
 * 2. Attendance page
 * 3. Leave requests
 * 4. Payroll page
 */
test.describe('HR - Employees', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should display employees list', async ({ page }) => {
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.ant-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should show create employee button', async ({ page }) => {
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await expect(createBtn).toBeVisible();
  });

  test('should show employee form on create click', async ({ page }) => {
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    const form = page.locator('form, .ant-modal, .ant-drawer');
    await expect(form.first()).toBeVisible({ timeout: 5000 });
  });

  test('should search employees by name', async ({ page }) => {
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(800);
      await expect(page.locator('.ant-table')).toBeVisible();
    } else {
      test.skip(true, 'Search not available');
    }
  });

  test('should navigate to employee detail on row click', async ({ page }) => {
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('.ant-table-tbody tr').count();
    if (rowCount === 0) test.skip(true, 'No employees to click');

    await page.locator('.ant-table-tbody tr').first().click();
    await page.waitForLoadState('networkidle');

    const isDetailPage = page.url().match(/\/employees\/[a-z0-9-]+/i);
    const isDrawer = await page.locator('.ant-drawer, .ant-modal').isVisible();
    expect(isDetailPage || isDrawer).toBeTruthy();
  });

  test('should handle employees API error gracefully', async ({ page }) => {
    await page.route('**/api/hr/employees*', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/dashboard/hr/employees');
    await page.waitForTimeout(2000);

    const errorEl = page.locator(
      '.ant-message-error, .ant-notification-notice-error, .ant-alert-error',
    );
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });
});

test.describe('HR - Attendance', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should display attendance page', async ({ page }) => {
    await page.goto('/dashboard/hr/attendance');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, .ant-calendar, [data-testid="attendance-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show date filter on attendance page', async ({ page }) => {
    await page.goto('/dashboard/hr/attendance');
    await page.waitForLoadState('networkidle');

    const datePicker = page.locator('.ant-picker');
    await expect(datePicker.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('HR - Leave Requests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should display leave requests page', async ({ page }) => {
    await page.goto('/dashboard/hr/leave');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, [data-testid="leave-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show create leave request button', async ({ page }) => {
    await page.goto('/dashboard/hr/leave');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")')
      .first();
    await expect(createBtn).toBeVisible();
  });

  test('should open status filter dropdown', async ({ page }) => {
    await page.goto('/dashboard/hr/leave');
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
});

test.describe('HR - Payroll', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should display payroll page', async ({ page }) => {
    await page.goto('/dashboard/hr/payroll');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, .ant-card, [data-testid="payroll-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show period selector on payroll page', async ({ page }) => {
    await page.goto('/dashboard/hr/payroll');
    await page.waitForLoadState('networkidle');

    const periodSelector = page.locator('.ant-picker, .ant-select').first();
    await expect(periodSelector).toBeVisible({ timeout: 5000 });
  });
});

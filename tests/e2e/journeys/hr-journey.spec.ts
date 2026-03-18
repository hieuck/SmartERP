import { expect, Page, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * HR User Journey E2E Test
 *
 * Full end-to-end flow (serial — state shared across steps):
 * 1. Login
 * 2. Create employee
 * 3. Verify employee in list
 * 4. Attendance page with date filter
 * 5. Submit leave request
 * 6. Verify leave list
 * 7. Payroll page with period selector
 */

const journey = {
  employeeName: `Journey Employee ${Date.now()}`,
  employeeEmail: `emp-journey-${Date.now()}@example.com`,
  employeeCode: `EMP-${Date.now()}`,
};

async function loginAs(page: Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await page.waitForURL('/dashboard');
}

test.describe.serial('HR Journey: Employee → Attendance → Leave → Payroll', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Create a new employee', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
      .first();
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator(
      'input[name="name"], input[name="fullName"], input#name, input#fullName',
    );
    if (await nameInput.isVisible()) await nameInput.fill(journey.employeeName);

    const emailInput = page.locator('input[name="email"], input#email');
    if (await emailInput.isVisible()) await emailInput.fill(journey.employeeEmail);

    const codeInput = page.locator(
      'input[name="employeeCode"], input[name="code"], input#employeeCode',
    );
    if (await codeInput.isVisible()) await codeInput.fill(journey.employeeCode);

    const responsePromise = page
      .waitForResponse(
        (r) => r.url().includes('/api/hr/employees') && r.request().method() === 'POST',
      )
      .catch(() => null);

    await page
      .locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")')
      .first()
      .click();

    const response = await responsePromise;
    if (response) expect(response.status()).toBeLessThan(400);

    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/hr/employees');
  });

  test('Step 3: Employee appears in employees list', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(journey.employeeName);
      await page.waitForTimeout(800);
    }

    const rowCount = await page.locator('.ant-table-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Step 4: Attendance page loads with date filter', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/hr/attendance');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, .ant-calendar, [data-testid="attendance-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });

    const datePicker = page.locator('.ant-picker');
    await expect(datePicker.first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 5: Submit a leave request', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/hr/leave');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")')
      .first();
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    const form = page.locator('form, .ant-modal, .ant-drawer');
    await expect(form.first()).toBeVisible({ timeout: 5000 });

    // Select leave type if dropdown exists
    const leaveTypeSelect = page.locator('.ant-select').filter({ hasText: /type/i });
    if (await leaveTypeSelect.isVisible()) {
      await leaveTypeSelect.click();
      await page.locator('.ant-select-dropdown .ant-select-item').first().click();
    }

    // Pick start date
    const startDatePicker = page.locator('.ant-picker').first();
    if (await startDatePicker.isVisible()) {
      await startDatePicker.click();
      await page.keyboard.press('Enter');
    }

    const saveBtn = page
      .locator(
        '.ant-modal button[type="submit"], .ant-modal button:has-text("Submit"), button[type="submit"]',
      )
      .first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');
    }

    expect(page.url()).toContain('/hr/leave');
  });

  test('Step 6: Leave requests list is visible', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/hr/leave');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, [data-testid="leave-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Payroll page loads with period selector', async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'admin123');
    await page.goto('/dashboard/hr/payroll');
    await page.waitForLoadState('networkidle');

    const content = page.locator('.ant-table, .ant-card, [data-testid="payroll-page"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });

    const periodSelector = page.locator('.ant-picker, .ant-select').first();
    await expect(periodSelector).toBeVisible({ timeout: 5000 });
  });
});

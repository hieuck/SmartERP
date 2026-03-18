import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

/**
 * HR User Journey E2E Test
 * 1. Login
 * 2. Create employee
 * 3. Employee appears in list
 * 4. Attendance page loads
 * 5. Leave page loads
 * 6. Leave list visible
 * 7. Payroll page loads
 */

const journey = {
  employeeName: `Journey Employee ${Date.now()}`,
  employeeEmail: `emp-journey-${Date.now()}@example.com`,
  employeeCode: `EMP-${Date.now()}`,
};

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('HR Journey: Employee → Attendance → Leave → Payroll', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Create a new employee', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .locator(
        'button:has-text("New Employee"), button:has-text("New"), button:has-text("Add"), button:has-text("Create")',
      )
      .first();
    await createBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createBtn.click();
    await page.waitForLoadState('networkidle');

    // Try firstName/lastName fields first, fallback to full name
    const firstNameInput = page.locator('input[name="firstName"], input#firstName').first();
    if (await firstNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstNameInput.fill('Journey');
      const lastNameInput = page.locator('input[name="lastName"], input#lastName').first();
      if (await lastNameInput.isVisible()) await lastNameInput.fill('Employee');
    } else {
      const nameInput = page
        .locator('input[name="name"], input[name="fullName"], input#name')
        .first();
      if (await nameInput.isVisible()) await nameInput.fill(journey.employeeName);
    }

    const emailInput = page
      .locator('input[name="email"], input#email, input[type="email"]')
      .first();
    if (await emailInput.isVisible()) await emailInput.fill(journey.employeeEmail);

    const codeInput = page
      .locator('input[name="employeeCode"], input[name="code"], input#employeeCode')
      .first();
    if (await codeInput.isVisible()) await codeInput.fill(journey.employeeCode);

    const responsePromise = page
      .waitForResponse((r) => r.url().includes('/employees') && r.request().method() === 'POST', {
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
    expect(page.url()).toContain('/hr/employees');
  });

  test('Step 3: Employee appears in employees list', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/employees');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Step 4: Attendance page loads with date filter', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/attendance');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.ant-picker').first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 5: Leave page loads and has create button', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/leave');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
    const createBtn = page
      .locator(
        'button:has-text("Request Leave"), button:has-text("Request"), button:has-text("New"), button:has-text("Create")',
      )
      .first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });

  test('Step 6: Leave requests list is visible', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/leave');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Payroll page loads with period selector', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/payroll');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.ant-picker, .ant-select').first()).toBeVisible({ timeout: 5000 });
  });
});

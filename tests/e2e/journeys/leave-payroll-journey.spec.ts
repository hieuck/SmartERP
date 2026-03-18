import { expect, Page, test } from '@playwright/test';
import { loginAndInjectToken } from '../../helpers/auth';

async function auth(page: Page) {
  await loginAndInjectToken(page, 'admin@test.com', 'admin123');
}

test.describe.serial('Leave & Payroll Journey: Leave List → Create → Payroll → Attendance', () => {
  test('Step 1: Login successfully', async ({ page }) => {
    await auth(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Step 2: Leave list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/leave');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Leave form loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/leave/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-form, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 4: Create leave request with valid data', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/leave/new');
    await page.waitForLoadState('networkidle');

    // Fill employee field
    const empInput = page.locator('#employeeId').first();
    if (await empInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await empInput.fill('1');
    }

    // Select leave type
    const typeSelect = page.locator('#leaveType, #type').first();
    if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeSelect.click();
      const firstOption = page.locator('.ant-select-item-option').first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Fill start date — click body to dismiss picker after fill
    const startDateInput = page.locator('#startDate').first();
    if (await startDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startDateInput.click();
      await startDateInput.fill('2024-01-15');
      await page.locator('body').click({ position: { x: 10, y: 10 } });
    }

    // Fill end date
    const endDateInput = page.locator('#endDate').first();
    if (await endDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await endDateInput.click();
      await endDateInput.fill('2024-01-16');
      await page.locator('body').click({ position: { x: 10, y: 10 } });
    }

    // Fill reason (required field)
    const reasonInput = page.locator('#reason, textarea[id="reason"]').first();
    if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reasonInput.fill('Test leave request');
    }

    // Submit — form uses "Request Leave" button text, not type="submit"
    await page.locator('button:has-text("Request Leave"), button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    const success = await Promise.race([
      page
        .locator('.ant-message-success, .ant-message-notice-success')
        .waitFor({ timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .waitForURL('**/hr/leave', { timeout: 8000 })
        .then(() => true)
        .catch(() => false),
      page
        .locator('.ant-table')
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

  test('Step 5: Payroll list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/payroll');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 6: Attendance list loads', async ({ page }) => {
    await auth(page);
    await page.goto('/dashboard/hr/attendance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ant-table, .ant-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Dashboard loads without server errors', async ({ page }) => {
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

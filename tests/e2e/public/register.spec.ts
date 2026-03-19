import { expect, Page, test } from '@playwright/test';

const registerPayload = {
  user: {
    id: 'user-2',
    email: 'owner@example.com',
    firstName: 'Owner',
    lastName: 'Admin',
    tenantId: 'tenant-2',
    role: 'admin',
  },
  token: 'register-token',
  refreshToken: 'register-refresh-token',
};

async function mockDashboardApis(page: Page) {
  await page.route('**/api/dashboard/overview', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          revenue: { today: 0, thisWeek: 0, thisMonth: 0, growth: 0 },
          orders: { total: 0, pending: 0, completed: 0, cancelled: 0 },
          inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
          customers: { total: 0, active: 0, new: 0 },
          payments: { pending: 0, completed: 0, totalAmount: 0 },
        },
      }),
    });
  });

  for (const endpoint of [
    '**/api/dashboard/sales-chart**',
    '**/api/dashboard/top-products**',
    '**/api/dashboard/top-customers**',
    '**/api/dashboard/revenue-by-category**',
  ]) {
    await page.route(endpoint, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });
  }
}

async function fillRegisterForm(page: Page) {
  await page.getByLabel(/company slug|mã công ty/i).fill('smart-erp-demo');
  await page.getByLabel(/company name|tên công ty/i).fill('Smart ERP Demo');
  await page.getByLabel(/first name|tên/i).fill('Owner');
  await page.getByLabel(/^email$/i).fill(registerPayload.user.email);
  await page.getByLabel(/phone number|số điện thoại/i).fill('0912345678');
  await page.getByLabel(/^password$/i).fill('StrongPass1');
  await page.getByLabel(/confirm password|xác nhận mật khẩu/i).fill('StrongPass1');
}

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('renders the registration form with company and account fields', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(page.getByLabel(/company name|tên công ty/i)).toBeVisible();
    await expect(page.getByLabel(/company slug|mã công ty/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.getByLabel(/confirm password|xÃ¡c nháº­n máº­t kháº©u/i)).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    await expect(page.getByRole('button', { name: /register|đăng ký/i })).toBeVisible();
  });

  test('auto-generates a normalized slug from company name', async ({ page }) => {
    const companyNameInput = page.getByLabel(/company name|tên công ty/i);
    const slugInput = page.getByLabel(/company slug|mã công ty/i);

    await companyNameInput.fill('Công ty Đặng Khoa');

    await expect(slugInput).toHaveValue('cong-ty-dang-khoa');
  });

  test('requires users to accept terms before registration', async ({ page }) => {
    await fillRegisterForm(page);
    await page.getByRole('button', { name: /register|đăng ký/i }).click();

    await expect(page.locator('.ant-form-item-explain-error').filter({ hasText: /terms|đồng ý/i })).toBeVisible();
  });

  test('shows validation error when password confirmation does not match', async ({ page }) => {
    await fillRegisterForm(page);
    await page.getByLabel(/confirm password|xác nhận mật khẩu/i).fill('WrongPass1');
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /register|đăng ký/i }).click();

    await expect(page.locator('.ant-form-item-explain-error').filter({ hasText: /do not match|không khớp/i })).toBeVisible();
  });

  test('submits successfully and redirects to dashboard when API succeeds', async ({ page }) => {
    await mockDashboardApis(page);

    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: registerPayload }),
      });
    });

    await fillRegisterForm(page);
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /register|đăng ký/i }).click();

    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows API error message when registration fails', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email already exists' }),
      });
    });

    await fillRegisterForm(page);
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /register|đăng ký/i }).click();

    await expect(page.locator('.ant-message, .ant-notification')).toContainText(/email already exists/i);
  });
});

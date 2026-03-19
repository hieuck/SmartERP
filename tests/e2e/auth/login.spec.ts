import { expect, Page, test } from '@playwright/test';
import { DashboardPage } from '../../pages/DashboardPage';
import { LoginPage } from '../../pages/LoginPage';

const mockUser = {
  id: 'user-1',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  tenantId: 'tenant-1',
  role: 'admin',
};

async function mockDashboardApis(page: Page) {
  await page.route('**/api/dashboard/overview', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          revenue: { today: 1200000, thisWeek: 5000000, thisMonth: 20000000, growth: 12.5 },
          orders: { total: 42, pending: 5, completed: 35, cancelled: 2 },
          inventory: { totalProducts: 99, lowStock: 3, outOfStock: 1, totalValue: 8800000 },
          customers: { total: 15, active: 12, new: 2 },
          payments: { pending: 4, completed: 18, totalAmount: 21000000 },
        },
      }),
    });
  });

  for (const [endpoint, data] of [
    ['**/api/dashboard/sales-chart**', [{ date: '2026-03-01', revenue: 1000000, orders: 3 }]],
    ['**/api/dashboard/top-products**', [{ id: 'p-1', name: 'Product A', revenue: 2000000, quantity: 10 }]],
    ['**/api/dashboard/top-customers**', [{ id: 'c-1', name: 'Customer A', totalSpent: 3500000, orderCount: 4 }]],
    ['**/api/dashboard/revenue-by-category**', [{ category: 'Main', revenue: 3500000, percentage: 100 }]],
  ] as const) {
    await page.route(endpoint, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data }),
      });
    });
  }
}

async function mockSuccessfulLogin(page: Page, delayMs = 0) {
  await mockDashboardApis(page);
  await page.route('**/api/auth/login', async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          token: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: mockUser,
        },
      }),
    });
  });
}

/**
 * Authentication Flow E2E Tests
 *
 * Uses mocked API responses so login behavior is tested independently from backend availability.
 */
test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('should display login page correctly', async () => {
    const title = await loginPage.getPageTitle();
    expect(title).toContain('Login');

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await mockSuccessfulLogin(page);

    await loginPage.login(mockUser.email, 'admin123');

    await page.waitForURL('**/dashboard');
    expect(await dashboardPage.isOnDashboardPage()).toBe(true);
    expect(await dashboardPage.getPageTitle()).toContain('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      });
    });

    await loginPage.login(mockUser.email, 'wrongpassword');

    expect(await loginPage.hasError()).toBe(true);
    await expect(loginPage.errorMessage).toContainText(/invalid email or password/i);
    expect(await loginPage.isOnLoginPage()).toBe(true);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('password123');
    await loginPage.submitButton.click();

    const emailError = page.locator('.ant-form-item-explain-error').first();
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText(/email/i);
  });

  test('should show error for missing password', async ({ page }) => {
    await loginPage.emailInput.fill(mockUser.email);
    await loginPage.submitButton.click();

    const passwordError = page.locator('.ant-form-item-explain-error');
    await expect(passwordError).toContainText(/password/i);
  });

  test('should show error for short password', async ({ page }) => {
    await loginPage.emailInput.fill(mockUser.email);
    await loginPage.passwordInput.fill('1234567');
    await loginPage.submitButton.click();

    const passwordError = page
      .locator('.ant-form-item-explain-error')
      .filter({ hasText: /at least 8|ít nhất 8/i });
    await expect(passwordError).toBeVisible();
  });

  test('should disable submit button while loading', async ({ page }) => {
    await mockSuccessfulLogin(page, 1200);

    await loginPage.emailInput.fill(mockUser.email);
    await loginPage.passwordInput.fill('admin123');

    const submitPromise = loginPage.submitButton.click();
    await expect(loginPage.submitButton).toBeDisabled();
    await submitPromise;
  });

  test('should remember email when remember me is checked', async ({ page }) => {
    await mockSuccessfulLogin(page);

    await loginPage.login(mockUser.email, 'admin123', true);
    await page.waitForURL('**/dashboard');

    const rememberedEmail = await page.evaluate(() => localStorage.getItem('rememberedEmail'));
    expect(rememberedEmail).toBe(mockUser.email);
  });

  test('should not remember email when remember me is unchecked', async ({ page }) => {
    await mockSuccessfulLogin(page);

    await page.evaluate(() => localStorage.setItem('rememberedEmail', 'old@example.com'));
    await loginPage.goto();
    await loginPage.login(mockUser.email, 'admin123', false);
    await page.waitForURL('**/dashboard');

    const rememberedEmail = await page.evaluate(() => localStorage.getItem('rememberedEmail'));
    expect(rememberedEmail).toBeNull();
  });

  test('should logout successfully', async ({ page }) => {
    await mockSuccessfulLogin(page);

    await loginPage.login(mockUser.email, 'admin123');
    await page.waitForURL('**/dashboard');

    await page.locator('header').getByText('Admin User').click();
    await page.getByText(/logout/i).click();

    await page.waitForURL('**/login');
    expect(await loginPage.isOnLoginPage()).toBe(true);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    expect(await loginPage.isOnLoginPage()).toBe(true);
  });

  test('should handle network error gracefully', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.abort('failed');
    });

    await loginPage.emailInput.fill(mockUser.email);
    await loginPage.passwordInput.fill('admin123');
    await loginPage.submitButton.click();

    await loginPage.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    expect(await loginPage.hasError()).toBe(true);
    await expect(loginPage.errorMessage).toContainText(/network error/i);
  });
});

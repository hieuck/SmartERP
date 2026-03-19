import { expect, Page, test } from '@playwright/test';
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

  await page.route('**/api/dashboard/sales-chart**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { date: '2026-03-01', revenue: 1000000, orders: 3 },
          { date: '2026-03-02', revenue: 1500000, orders: 5 },
        ],
      }),
    });
  });

  await page.route('**/api/dashboard/top-products**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{ id: 'p-1', name: 'Product A', revenue: 2000000, quantity: 10 }],
      }),
    });
  });

  await page.route('**/api/dashboard/top-customers**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{ id: 'c-1', name: 'Customer A', totalSpent: 3500000, orderCount: 4 }],
      }),
    });
  });

  await page.route('**/api/dashboard/revenue-by-category**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{ category: 'Main', revenue: 3500000, percentage: 100 }],
      }),
    });
  });
}

test.describe('Mocked Authentication Flow', () => {
  test('logs in successfully with mocked API and redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await mockDashboardApis(page);

    await page.route('**/api/auth/login', async (route) => {
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

    await loginPage.goto();
    await loginPage.login(mockUser.email, 'admin123');

    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('stores remembered email after successful login when remember me is checked', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await mockDashboardApis(page);

    await page.route('**/api/auth/login', async (route) => {
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

    await loginPage.goto();
    await loginPage.login(mockUser.email, 'admin123', true);
    await page.waitForURL('**/dashboard');

    const rememberedEmail = await page.evaluate(() => localStorage.getItem('rememberedEmail'));
    expect(rememberedEmail).toBe(mockUser.email);
  });

  test('sanitizes email before sending login request', async ({ page }) => {
    const loginPage = new LoginPage(page);
    let requestPayload: Record<string, string> | null = null;

    await page.route('**/api/auth/login', async (route) => {
      requestPayload = route.request().postDataJSON() as Record<string, string>;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      });
    });

    await loginPage.goto();
    await loginPage.login('  ADMIN@TEST.COM  ', 'wrongpass');

    expect(requestPayload).toEqual({
      email: 'admin@test.com',
      password: 'wrongpass',
    });
  });

  test('shows server error alert for invalid credentials returned by API', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      });
    });

    await loginPage.goto();
    await loginPage.login(mockUser.email, 'wrongpass');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/invalid email or password/i);
  });

  test('locks the form after repeated failed attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      });
    });

    await loginPage.goto();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await loginPage.login(mockUser.email, 'wrongpass');
    }

    await expect(loginPage.submitButton).toBeDisabled();
    await expect(page.locator('.ant-alert-warning')).toBeVisible();
  });
});

import { expect, Page, test } from '@playwright/test';
import { DashboardPage } from '../../pages/DashboardPage';

const mockUser = {
  id: 'user-1',
  username: 'admin@test.com',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
};

async function injectAuthenticatedSession(page: Page) {
  await page.addInitScript(
    ({ token, user }) => {
      sessionStorage.setItem('e2e_access_token', token);
      sessionStorage.setItem('e2e_user', JSON.stringify(user));
    },
    { token: 'dashboard-access-token', user: mockUser },
  );
}

async function mockDashboardApis(page: Page, overrides?: { overviewStatus?: number }) {
  await page.route('**/api/dashboard/overview', async (route) => {
    const status = overrides?.overviewStatus ?? 200;
    if (status >= 500) {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      });
      return;
    }

    await route.fulfill({
      status,
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

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await injectAuthenticatedSession(page);
    await mockDashboardApis(page);
    await dashboardPage.goto();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display dashboard page after restoring session', async ({ page }) => {
    expect(await dashboardPage.isOnDashboardPage()).toBe(true);
    await expect(page.locator('h1')).toContainText(/dashboard/i);
  });

  test('should show KPI statistic cards', async ({ page }) => {
    const stats = page.locator('.ant-statistic');
    await expect(stats.first()).toBeVisible();
    await expect(stats).toHaveCount(8);
  });

  test('should show numeric values in KPI cards', async ({ page }) => {
    const statValues = page.locator('.ant-statistic-content-value');
    await expect(statValues.first()).toBeVisible();
    await expect(statValues.first()).not.toHaveText('');
  });

  test('should render dashboard charts and table', async ({ page }) => {
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('should display authenticated user name in header', async ({ page }) => {
    await expect(page.locator('header')).toContainText('Admin User');
  });

  test('should navigate to products from sidebar', async ({ page }) => {
    await page.locator('.ant-layout-sider').getByText('Products', { exact: true }).click();
    await page.waitForURL('**/dashboard/products');
    expect(page.url()).toContain('/dashboard/products');
  });

  test('should navigate to sales orders from sidebar', async ({ page }) => {
    const sidebar = page.locator('.ant-layout-sider');
    await sidebar.getByText('Orders', { exact: true }).click();
    await page.getByRole('menuitem', { name: 'Sales Orders' }).click();
    await page.waitForURL('**/dashboard/orders/sales');
    expect(page.url()).toContain('/dashboard/orders/sales');
  });

  test('should not return 500 errors on successful dashboard load', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 500) {
        serverErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    expect(serverErrors).toHaveLength(0);
  });

  test('should handle dashboard API error gracefully without crashing', async ({ page }) => {
    await page.unroute('**/api/dashboard/overview');
    await page.route('**/api/dashboard/overview', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      });
    });

    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display sidebar navigation and layout header', async ({ page }) => {
    await expect(page.locator('.ant-layout-sider')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    const freshPage = await page.context().newPage();

    await freshPage.goto('/dashboard');
    await freshPage.waitForURL('**/login');
    expect(freshPage.url()).toContain('/login');

    await freshPage.close();
  });
});

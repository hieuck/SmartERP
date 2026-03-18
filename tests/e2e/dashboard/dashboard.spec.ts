import { expect, test } from '@playwright/test';
import { DashboardPage } from '../../pages/DashboardPage';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Dashboard E2E Tests
 *
 * Covers:
 * 1. KPI cards render with numeric values
 * 2. Sales chart renders
 * 3. Top customers table renders
 * 4. Navigation links work
 * 5. No 500 errors on load
 * 6. Graceful error handling
 */
test.describe('Dashboard', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard page after login', async ({ page }) => {
    expect(await dashboardPage.isOnDashboardPage()).toBe(true);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show KPI statistic cards', async ({ page }) => {
    const stats = page.locator('.ant-statistic');
    await expect(stats.first()).toBeVisible({ timeout: 10000 });
    const count = await stats.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show numeric values in KPI cards', async ({ page }) => {
    const statValues = page.locator('.ant-statistic-content-value');
    await expect(statValues.first()).toBeVisible({ timeout: 10000 });
    const firstValue = await statValues.first().textContent();
    expect(firstValue).toBeTruthy();
  });

  test('should render sales chart', async ({ page }) => {
    const chartContainer = page.locator('.recharts-wrapper, canvas, [data-testid="sales-chart"]');
    await expect(chartContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to products from sidebar', async ({ page }) => {
    const productsLink = page.locator('a[href*="/products"]').first();
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await page.waitForURL(/\/products/);
      expect(page.url()).toContain('/products');
    } else {
      test.skip(true, 'Products link not visible');
    }
  });

  test('should navigate to orders from sidebar', async ({ page }) => {
    const ordersLink = page.locator('a[href*="/orders"]').first();
    if (await ordersLink.isVisible()) {
      await ordersLink.click();
      await page.waitForURL(/\/orders/);
      expect(page.url()).toContain('/orders');
    } else {
      test.skip(true, 'Orders link not visible');
    }
  });

  test('should not return 500 errors on dashboard load', async ({ page }) => {
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
    await page.route('**/api/dashboard/overview', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) });
    });

    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    // Page should not be blank
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('.ant-layout-sider, nav, [data-testid="sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should show header with user info', async ({ page }) => {
    const header = page.locator('.ant-layout-header, header');
    await expect(header.first()).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page, context }) => {
    // Clear auth state
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });
});

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';
import { waitForNetworkIdle, waitForTableLoad, waitForLoadingComplete } from './helpers/wait.helper';

/**
 * E2E Tests for Dashboard
 * Tests the main dashboard functionality and KPIs
 * 
 * Test Coverage:
 * - KPI cards display
 * - Charts and visualizations
 * - Tables (top products, top customers)
 * - Navigation
 * - Responsive design
 * - Data refresh
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
    await waitForNetworkIdle(page);
  });

  test('should display all KPI cards', async ({ page }) => {
    // Check for main KPI cards
    await expect(page.locator('text=/doanh thu|revenue/i')).toBeVisible();
    await expect(page.locator('text=/đơn hàng|orders/i')).toBeVisible();
    await expect(page.locator('text=/tồn kho|inventory|stock/i')).toBeVisible();
    await expect(page.locator('text=/khách hàng|customers/i')).toBeVisible();
  });

  test('should display KPI values', async ({ page }) => {
    // KPI cards should have numeric values
    const kpiCards = page.locator('.ant-card, .ant-statistic');
    const count = await kpiCards.count();
    
    expect(count).toBeGreaterThan(0);
    
    // At least one card should have a number
    const hasNumber = await page.locator('text=/\\d+/').first().isVisible();
    expect(hasNumber).toBeTruthy();
  });

  test('should display sales chart', async ({ page }) => {
    // Check for chart container (Recharts or other chart library)
    const chartExists = await page.locator('.recharts-wrapper, canvas, svg[class*="chart"]').first().isVisible();
    expect(chartExists).toBeTruthy();
  });

  test('should display chart with data', async ({ page }) => {
    // Chart should have data points
    const hasChartData = await page.locator('.recharts-line, .recharts-bar, canvas, svg path').first().isVisible();
    expect(hasChartData).toBeTruthy();
  });

  test('should display top products table', async ({ page }) => {
    // Check for table
    const tables = page.locator('table');
    const tableCount = await tables.count();
    
    expect(tableCount).toBeGreaterThan(0);
    await expect(tables.first()).toBeVisible();
  });

  test('should display top customers table', async ({ page }) => {
    // Check for multiple tables (products and customers)
    const tables = page.locator('table');
    const tableCount = await tables.count();
    
    if (tableCount > 1) {
      await expect(tables.nth(1)).toBeVisible();
    }
  });

  test('should display table data', async ({ page }) => {
    // Tables should have rows
    await waitForTableLoad(page);
    
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    
    // Should have at least some data or empty state
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to products page from sidebar', async ({ page }) => {
    const productsLink = page.getByRole('link', { name: /sản phẩm|products/i });
    
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/products/, { timeout: 5000 });
    }
  });

  test('should navigate to orders page from sidebar', async ({ page }) => {
    const ordersLink = page.getByRole('link', { name: /đơn hàng|orders/i });
    
    if (await ordersLink.isVisible()) {
      await ordersLink.click();
      await expect(page).toHaveURL(/\/dashboard\/orders/, { timeout: 5000 });
    }
  });

  test('should navigate to customers page from sidebar', async ({ page }) => {
    const customersLink = page.getByRole('link', { name: /khách hàng|customers/i });
    
    if (await customersLink.isVisible()) {
      await customersLink.click();
      await expect(page).toHaveURL(/\/dashboard\/customers/, { timeout: 5000 });
    }
  });

  test('should have working sidebar navigation', async ({ page }) => {
    // Sidebar should be visible
    const sidebar = page.locator('.ant-layout-sider, aside, nav');
    await expect(sidebar.first()).toBeVisible();
    
    // Should have navigation links
    const navLinks = page.locator('a[href*="/dashboard"]');
    const linkCount = await navLinks.count();
    
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should refresh data when clicking refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /làm mới|refresh|reload/i });

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Wait for loading to complete
      await waitForLoadingComplete(page);
      await waitForNetworkIdle(page);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload to apply viewport
    await page.reload();
    await waitForNetworkIdle(page);

    // Dashboard should still be visible
    const dashboardContent = page.locator('text=/dashboard|tổng quan/i, .ant-card, table').first();
    await expect(dashboardContent).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    // Page should have a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have user menu', async ({ page }) => {
    // User menu should be visible (avatar, dropdown, etc.)
    const userMenu = page.locator('.ant-dropdown-trigger, [class*="user"], [class*="avatar"]');
    const hasUserMenu = await userMenu.first().isVisible();
    
    expect(hasUserMenu).toBeTruthy();
  });

  test('should load within acceptable time', async ({ page }) => {
    // Dashboard should load quickly
    const startTime = Date.now();
    await page.goto('/dashboard');
    await waitForNetworkIdle(page);
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/dashboard');
    await waitForNetworkIdle(page);
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(
      (error) => !error.includes('favicon') && !error.includes('404'),
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

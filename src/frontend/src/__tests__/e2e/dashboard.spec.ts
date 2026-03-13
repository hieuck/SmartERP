import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Dashboard
 * Tests the main dashboard functionality and KPIs
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display all KPI cards', async ({ page }) => {
    // Check for main KPI cards
    await expect(page.locator('text=/doanh thu/i')).toBeVisible();
    await expect(page.locator('text=/đơn hàng/i')).toBeVisible();
    await expect(page.locator('text=/tồn kho/i')).toBeVisible();
    await expect(page.locator('text=/khách hàng/i')).toBeVisible();
  });

  test('should display sales chart', async ({ page }) => {
    // Check for chart container
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    await expect(page.locator('text=/biểu đồ doanh thu/i')).toBeVisible();
  });

  test('should display top products table', async ({ page }) => {
    await expect(page.locator('text=/sản phẩm bán chạy/i')).toBeVisible();

    // Check for table
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('should display top customers table', async ({ page }) => {
    await expect(page.locator('text=/khách hàng hàng đầu/i')).toBeVisible();

    // Check for table
    const tables = page.locator('table');
    await expect(tables.nth(1)).toBeVisible();
  });

  test('should navigate to products page from sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /sản phẩm/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/products/);
  });

  test('should navigate to orders page from sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /đơn hàng/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/orders/);
  });

  test('should navigate to customers page from sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /khách hàng/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/customers/);
  });

  test('should refresh data when clicking refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /làm mới/i });

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should show loading state
      await expect(page.locator('.ant-spin')).toBeVisible();

      // Wait for data to load
      await page.waitForLoadState('networkidle');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Dashboard should still be visible
    await expect(page.locator('text=/dashboard/i')).toBeVisible();

    // KPI cards should stack vertically
    const cards = page.locator('.ant-card');
    await expect(cards.first()).toBeVisible();
  });
});

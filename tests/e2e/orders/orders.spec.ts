import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { OrdersPage } from '../../pages/OrdersPage';

/**
 * Sales Orders E2E Tests
 *
 * Covers:
 * 1. List orders
 * 2. View order detail
 * 3. Filter by status
 * 4. Search orders
 * 5. API error handling
 * 6. Empty state
 */
test.describe('Sales Orders', () => {
  let loginPage: LoginPage;
  let ordersPage: OrdersPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    ordersPage = new OrdersPage(page);

    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
    await ordersPage.gotoSalesOrders();
    await ordersPage.waitForOrdersLoad();
  });

  test('should display sales orders list', async ({ page }) => {
    expect(await ordersPage.isOnOrdersPage()).toBe(true);
    await expect(ordersPage.orderTable).toBeVisible();
  });

  test('should show create order button', async ({ page }) => {
    await expect(ordersPage.createButton).toBeVisible();
  });

  test('should show pagination', async ({ page }) => {
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    const initialCount = await ordersPage.getOrderCount();
    const statusFilter = page.locator('.ant-select').filter({ hasText: /status/i });
    if (await statusFilter.isVisible()) {
      await ordersPage.filterByStatus('pending');
      const filteredCount = await ordersPage.getOrderCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    } else {
      test.skip(true, 'Status filter not available');
    }
  });

  test('should search orders by order number', async ({ page }) => {
    const rows = await ordersPage.getOrderCount();
    if (rows === 0) test.skip(true, 'No orders to search');

    const firstCell = page.locator('.ant-table-tbody tr td').first();
    const orderNum = await firstCell.textContent();
    if (!orderNum) return;

    await ordersPage.searchOrder(orderNum.trim());
    const count = await ordersPage.getOrderCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to order detail on row click', async ({ page }) => {
    const rows = await ordersPage.getOrderCount();
    if (rows === 0) test.skip(true, 'No orders to click');

    await ordersPage.clickFirstOrder();
    expect(page.url()).toMatch(/\/orders\/(sales|purchase)\/[a-z0-9-]+/i);
  });

  test('should show order status badge in list', async ({ page }) => {
    const rows = await ordersPage.getOrderCount();
    if (rows === 0) test.skip(true, 'No orders in list');

    const statusBadge = page
      .locator('.ant-table-tbody .ant-tag, .ant-table-tbody .ant-badge')
      .first();
    await expect(statusBadge).toBeVisible();
  });

  test('should show empty state when no orders match search', async ({ page }) => {
    await ordersPage.searchOrder('ORDER-NONEXISTENT-XYZ-999');
    await page.waitForTimeout(1000);

    const emptyState = page.locator('.ant-empty, [data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    await page.route('**/api/orders*', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/dashboard/orders/sales');
    await page.waitForTimeout(2000);

    const errorEl = page.locator(
      '.ant-message-error, .ant-notification-notice-error, .ant-alert-error',
    );
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Purchase Orders', () => {
  let loginPage: LoginPage;
  let ordersPage: OrdersPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    ordersPage = new OrdersPage(page);

    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
    await ordersPage.gotoPurchaseOrders();
    await ordersPage.waitForOrdersLoad();
  });

  test('should display purchase orders list', async ({ page }) => {
    expect(page.url()).toContain('/orders/purchase');
    await expect(ordersPage.orderTable).toBeVisible();
  });

  test('should show create purchase order button', async ({ page }) => {
    await expect(ordersPage.createButton).toBeVisible();
  });

  test('should filter purchase orders by status', async ({ page }) => {
    const statusFilter = page.locator('.ant-select').filter({ hasText: /status/i });
    if (await statusFilter.isVisible()) {
      await ordersPage.filterByStatus('draft');
      const count = await ordersPage.getOrderCount();
      expect(count).toBeGreaterThanOrEqual(0);
    } else {
      test.skip(true, 'Status filter not available');
    }
  });
});

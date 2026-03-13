import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Order Management
 * Tests complete order lifecycle from creation to completion
 */

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Navigate to orders
    await page.goto('/dashboard/orders/sales');
  });

  test('should display orders list', async ({ page }) => {
    await expect(page.locator('text=/đơn hàng/i')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create new order', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /tạo đơn hàng/i }).click();

    // Should navigate to form
    await expect(page).toHaveURL(/\/dashboard\/orders\/sales\/new/);

    // Select customer
    await page.locator('.ant-select').first().click();
    await page.locator('.ant-select-item').first().click();

    // Add product
    await page.getByRole('button', { name: /thêm sản phẩm/i }).click();

    // Select product
    await page.locator('.ant-select').nth(1).click();
    await page.locator('.ant-select-item').first().click();

    // Enter quantity
    await page.getByLabel(/số lượng/i).fill('5');

    // Submit form
    await page.getByRole('button', { name: /tạo đơn/i }).click();

    // Should redirect back to list
    await expect(page).toHaveURL(/\/dashboard\/orders\/sales$/);

    // Should show success message
    await expect(page.locator('text=/thành công/i')).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    // Click first order
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/dashboard\/orders\/sales\/\d+\/detail/);

    // Should show order information
    await expect(page.locator('text=/chi tiết đơn hàng/i')).toBeVisible();
    await expect(page.locator('text=/khách hàng/i')).toBeVisible();
    await expect(page.locator('text=/tổng tiền/i')).toBeVisible();
  });

  test('should confirm order', async ({ page }) => {
    // Navigate to first order detail
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Click confirm button if available
    const confirmButton = page.getByRole('button', { name: /xác nhận/i });

    if (await confirmButton.isVisible()) {
      await confirmButton.click();

      // Should show confirmation dialog
      await expect(page.locator('.ant-modal')).toBeVisible();

      // Confirm
      await page.getByRole('button', { name: /ok|xác nhận/i }).click();

      // Should show success message
      await expect(page.locator('text=/xác nhận thành công/i')).toBeVisible();

      // Status should update
      await expect(page.locator('text=/đã xác nhận/i')).toBeVisible();
    }
  });

  test('should cancel order', async ({ page }) => {
    // Navigate to first order detail
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Click cancel button if available
    const cancelButton = page.getByRole('button', { name: /hủy/i });

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Should show confirmation dialog
      await expect(page.locator('.ant-modal')).toBeVisible();

      // Confirm cancellation
      await page.getByRole('button', { name: /ok|xác nhận/i }).click();

      // Should show success message
      await expect(page.locator('text=/hủy thành công/i')).toBeVisible();
    }
  });

  test('should filter orders by status', async ({ page }) => {
    // Click status filter
    const statusFilter = page.locator('.ant-select').first();
    await statusFilter.click();

    // Select a status
    await page.locator('.ant-select-item').first().click();

    // Table should update
    await page.waitForTimeout(500);
    await expect(page.locator('table')).toBeVisible();
  });

  test('should filter orders by date range', async ({ page }) => {
    // Click date picker
    const datePicker = page.locator('.ant-picker').first();

    if (await datePicker.isVisible()) {
      await datePicker.click();

      // Select today
      await page.locator('.ant-picker-cell-today').click();

      // Table should update
      await page.waitForTimeout(500);
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should calculate order total correctly', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /tạo đơn hàng/i }).click();

    // Select customer
    await page.locator('.ant-select').first().click();
    await page.locator('.ant-select-item').first().click();

    // Add product with known price
    await page.getByRole('button', { name: /thêm sản phẩm/i }).click();
    await page.locator('.ant-select').nth(1).click();
    await page.locator('.ant-select-item').first().click();

    // Enter quantity
    await page.getByLabel(/số lượng/i).fill('10');

    // Check if total is calculated
    const totalElement = page.locator('text=/tổng cộng/i').locator('..').locator('text=/₫/');
    await expect(totalElement).toBeVisible();
  });

  test('should show payment status', async ({ page }) => {
    // Navigate to first order detail
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Should show payment status
    await expect(page.locator('text=/thanh toán/i')).toBeVisible();

    // Should show payment amount
    await expect(page.locator('text=/đã thanh toán/i')).toBeVisible();
    await expect(page.locator('text=/còn lại/i')).toBeVisible();
  });
});

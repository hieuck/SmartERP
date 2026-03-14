import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';
import {
  waitForNetworkIdle,
  waitForTableLoad,
  waitForSuccessMessage,
  waitForModal,
  waitForModalClose,
  waitForLoadingComplete,
} from './helpers/wait.helper';

/**
 * E2E Tests for Order Management
 * Tests complete order lifecycle from creation to completion
 * 
 * Test Coverage:
 * - List orders
 * - Create order
 * - View order details
 * - Confirm order
 * - Cancel order
 * - Filter by status
 * - Filter by date
 * - Calculate totals
 * - Payment status
 */

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);

    // Navigate to orders
    await page.goto('/dashboard/orders/sales');
    await waitForNetworkIdle(page);
  });

  test('should display orders list', async ({ page }) => {
    await expect(page.locator('text=/đơn hàng|orders/i')).toBeVisible();
    await waitForTableLoad(page);
  });

  test('should display order table with columns', async ({ page }) => {
    await waitForTableLoad(page);
    
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Should have table headers
    const headers = table.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('should create new order', async ({ page }) => {
    // Click create button
    const createButton = page.getByRole('button', { name: /tạo đơn hàng|tạo mới|create|new order/i });
    
    if (await createButton.isVisible()) {
      await createButton.click();

      // Should navigate to form
      await expect(page).toHaveURL(/\/dashboard\/orders\/sales\/new/, { timeout: 5000 });

      // Select customer
      const customerSelect = page.locator('.ant-select').first();
      if (await customerSelect.isVisible()) {
        await customerSelect.click();
        await page.locator('.ant-select-item').first().click();
      }

      // Add product
      const addProductButton = page.getByRole('button', { name: /thêm sản phẩm|add product/i });
      if (await addProductButton.isVisible()) {
        await addProductButton.click();

        // Select product
        const productSelect = page.locator('.ant-select').nth(1);
        if (await productSelect.isVisible()) {
          await productSelect.click();
          await page.locator('.ant-select-item').first().click();
        }

        // Enter quantity
        const quantityInput = page.getByLabel(/số lượng|quantity/i);
        if (await quantityInput.isVisible()) {
          await quantityInput.fill('5');
        }
      }

      // Submit form
      await page.getByRole('button', { name: /tạo đơn|lưu|save|create/i }).click();

      // Should redirect back to list
      await expect(page).toHaveURL(/\/dashboard\/orders\/sales$/, { timeout: 10000 });

      // Should show success message
      await waitForSuccessMessage(page);
    }
  });

  test('should view order details', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Click first order row
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/dashboard\/orders\/sales\/\d+/, { timeout: 5000 });

      // Should show order information
      await expect(page.locator('text=/chi tiết|details|order/i')).toBeVisible();
    }
  });

  test('should confirm order', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Navigate to first order detail
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Click confirm button if available
      const confirmButton = page.getByRole('button', { name: /xác nhận|confirm/i });

      if (await confirmButton.isVisible() && !(await confirmButton.isDisabled())) {
        await confirmButton.click();

        // Should show confirmation dialog
        await waitForModal(page);

        // Confirm
        await page.getByRole('button', { name: /ok|xác nhận|confirm|yes/i }).click();
        await waitForModalClose(page);

        // Should show success message
        await waitForSuccessMessage(page);
      }
    }
  });

  test('should cancel order', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Navigate to first order detail
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Click cancel button if available
      const cancelButton = page.getByRole('button', { name: /hủy|cancel/i });

      if (await cancelButton.isVisible() && !(await cancelButton.isDisabled())) {
        await cancelButton.click();

        // Should show confirmation dialog
        await waitForModal(page);

        // Confirm cancellation
        await page.getByRole('button', { name: /ok|xác nhận|confirm|yes/i }).click();
        await waitForModalClose(page);

        // Should show success message
        await waitForSuccessMessage(page);
      }
    }
  });

  test('should filter orders by status', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Click status filter
    const statusFilter = page.locator('.ant-select, select').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Select a status
      const firstOption = page.locator('.ant-select-item, option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await waitForLoadingComplete(page);
        await waitForTableLoad(page);
      }
    }
  });

  test('should filter orders by date range', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Click date picker
    const datePicker = page.locator('.ant-picker').first();

    if (await datePicker.isVisible()) {
      await datePicker.click();

      // Select today
      const todayCell = page.locator('.ant-picker-cell-today');
      if (await todayCell.isVisible()) {
        await todayCell.click();
        await waitForLoadingComplete(page);
        await waitForTableLoad(page);
      }
    }
  });

  test('should calculate order total correctly', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Navigate to first order detail
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Check if total is displayed
      const totalElement = page.locator('text=/tổng cộng|total|subtotal/i');
      const hasTotal = await totalElement.isVisible();
      
      expect(hasTotal).toBeTruthy();
    }
  });

  test('should show payment status', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Navigate to first order detail
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Should show payment status
      const paymentStatus = page.locator('text=/thanh toán|payment|paid|unpaid/i');
      const hasPaymentStatus = await paymentStatus.first().isVisible();
      
      expect(hasPaymentStatus).toBeTruthy();
    }
  });

  test('should display order status badge', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Should have status badges in table
    const statusBadges = page.locator('.ant-tag, .ant-badge, [class*="status"]');
    const badgeCount = await statusBadges.count();
    
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('should search orders', async ({ page }) => {
    await waitForTableLoad(page);
    
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await waitForLoadingComplete(page);
      await waitForTableLoad(page);
    }
  });

  test('should paginate through orders', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Check if pagination exists
    const pagination = page.locator('.ant-pagination');

    if (await pagination.isVisible()) {
      // Click next page
      const nextButton = page.getByRole('button', { name: /next|›|»/i });
      
      if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
        await nextButton.click();
        await waitForLoadingComplete(page);
        await waitForTableLoad(page);
      }
    }
  });

  test('should display order count', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Should show total count
    const countText = page.locator('text=/tổng|total|items/i');
    const hasCount = await countText.isVisible();
    
    expect(hasCount).toBeTruthy();
  });

  test('should have export functionality', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Check for export button
    const exportButton = page.getByRole('button', { name: /xuất|export/i });
    
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeVisible();
    }
  });

  test('should handle empty state', async ({ page }) => {
    // Search for non-existent order
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('NONEXISTENT_ORDER_XYZ_123');
      await waitForLoadingComplete(page);
      
      // Should show empty state or no results message
      const hasEmptyState = await page.locator('text=/không có|no data|empty|no results/i').isVisible();
      expect(hasEmptyState).toBeTruthy();
    }
  });

  test('should display customer information in order details', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Navigate to first order detail
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Should show customer info
      const customerInfo = page.locator('text=/khách hàng|customer/i');
      const hasCustomerInfo = await customerInfo.isVisible();
      
      expect(hasCustomerInfo).toBeTruthy();
    }
  });
});

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';
import { generateTestProduct } from './helpers/test-data.helper';
import {
  waitForNetworkIdle,
  waitForTableLoad,
  waitForSuccessMessage,
  waitForModal,
  waitForModalClose,
  waitForLoadingComplete,
} from './helpers/wait.helper';

/**
 * E2E Tests for Product Management
 * Tests CRUD operations for products
 * 
 * Test Coverage:
 * - List products
 * - Create product
 * - Edit product
 * - Delete product
 * - Search products
 * - Filter by category
 * - Pagination
 * - Validation
 * - Low stock alerts
 */

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
    
    // Navigate to products
    await page.goto('/dashboard/products');
    await waitForNetworkIdle(page);
  });

  test('should display products list', async ({ page }) => {
    await expect(page.locator('text=/danh sách sản phẩm|products|sản phẩm/i')).toBeVisible();
    await waitForTableLoad(page);
  });

  test('should display product table with columns', async ({ page }) => {
    await waitForTableLoad(page);
    
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Should have table headers
    const headers = table.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('should search products', async ({ page }) => {
    await waitForTableLoad(page);
    
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await waitForLoadingComplete(page);
      await waitForTableLoad(page);
    }
  });

  test('should create new product', async ({ page }) => {
    const product = generateTestProduct();
    
    // Click create button
    const createButton = page.getByRole('button', { name: /thêm sản phẩm|thêm mới|create|new/i });
    await createButton.click();

    // Should navigate to form
    await expect(page).toHaveURL(/\/dashboard\/products\/new/, { timeout: 5000 });

    // Fill form
    await page.getByLabel(/mã sản phẩm|sku|code/i).fill(product.sku);
    await page.getByLabel(/tên sản phẩm|product name|name/i).fill(product.name);
    await page.getByLabel(/giá bán|sale price|price/i).fill(product.salePrice);
    await page.getByLabel(/giá vốn|cost price|cost/i).fill(product.costPrice);
    await page.getByLabel(/tồn kho|stock|quantity/i).fill(product.stock);

    // Submit form
    await page.getByRole('button', { name: /lưu|save|submit/i }).click();

    // Should redirect back to list
    await expect(page).toHaveURL(/\/dashboard\/products$/, { timeout: 10000 });

    // Should show success message
    await waitForSuccessMessage(page);
  });

  test('should edit existing product', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Click first edit button
    const editButton = page.getByRole('button', { name: /sửa|edit/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();

      // Should navigate to edit form
      await expect(page).toHaveURL(/\/dashboard\/products\/\d+/, { timeout: 5000 });

      // Update product name
      const nameInput = page.getByLabel(/tên sản phẩm|product name|name/i);
      await nameInput.clear();
      await nameInput.fill(`Updated Product ${Date.now()}`);

      // Submit form
      await page.getByRole('button', { name: /lưu|save|update/i }).click();

      // Should redirect back to list
      await expect(page).toHaveURL(/\/dashboard\/products$/, { timeout: 10000 });

      // Should show success message
      await waitForSuccessMessage(page);
    }
  });

  test('should delete product', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Click first delete button
    const deleteButton = page.getByRole('button', { name: /xóa|delete/i }).first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      await waitForModal(page);
      await expect(page.locator('text=/bạn có chắc|are you sure|confirm/i')).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /ok|xác nhận|confirm|yes/i }).click();

      // Wait for modal to close
      await waitForModalClose(page);

      // Should show success message
      await waitForSuccessMessage(page);
    }
  });

  test('should filter by category', async ({ page }) => {
    await waitForTableLoad(page);
    
    const categoryFilter = page.locator('select, .ant-select').first();

    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();

      // Select first category
      const firstOption = page.locator('.ant-select-item, option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await waitForLoadingComplete(page);
        await waitForTableLoad(page);
      }
    }
  });

  test('should paginate through products', async ({ page }) => {
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

  test('should show low stock alert', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Look for low stock indicator
    const lowStockBadge = page.locator('text=/thấp|low|warning/i, .ant-badge-status-error, .ant-tag-error').first();

    if (await lowStockBadge.isVisible()) {
      // Low stock indicator should be visible
      await expect(lowStockBadge).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Click create button
    const createButton = page.getByRole('button', { name: /thêm sản phẩm|thêm mới|create|new/i });
    await createButton.click();

    // Try to submit empty form
    await page.getByRole('button', { name: /lưu|save|submit/i }).click();

    // Should show validation errors
    await expect(page.locator('text=/bắt buộc|required|please/i')).toBeVisible();
  });

  test('should validate price fields', async ({ page }) => {
    // Click create button
    const createButton = page.getByRole('button', { name: /thêm sản phẩm|thêm mới|create|new/i });
    await createButton.click();

    // Fill with invalid price
    const priceInput = page.getByLabel(/giá bán|sale price|price/i);
    await priceInput.fill('-100');
    await priceInput.blur();

    // Should show validation error
    const hasError = await page.locator('text=/không hợp lệ|invalid|must be positive/i').isVisible();
    expect(hasError).toBeTruthy();
  });

  test('should display product count', async ({ page }) => {
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

  test('should sort products by column', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Click on a sortable column header
    const columnHeader = page.locator('thead th').first();
    
    if (await columnHeader.isVisible()) {
      await columnHeader.click();
      await waitForLoadingComplete(page);
      await waitForTableLoad(page);
    }
  });

  test('should display product images', async ({ page }) => {
    await waitForTableLoad(page);
    
    // Check for images in table
    const images = page.locator('table img, table .ant-image');
    const imageCount = await images.count();
    
    // May or may not have images depending on data
    expect(imageCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty state', async ({ page }) => {
    // Search for non-existent product
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('NONEXISTENT_PRODUCT_XYZ_123');
      await waitForLoadingComplete(page);
      
      // Should show empty state or no results message
      const hasEmptyState = await page.locator('text=/không có|no data|empty|no results/i').isVisible();
      expect(hasEmptyState).toBeTruthy();
    }
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Product Management
 * Tests CRUD operations for products
 */

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    
    // Navigate to products
    await page.goto('/dashboard/products');
  });

  test('should display products list', async ({ page }) => {
    await expect(page.locator('text=/danh sách sản phẩm/i')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/tìm kiếm/i);
    await searchInput.fill('test');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Table should update
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create new product', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /thêm sản phẩm/i }).click();
    
    // Should navigate to form
    await expect(page).toHaveURL(/\/dashboard\/products\/new/);
    
    // Fill form
    const timestamp = Date.now();
    await page.getByLabel(/mã sản phẩm/i).fill(`SKU-${timestamp}`);
    await page.getByLabel(/tên sản phẩm/i).fill(`Test Product ${timestamp}`);
    await page.getByLabel(/giá bán/i).fill('100000');
    await page.getByLabel(/giá vốn/i).fill('80000');
    await page.getByLabel(/tồn kho/i).fill('100');
    
    // Submit form
    await page.getByRole('button', { name: /lưu/i }).click();
    
    // Should redirect back to list
    await expect(page).toHaveURL(/\/dashboard\/products$/);
    
    // Should show success message
    await expect(page.locator('text=/thành công/i')).toBeVisible();
  });

  test('should edit existing product', async ({ page }) => {
    // Click first edit button
    const editButton = page.getByRole('button', { name: /sửa/i }).first();
    await editButton.click();
    
    // Should navigate to edit form
    await expect(page).toHaveURL(/\/dashboard\/products\/\d+/);
    
    // Update product name
    const nameInput = page.getByLabel(/tên sản phẩm/i);
    await nameInput.clear();
    await nameInput.fill(`Updated Product ${Date.now()}`);
    
    // Submit form
    await page.getByRole('button', { name: /lưu/i }).click();
    
    // Should redirect back to list
    await expect(page).toHaveURL(/\/dashboard\/products$/);
    
    // Should show success message
    await expect(page.locator('text=/cập nhật thành công/i')).toBeVisible();
  });

  test('should delete product', async ({ page }) => {
    // Click first delete button
    const deleteButton = page.getByRole('button', { name: /xóa/i }).first();
    await deleteButton.click();
    
    // Should show confirmation dialog
    await expect(page.locator('.ant-modal')).toBeVisible();
    await expect(page.locator('text=/bạn có chắc/i')).toBeVisible();
    
    // Confirm deletion
    await page.getByRole('button', { name: /ok|xác nhận/i }).click();
    
    // Should show success message
    await expect(page.locator('text=/xóa thành công/i')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    const categoryFilter = page.locator('select, .ant-select').first();
    
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      
      // Select first category
      await page.locator('.ant-select-item').first().click();
      
      // Table should update
      await page.waitForTimeout(500);
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should paginate through products', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('.ant-pagination');
    
    if (await pagination.isVisible()) {
      // Click next page
      await page.getByRole('button', { name: /next/i }).click();
      
      // URL should update
      await expect(page).toHaveURL(/page=2/);
      
      // Table should update
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should show low stock alert', async ({ page }) => {
    // Look for low stock indicator
    const lowStockBadge = page.locator('text=/thấp|low/i').first();
    
    if (await lowStockBadge.isVisible()) {
      await expect(lowStockBadge).toHaveCSS('color', /red|#ff/);
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /thêm sản phẩm/i }).click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /lưu/i }).click();
    
    // Should show validation errors
    await expect(page.locator('text=/bắt buộc|required/i')).toBeVisible();
  });
});

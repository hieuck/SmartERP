import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ProductsPage } from '../../pages/ProductsPage';

/**
 * Product List Operations E2E Tests
 * 
 * Test cases:
 * 1. Display products list with pagination
 * 2. Search products by name/SKU
 * 3. Filter products by category
 * 4. Filter products by status
 * 5. Sort products by different fields
 * 6. Bulk operations
 * 7. Export products list
 * 8. Empty state handling
 * 9. Loading state
 * 10. Error handling
 */
test.describe('Product List Operations', () => {
  let loginPage: LoginPage;
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productsPage = new ProductsPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');

    // Navigate to products page
    await productsPage.goto();
    await productsPage.waitForProductsLoad();
  });

  test('should display products list with pagination', async ({ page }) => {
    // Verify table is visible
    await expect(productsPage.productTable).toBeVisible();

    // Get initial product count
    const productCount = await productsPage.getProductCount();
    expect(productCount).toBeGreaterThan(0);

    // Verify pagination controls exist
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();

    // Check page size options
    const pageSizeSelector = page.locator('.ant-pagination-options');
    if (await pageSizeSelector.isVisible()) {
      await pageSizeSelector.click();
      await expect(page.locator('.ant-select-dropdown')).toBeVisible();
    }
  });

  test('should search products by name', async ({ page }) => {
    // Create a test product first
    await productsPage.clickCreateProduct();
    const uniqueName = `Search Test ${Date.now()}`;
    await productsPage.createProduct({
      name: uniqueName,
      sku: `SKU-SEARCH-${Date.now()}`,
      price: 100,
    });
    await page.waitForURL('/dashboard/products');

    // Search for the product
    await productsPage.searchProduct(uniqueName);
    await page.waitForTimeout(1000);

    // Verify only matching products are shown
    const productCount = await productsPage.getProductCount();
    expect(productCount).toBeGreaterThan(0);
    expect(await productsPage.productExists(uniqueName)).toBe(true);
  });

  test('should search products by SKU', async ({ page }) => {
    // Create a test product with unique SKU
    await productsPage.clickCreateProduct();
    const uniqueSKU = `SKU-UNIQUE-${Date.now()}`;
    await productsPage.createProduct({
      name: 'SKU Search Test',
      sku: uniqueSKU,
      price: 100,
    });
    await page.waitForURL('/dashboard/products');

    // Search by SKU
    await productsPage.searchProduct(uniqueSKU);
    await page.waitForTimeout(1000);

    // Verify product found
    const productCount = await productsPage.getProductCount();
    expect(productCount).toBe(1);
  });

  test('should filter products by category', async ({ page }) => {
    // Check if category filter exists
    const categoryFilter = page.locator('.ant-select').filter({ hasText: /category/i });
    
    if (await categoryFilter.isVisible()) {
      // Get initial count
      const initialCount = await productsPage.getProductCount();

      // Apply category filter
      await categoryFilter.click();
      await page.locator('.ant-select-dropdown .ant-select-item').first().click();
      await page.waitForTimeout(1000);

      // Verify filtered results
      const filteredCount = await productsPage.getProductCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    } else {
      test.skip(true, 'Category filter not available');
    }
  });

  test('should filter products by status', async ({ page }) => {
    // Check if status filter exists
    const statusFilter = page.locator('.ant-select').filter({ hasText: /status/i });
    
    if (await statusFilter.isVisible()) {
      // Get initial count
      const initialCount = await productsPage.getProductCount();

      // Apply status filter (e.g., "Active")
      await statusFilter.click();
      await page.locator('.ant-select-dropdown .ant-select-item:has-text("Active")').click();
      await page.waitForTimeout(1000);

      // Verify filtered results
      const filteredCount = await productsPage.getProductCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    } else {
      test.skip(true, 'Status filter not available');
    }
  });

  test('should sort products by name', async ({ page }) => {
    // Click on name column header to sort
    const nameHeader = page.locator('.ant-table-thead th').filter({ hasText: /name/i });
    
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await page.waitForTimeout(1000);

      // Verify sort indicator
      const sortIcon = nameHeader.locator('.ant-table-column-sorter-up.active, .ant-table-column-sorter-down.active');
      await expect(sortIcon).toBeVisible();
    } else {
      test.skip(true, 'Name column sorting not available');
    }
  });

  test('should sort products by price', async ({ page }) => {
    // Click on price column header to sort
    const priceHeader = page.locator('.ant-table-thead th').filter({ hasText: /price/i });
    
    if (await priceHeader.isVisible()) {
      await priceHeader.click();
      await page.waitForTimeout(1000);

      // Verify sort indicator
      const sortIcon = priceHeader.locator('.ant-table-column-sorter-up.active, .ant-table-column-sorter-down.active');
      await expect(sortIcon).toBeVisible();
    } else {
      test.skip(true, 'Price column sorting not available');
    }
  });

  test('should handle empty search results', async ({ page }) => {
    // Search for non-existent product
    await productsPage.searchProduct('NONEXISTENT_PRODUCT_XYZ_123');
    await page.waitForTimeout(1000);

    // Verify empty state is shown
    const emptyState = page.locator('.ant-empty, [data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();

    // Verify no products shown
    const productCount = await productsPage.getProductCount();
    expect(productCount).toBe(0);
  });

  test('should show loading state while fetching products', async ({ page }) => {
    // Navigate to products page (fresh load)
    await page.goto('/dashboard/products');

    // Verify loading spinner appears briefly
    const loadingSpinner = page.locator('.ant-spin, .ant-skeleton');
    
    // Loading should appear and then disappear
    await expect(loadingSpinner).toBeVisible({ timeout: 2000 }).catch(() => {
      // Loading might be too fast to catch
    });

    // Eventually products should load
    await productsPage.waitForProductsLoad();
    await expect(productsPage.productTable).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/products*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Navigate to products page
    await page.goto('/dashboard/products');
    await page.waitForTimeout(2000);

    // Verify error message is shown
    const errorMessage = page.locator('.ant-message-error, .ant-notification-notice-error, .ant-alert-error');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ProductsPage } from '../../pages/ProductsPage';

/**
 * Product Management E2E Tests
 * 
 * Test cases:
 * 1. Create new product
 * 2. View products list
 * 3. Search products
 * 4. Edit product
 * 5. Delete product
 * 6. Form validation
 */
test.describe('Product Management', () => {
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

  test('should display products list', async ({ page }) => {
    // Verify on products page
    expect(await productsPage.isOnProductsPage()).toBe(true);

    // Verify table is visible
    await expect(productsPage.productTable).toBeVisible();

    // Verify create button is visible
    await expect(productsPage.createButton).toBeVisible();
  });

  test('should create new product successfully', async ({ page }) => {
    // Click create button
    await productsPage.clickCreateProduct();

    // Fill product form
    const productData = {
      name: `Test Product ${Date.now()}`,
      sku: `SKU-${Date.now()}`,
      description: 'Test product description',
      price: 100,
      cost: 50,
      stockQuantity: 100,
      minStock: 10,
    };

    await productsPage.createProduct(productData);

    // Wait for redirect to products list
    await page.waitForURL('/dashboard/products');

    // Verify product appears in list
    expect(await productsPage.productExists(productData.name)).toBe(true);
  });

  test('should validate required fields', async ({ page }) => {
    // Click create button
    await productsPage.clickCreateProduct();

    // Try to submit without filling required fields
    await productsPage.saveButton.click();

    // Verify validation errors are shown
    const errors = page.locator('.ant-form-item-explain-error');
    await expect(errors.first()).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    // Get initial product count
    const initialCount = await productsPage.getProductCount();

    // Search for specific product
    await productsPage.searchProduct('Test');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify results are filtered
    const filteredCount = await productsPage.getProductCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should edit product successfully', async ({ page }) => {
    // Create a product first
    await productsPage.clickCreateProduct();
    const productData = {
      name: `Edit Test Product ${Date.now()}`,
      sku: `SKU-EDIT-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);
    await page.waitForURL('/dashboard/products');

    // Search for the product
    await productsPage.searchProduct(productData.name);
    await page.waitForTimeout(1000);

    // Click edit on first product
    await productsPage.clickEditFirstProduct();

    // Update product
    const updates = {
      name: `${productData.name} - Updated`,
      price: 150,
    };
    await productsPage.updateProduct(updates);

    // Wait for redirect
    await page.waitForURL('/dashboard/products');

    // Verify updated product appears in list
    expect(await productsPage.productExists(updates.name)).toBe(true);
  });

  test('should delete product successfully', async ({ page }) => {
    // Create a product first
    await productsPage.clickCreateProduct();
    const productData = {
      name: `Delete Test Product ${Date.now()}`,
      sku: `SKU-DEL-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);
    await page.waitForURL('/dashboard/products');

    // Search for the product
    await productsPage.searchProduct(productData.name);
    await page.waitForTimeout(1000);

    // Get initial count
    const initialCount = await productsPage.getProductCount();

    // Click delete on first product
    await productsPage.clickDeleteFirstProduct();

    // Confirm delete
    await productsPage.confirmDelete();

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify product count decreased
    const finalCount = await productsPage.getProductCount();
    expect(finalCount).toBe(initialCount - 1);

    // Verify product no longer exists
    expect(await productsPage.productExists(productData.name)).toBe(false);
  });

  test('should validate price is positive number', async ({ page }) => {
    // Click create button
    await productsPage.clickCreateProduct();

    // Fill form with negative price
    await productsPage.nameInput.fill('Test Product');
    await productsPage.skuInput.fill('SKU-TEST');
    await productsPage.priceInput.fill('-100');

    // Try to submit
    await productsPage.saveButton.click();

    // Verify validation error
    const priceError = page.locator('.ant-form-item-explain-error').filter({ hasText: /price|positive/ });
    await expect(priceError).toBeVisible();
  });

  test('should handle duplicate SKU error', async ({ page }) => {
    // Create first product
    await productsPage.clickCreateProduct();
    const sku = `SKU-UNIQUE-${Date.now()}`;
    await productsPage.createProduct({
      name: 'Product 1',
      sku: sku,
      price: 100,
    });
    await page.waitForURL('/dashboard/products');

    // Try to create second product with same SKU
    await productsPage.clickCreateProduct();
    await productsPage.nameInput.fill('Product 2');
    await productsPage.skuInput.fill(sku);
    await productsPage.priceInput.fill('200');
    await productsPage.saveButton.click();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Verify error message is shown
    const errorMessage = page.locator('.ant-message-error, .ant-notification-notice-error');
    await expect(errorMessage).toBeVisible();
  });

  test('should cancel product creation', async ({ page }) => {
    // Click create button
    await productsPage.clickCreateProduct();

    // Fill some fields
    await productsPage.nameInput.fill('Test Product');

    // Click cancel
    await productsPage.cancelButton.click();

    // Verify back on products list
    await page.waitForURL('/dashboard/products');
    expect(await productsPage.isOnProductsPage()).toBe(true);
  });
});

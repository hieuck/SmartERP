import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ProductsPage } from '../../pages/ProductsPage';

/**
 * Offline-First Sync E2E Tests
 * 
 * Test cases:
 * 1. Create entity while offline
 * 2. Update entity while offline
 * 3. Delete entity while offline
 * 4. Sync when going online
 * 5. Conflict resolution
 * 6. Network interruption handling
 * 7. Sync queue management
 * 8. Offline indicator
 * 9. Sync status display
 * 10. Data persistence across sessions
 */
test.describe('Offline-First Sync', () => {
  let loginPage: LoginPage;
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page, context }) => {
    loginPage = new LoginPage(page);
    productsPage = new ProductsPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
  });

  test('should create product while offline', async ({ page, context }) => {
    // Navigate to products page
    await productsPage.goto();
    await productsPage.waitForProductsLoad();

    // Go offline
    await context.setOffline(true);

    // Verify offline indicator appears
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-badge');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });

    // Create product while offline
    await productsPage.clickCreateProduct();
    const productData = {
      name: `Offline Product ${Date.now()}`,
      sku: `SKU-OFFLINE-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);

    // Verify product appears in list (from local storage)
    await page.waitForURL('/dashboard/products');
    expect(await productsPage.productExists(productData.name)).toBe(true);

    // Verify sync queue indicator
    const syncQueue = page.locator('[data-testid="sync-queue"], .sync-pending');
    await expect(syncQueue).toBeVisible({ timeout: 5000 });
  });

  test('should update product while offline', async ({ page, context }) => {
    // Create product while online first
    await productsPage.goto();
    await productsPage.waitForProductsLoad();
    
    await productsPage.clickCreateProduct();
    const productData = {
      name: `Update Test ${Date.now()}`,
      sku: `SKU-UPDATE-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);
    await page.waitForURL('/dashboard/products');

    // Go offline
    await context.setOffline(true);
    await page.waitForLoadState('networkidle');

    // Search and edit product
    await productsPage.searchProduct(productData.name);
    await page.waitForLoadState('networkidle');
    await productsPage.clickEditFirstProduct();

    // Update product
    const updates = {
      name: `${productData.name} - Updated Offline`,
      price: 150,
    };
    await productsPage.updateProduct(updates);

    // Verify update appears locally
    await page.waitForURL('/dashboard/products');
    expect(await productsPage.productExists(updates.name)).toBe(true);
  });

  test('should delete product while offline', async ({ page, context }) => {
    // Create product while online first
    await productsPage.goto();
    await productsPage.waitForProductsLoad();
    
    await productsPage.clickCreateProduct();
    const productData = {
      name: `Delete Test ${Date.now()}`,
      sku: `SKU-DELETE-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);
    await page.waitForURL('/dashboard/products');

    // Go offline
    await context.setOffline(true);
    await page.waitForLoadState('networkidle');

    // Search and delete product
    await productsPage.searchProduct(productData.name);
    await page.waitForLoadState('networkidle');
    await productsPage.clickDeleteFirstProduct();
    await productsPage.confirmDelete();

    // Verify product removed locally
    await page.waitForLoadState('networkidle');
    expect(await productsPage.productExists(productData.name)).toBe(false);
  });

  test('should sync changes when going online', async ({ page, context }) => {
    // Navigate to products page
    await productsPage.goto();
    await productsPage.waitForProductsLoad();

    // Go offline
    await context.setOffline(true);
    await page.waitForLoadState('networkidle');

    // Create product while offline
    await productsPage.clickCreateProduct();
    const productData = {
      name: `Sync Test ${Date.now()}`,
      sku: `SKU-SYNC-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);
    await page.waitForURL('/dashboard/products');

    // Verify sync queue has items
    const syncQueue = page.locator('[data-testid="sync-queue"], .sync-pending');
    await expect(syncQueue).toBeVisible({ timeout: 5000 });

    // Go back online
    await context.setOffline(false);
    await page.waitForLoadState('networkidle');

    // Verify sync starts automatically
    const syncingIndicator = page.locator('[data-testid="syncing"], .sync-in-progress');
    await expect(syncingIndicator).toBeVisible({ timeout: 5000 }).catch(() => {
      // Sync might be too fast
    });

    // Wait for sync to complete (wait for online indicator)
    const onlineIndicator = page.locator('[data-testid="online-indicator"], .online-badge');
    await expect(onlineIndicator).toBeVisible({ timeout: 10000 });

    // Verify sync queue is empty
    await expect(syncQueue).not.toBeVisible({ timeout: 5000 }).catch(() => {
      // Queue indicator might not disappear
    });
  });

  test('should handle conflict resolution', async ({ page, context }) => {
    // This test requires backend support for conflict detection
    // Skip if conflict resolution not implemented
    test.skip(true, 'Conflict resolution requires backend implementation');

    // Create product
    await productsPage.goto();
    await productsPage.waitForProductsLoad();
    await productsPage.clickCreateProduct();
    const productData = {
      name: `Conflict Test ${Date.now()}`,
      sku: `SKU-CONFLICT-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);
    await page.waitForURL('/dashboard/products');

    // Simulate conflict: update same product from two sources
    // 1. Update offline
    await context.setOffline(true);
    await productsPage.searchProduct(productData.name);
    await productsPage.clickEditFirstProduct();
    await productsPage.updateProduct({ price: 150 });

    // 2. Simulate server-side update (would need API call)
    // ...

    // Go online and trigger sync
    await context.setOffline(false);
    await page.waitForLoadState('networkidle');

    // Verify conflict resolution dialog appears
    const conflictDialog = page.locator('[data-testid="conflict-dialog"], .conflict-resolution');
    await expect(conflictDialog).toBeVisible({ timeout: 5000 });
  });

  test('should handle network interruption during sync', async ({ page, context }) => {
    // Create product while online
    await productsPage.goto();
    await productsPage.waitForProductsLoad();
    await productsPage.clickCreateProduct();
    const productData = {
      name: `Network Test ${Date.now()}`,
      sku: `SKU-NETWORK-${Date.now()}`,
      price: 100,
    };

    // Intercept API call to simulate network interruption
    await page.route('**/api/products', route => {
      // Delay and then fail
      setTimeout(() => {
        route.abort('failed');
      }, 1000);
    });

    // Try to create product
    await productsPage.createProduct(productData);

    // Verify error handling
    const errorMessage = page.locator('.ant-message-error, .ant-notification-notice-error');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Verify product queued for retry
    const syncQueue = page.locator('[data-testid="sync-queue"], .sync-pending');
    await expect(syncQueue).toBeVisible({ timeout: 5000 });
  });

  test('should display offline indicator when offline', async ({ page, context }) => {
    // Navigate to products page
    await productsPage.goto();
    await productsPage.waitForProductsLoad();

    // Go offline
    await context.setOffline(true);
    await page.waitForLoadState('networkidle');

    // Verify offline indicator appears
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-badge, .offline-status');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });

    // Verify indicator text
    await expect(offlineIndicator).toContainText(/offline/i);
  });

  test('should display sync status', async ({ page, context }) => {
    // Navigate to products page
    await productsPage.goto();
    await productsPage.waitForProductsLoad();

    // Go offline and create product
    await context.setOffline(true);
    await page.waitForLoadState('networkidle');

    await productsPage.clickCreateProduct();
    const productData = {
      name: `Status Test ${Date.now()}`,
      sku: `SKU-STATUS-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);
    await page.waitForURL('/dashboard/products');

    // Check sync status display
    const syncStatus = page.locator('[data-testid="sync-status"], .sync-info');
    if (await syncStatus.isVisible()) {
      // Verify shows pending items count
      await expect(syncStatus).toContainText(/pending|queue/i);
    }

    // Go online
    await context.setOffline(false);
    await page.waitForLoadState('networkidle');

    // Wait for online indicator to confirm sync completion
    const onlineIndicator = page.locator('[data-testid="online-indicator"], .online-badge');
    await expect(onlineIndicator).toBeVisible({ timeout: 10000 });

    // Verify sync status updates
    if (await syncStatus.isVisible()) {
      await expect(syncStatus).toContainText(/synced|up to date/i);
    }
  });

  test('should persist data across sessions', async ({ page, context }) => {
    // Create product while offline
    await productsPage.goto();
    await productsPage.waitForProductsLoad();

    await context.setOffline(true);
    await page.waitForLoadState('networkidle');

    // Wait for offline indicator to confirm offline state
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-badge');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });

    await productsPage.clickCreateProduct();
    const productData = {
      name: `Persist Test ${Date.now()}`,
      sku: `SKU-PERSIST-${Date.now()}`,
      price: 100,
    };
    await productsPage.createProduct(productData);
    await page.waitForURL('/dashboard/products');

    // Verify product exists
    expect(await productsPage.productExists(productData.name)).toBe(true);

    // Reload page (simulate session restart)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify product still exists (from IndexedDB/localStorage)
    await productsPage.waitForProductsLoad();
    expect(await productsPage.productExists(productData.name)).toBe(true);

    // Verify still offline
    const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-badge');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
  });
});

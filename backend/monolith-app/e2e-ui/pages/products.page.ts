import { Page, expect } from '@playwright/test';

/**
 * Products Page Object
 * Handles all interactions with the Products management page
 */

export interface ProductData {
  name: string;
  sku: string;
  price: number;
  cost?: number;
  unit?: string;
  categoryId?: string;
  description?: string;
}

export class ProductsPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the Products page
   */
  async navigate() {
    // Click on Products menu item (Vietnamese: "Sản Phẩm")
    await this.page.click('text=Sản Phẩm');
    
    // Wait for URL to change to products page
    await this.page.waitForURL(/\/dashboard\/products/, { timeout: 5000 });
    
    // Wait for page to finish loading
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Give the page a moment to render
    await this.page.waitForTimeout(1000);
  }

  /**
   * Create a new product
   */
  async createProduct(data: ProductData) {
    // Click Create Product button
    await this.page.click('button:has-text("Create Product")');
    
    // Wait for modal to appear
    await this.page.waitForSelector('.ant-modal', { timeout: 5000 });
    
    // Fill product name
    await this.page.fill('input[name="name"]', data.name);
    
    // Fill SKU
    await this.page.fill('input[name="sku"]', data.sku);
    
    // Fill price
    await this.page.fill('input[name="price"]', data.price.toString());
    
    // Fill optional fields if provided
    if (data.cost !== undefined) {
      await this.page.fill('input[name="cost"]', data.cost.toString());
    }
    
    if (data.unit) {
      await this.page.fill('input[name="unit"]', data.unit);
    }
    
    if (data.description) {
      await this.page.fill('textarea[name="description"]', data.description);
    }
    
    if (data.categoryId) {
      // Select category from dropdown
      await this.page.click('.ant-select[name="categoryId"]');
      await this.page.click(`.ant-select-item:has-text("${data.categoryId}")`);
    }
    
    // Click Save button
    await this.page.click('.ant-modal button:has-text("Save")');
    
    // Wait for success message
    await expect(this.page.locator('.ant-message-success').or(this.page.locator('text=Success'))).toBeVisible({ timeout: 5000 });
    
    // Wait for modal to close
    await this.page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 5000 });
  }

  /**
   * Search for a product by name
   */
  async searchProduct(name: string) {
    // Find search input (common Ant Design patterns)
    const searchInput = this.page.locator('input[placeholder*="Search"]').or(
      this.page.locator('input[placeholder*="Tìm kiếm"]')
    ).first();
    
    // Fill search term
    await searchInput.fill(name);
    
    // Press Enter to trigger search
    await searchInput.press('Enter');
    
    // Wait for table to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Edit an existing product
   */
  async editProduct(productName: string, newData: Partial<ProductData>) {
    // Find the product row in the table
    const row = this.page.locator(`.ant-table-row:has-text("${productName}")`);
    
    // Click edit button (common patterns: Edit icon, pencil icon, or Edit text)
    await row.locator('button:has-text("Edit")').or(
      row.locator('[aria-label="edit"]')
    ).or(
      row.locator('.anticon-edit')
    ).first().click();
    
    // Wait for modal to appear
    await this.page.waitForSelector('.ant-modal', { timeout: 5000 });
    
    // Update fields if provided
    if (newData.name) {
      await this.page.fill('input[name="name"]', newData.name);
    }
    
    if (newData.sku) {
      await this.page.fill('input[name="sku"]', newData.sku);
    }
    
    if (newData.price !== undefined) {
      await this.page.fill('input[name="price"]', newData.price.toString());
    }
    
    if (newData.cost !== undefined) {
      await this.page.fill('input[name="cost"]', newData.cost.toString());
    }
    
    if (newData.unit) {
      await this.page.fill('input[name="unit"]', newData.unit);
    }
    
    if (newData.description) {
      await this.page.fill('textarea[name="description"]', newData.description);
    }
    
    // Click Save button
    await this.page.click('.ant-modal button:has-text("Save")');
    
    // Wait for success message
    await expect(this.page.locator('.ant-message-success').or(this.page.locator('text=Success'))).toBeVisible({ timeout: 5000 });
    
    // Wait for modal to close
    await this.page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 5000 });
  }

  /**
   * Delete a product
   */
  async deleteProduct(productName: string) {
    // Find the product row in the table
    const row = this.page.locator(`.ant-table-row:has-text("${productName}")`);
    
    // Click delete button (common patterns: Delete icon, trash icon, or Delete text)
    await row.locator('button:has-text("Delete")').or(
      row.locator('[aria-label="delete"]')
    ).or(
      row.locator('.anticon-delete')
    ).first().click();
    
    // Wait for confirmation modal
    await this.page.waitForSelector('.ant-modal-confirm', { timeout: 5000 });
    
    // Click OK/Confirm button in the confirmation modal
    await this.page.click('.ant-modal-confirm button:has-text("OK")').catch(() => 
      this.page.click('.ant-modal-confirm button:has-text("Confirm")')
    ).catch(() =>
      this.page.click('.ant-modal-confirm .ant-btn-primary')
    );
    
    // Wait for success message
    await expect(this.page.locator('.ant-message-success').or(this.page.locator('text=Success'))).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify that a product exists in the table
   */
  async verifyProductExists(name: string) {
    // Wait for the table to be visible
    await this.page.waitForSelector('.ant-table', { timeout: 5000 });
    
    // Check if product name is visible in the table
    await expect(this.page.locator(`.ant-table-row:has-text("${name}")`)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify that a product does not exist in the table
   */
  async verifyProductNotExists(name: string) {
    // Wait for the table to be visible
    await this.page.waitForSelector('.ant-table', { timeout: 5000 });
    
    // Check if product name is not visible in the table
    await expect(this.page.locator(`.ant-table-row:has-text("${name}")`)).not.toBeVisible();
  }

  /**
   * Get the count of products in the table
   */
  async getProductCount(): Promise<number> {
    // Wait for table to load
    await this.page.waitForSelector('.ant-table', { timeout: 5000 });
    
    // Count table rows (excluding header)
    const rows = await this.page.locator('.ant-table-tbody .ant-table-row').count();
    return rows;
  }

  /**
   * Filter products by category
   */
  async filterByCategory(categoryName: string) {
    // Click category filter dropdown
    await this.page.click('.ant-select[placeholder*="Category"]').catch(() =>
      this.page.click('.ant-select[placeholder*="Danh mục"]')
    );
    
    // Select category option
    await this.page.click(`.ant-select-item:has-text("${categoryName}")`);
    
    // Wait for table to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    // Click reset/clear button if exists
    await this.page.click('button:has-text("Reset")').catch(() =>
      this.page.click('button:has-text("Clear")')
    ).catch(() =>
      this.page.click('button:has-text("Xóa bộ lọc")')
    );
    
    // Wait for table to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Export products to file
   */
  async exportProducts() {
    // Click export button
    await this.page.click('button:has-text("Export")').catch(() =>
      this.page.click('button:has-text("Xuất file")')
    );
    
    // Wait for download to start
    const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 });
    const download = await downloadPromise;
    
    return download;
  }

  /**
   * View product details
   */
  async viewProductDetails(productName: string) {
    // Find the product row and click on it or click view button
    const row = this.page.locator(`.ant-table-row:has-text("${productName}")`);
    
    await row.locator('button:has-text("View")').or(
      row.locator('[aria-label="view"]')
    ).or(
      row.locator('.anticon-eye')
    ).first().click().catch(() => row.click());
    
    // Wait for details modal or page to load
    await this.page.waitForSelector('.ant-modal, .product-details', { timeout: 5000 });
  }
}

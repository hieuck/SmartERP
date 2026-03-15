import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ProductsPage - Page Object Model for Products management
 * 
 * Handles:
 * - Product list view
 * - Product creation
 * - Product editing
 * - Product deletion
 * - Product search and filter
 */
export class ProductsPage extends BasePage {
  // Locators for list view
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly productTable: Locator;
  readonly productRows: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;

  // Locators for form
  readonly nameInput: Locator;
  readonly skuInput: Locator;
  readonly descriptionInput: Locator;
  readonly priceInput: Locator;
  readonly costInput: Locator;
  readonly categorySelect: Locator;
  readonly stockQuantityInput: Locator;
  readonly minStockInput: Locator;
  readonly unitSelect: Locator;
  readonly statusSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Locators for actions
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // List view
    this.pageTitle = page.locator('h1, h2').filter({ hasText: 'Products' });
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New Product"), button:has-text("Add Product")');
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    this.productTable = page.locator('.ant-table');
    this.productRows = page.locator('.ant-table-tbody tr');
    this.loadingSpinner = page.locator('.ant-spin');
    this.emptyState = page.locator('.ant-empty');

    // Form fields
    this.nameInput = page.locator('input[name="name"], input#name');
    this.skuInput = page.locator('input[name="sku"], input#sku');
    this.descriptionInput = page.locator('textarea[name="description"], textarea#description');
    this.priceInput = page.locator('input[name="price"], input#price');
    this.costInput = page.locator('input[name="cost"], input#cost');
    this.categorySelect = page.locator('.ant-select').filter({ has: page.locator('input[name="categoryId"]') });
    this.stockQuantityInput = page.locator('input[name="stockQuantity"], input#stockQuantity');
    this.minStockInput = page.locator('input[name="minStock"], input#minStock');
    this.unitSelect = page.locator('.ant-select').filter({ has: page.locator('input[name="unit"]') });
    this.statusSelect = page.locator('.ant-select').filter({ has: page.locator('input[name="status"]') });
    this.saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    this.cancelButton = page.locator('button:has-text("Cancel")');

    // Actions
    this.editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    this.deleteButton = page.locator('button:has-text("Delete")').first();
    this.confirmDeleteButton = page.locator('.ant-modal button:has-text("OK"), .ant-modal button:has-text("Delete")');
  }

  /**
   * Navigate to products page
   */
  async goto() {
    await super.goto('/dashboard/products');
  }

  /**
   * Wait for products list to load
   */
  async waitForProductsLoad() {
    await this.waitForApiResponse('/api/products');
    await this.productTable.waitFor({ state: 'visible' });
  }

  /**
   * Click create product button
   */
  async clickCreateProduct() {
    await this.clickButton(this.createButton);
    await this.waitForNavigation('/dashboard/products/new');
  }

  /**
   * Create a new product
   */
  async createProduct(productData: {
    name: string;
    sku: string;
    description?: string;
    price: number;
    cost?: number;
    category?: string;
    stockQuantity?: number;
    minStock?: number;
    unit?: string;
    status?: string;
  }) {
    // Fill required fields
    await this.fillInput(this.nameInput, productData.name);
    await this.fillInput(this.skuInput, productData.sku);
    await this.fillInput(this.priceInput, productData.price.toString());

    // Fill optional fields
    if (productData.description) {
      await this.fillInput(this.descriptionInput, productData.description);
    }
    if (productData.cost) {
      await this.fillInput(this.costInput, productData.cost.toString());
    }
    if (productData.category) {
      await this.selectOption(this.categorySelect, productData.category);
    }
    if (productData.stockQuantity !== undefined) {
      await this.fillInput(this.stockQuantityInput, productData.stockQuantity.toString());
    }
    if (productData.minStock !== undefined) {
      await this.fillInput(this.minStockInput, productData.minStock.toString());
    }
    if (productData.unit) {
      await this.selectOption(this.unitSelect, productData.unit);
    }
    if (productData.status) {
      await this.selectOption(this.statusSelect, productData.status);
    }

    // Submit form
    const responsePromise = this.waitForApiResponse('/api/products');
    await this.clickButton(this.saveButton);
    await responsePromise;
  }

  /**
   * Select option from Ant Design Select
   */
  async selectOption(selectLocator: Locator, optionText: string) {
    await selectLocator.click();
    await this.page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
    await this.page.locator(`.ant-select-item:has-text("${optionText}")`).click();
  }

  /**
   * Search for product
   */
  async searchProduct(searchTerm: string) {
    await this.fillInput(this.searchInput, searchTerm);
    await this.wait(500); // Debounce
    await this.waitForApiResponse('/api/products');
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    await this.productRows.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await this.productRows.count();
  }

  /**
   * Click edit on first product
   */
  async clickEditFirstProduct() {
    await this.clickButton(this.editButton);
    await this.waitForNavigation(/\/dashboard\/products\/\d+/);
  }

  /**
   * Click delete on first product
   */
  async clickDeleteFirstProduct() {
    await this.clickButton(this.deleteButton);
    await this.page.locator('.ant-modal').waitFor({ state: 'visible' });
  }

  /**
   * Confirm delete
   */
  async confirmDelete() {
    const responsePromise = this.waitForApiResponse('/api/products');
    await this.clickButton(this.confirmDeleteButton);
    await responsePromise;
  }

  /**
   * Update product
   */
  async updateProduct(updates: Partial<{
    name: string;
    price: number;
    stockQuantity: number;
  }>) {
    if (updates.name) {
      await this.fillInput(this.nameInput, updates.name);
    }
    if (updates.price) {
      await this.fillInput(this.priceInput, updates.price.toString());
    }
    if (updates.stockQuantity !== undefined) {
      await this.fillInput(this.stockQuantityInput, updates.stockQuantity.toString());
    }

    const responsePromise = this.waitForApiResponse('/api/products');
    await this.clickButton(this.saveButton);
    await responsePromise;
  }

  /**
   * Check if product exists in list
   */
  async productExists(productName: string): Promise<boolean> {
    const productRow = this.page.locator(`tr:has-text("${productName}")`);
    return await this.isVisible(productRow);
  }

  /**
   * Check if on products page
   */
  async isOnProductsPage(): Promise<boolean> {
    return this.page.url().includes('/dashboard/products');
  }
}

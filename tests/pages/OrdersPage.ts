import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * OrdersPage - Page Object Model for Orders management
 * 
 * Handles:
 * - Sales orders list
 * - Purchase orders list
 * - Order creation
 * - Order status updates
 * - Payment processing
 */
export class OrdersPage extends BasePage {
  // Locators for list view
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly orderTable: Locator;
  readonly orderRows: Locator;
  readonly statusFilter: Locator;
  readonly dateFilter: Locator;

  // Locators for form
  readonly customerSelect: Locator;
  readonly orderDatePicker: Locator;
  readonly productSelect: Locator;
  readonly quantityInput: Locator;
  readonly addItemButton: Locator;
  readonly orderItemsTable: Locator;
  readonly notesInput: Locator;
  readonly totalAmount: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Locators for order detail
  readonly orderNumber: Locator;
  readonly orderStatus: Locator;
  readonly updateStatusButton: Locator;
  readonly statusSelect: Locator;
  readonly confirmStatusButton: Locator;
  readonly processPaymentButton: Locator;
  readonly paymentMethodSelect: Locator;
  readonly paymentAmountInput: Locator;
  readonly confirmPaymentButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // List view
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /Orders|Sales Orders|Purchase Orders/ });
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New Order"), button:has-text("Add Order")');
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    this.orderTable = page.locator('.ant-table');
    this.orderRows = page.locator('.ant-table-tbody tr');
    this.statusFilter = page.locator('.ant-select').filter({ has: page.locator('input[placeholder*="Status"]') });
    this.dateFilter = page.locator('.ant-picker');

    // Form fields
    this.customerSelect = page.locator('.ant-select').filter({ has: page.locator('input[name="customerId"]') });
    this.orderDatePicker = page.locator('.ant-picker').filter({ has: page.locator('input[name="orderDate"]') });
    this.productSelect = page.locator('.ant-select').filter({ has: page.locator('input[placeholder*="Product"]') });
    this.quantityInput = page.locator('input[name="quantity"]');
    this.addItemButton = page.locator('button:has-text("Add Item"), button:has-text("Add Product")');
    this.orderItemsTable = page.locator('.ant-table').filter({ hasText: 'Product' });
    this.notesInput = page.locator('textarea[name="notes"]');
    this.totalAmount = page.locator('.total-amount, .ant-statistic').filter({ hasText: 'Total' });
    this.saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create Order")');
    this.cancelButton = page.locator('button:has-text("Cancel")');

    // Order detail
    this.orderNumber = page.locator('.order-number, .ant-descriptions-item').filter({ hasText: 'Order Number' });
    this.orderStatus = page.locator('.order-status, .ant-tag');
    this.updateStatusButton = page.locator('button:has-text("Update Status"), button:has-text("Change Status")');
    this.statusSelect = page.locator('.ant-select').filter({ has: page.locator('input[placeholder*="Status"]') });
    this.confirmStatusButton = page.locator('.ant-modal button:has-text("OK"), .ant-modal button:has-text("Confirm")');
    this.processPaymentButton = page.locator('button:has-text("Process Payment"), button:has-text("Add Payment")');
    this.paymentMethodSelect = page.locator('.ant-select').filter({ has: page.locator('input[name="paymentMethod"]') });
    this.paymentAmountInput = page.locator('input[name="amount"]');
    this.confirmPaymentButton = page.locator('.ant-modal button:has-text("OK"), .ant-modal button:has-text("Confirm")');
  }

  /**
   * Navigate to sales orders page
   */
  async gotoSalesOrders() {
    await super.goto('/dashboard/orders/sales');
  }

  /**
   * Navigate to purchase orders page
   */
  async gotoPurchaseOrders() {
    await super.goto('/dashboard/orders/purchase');
  }

  /**
   * Wait for orders list to load
   */
  async waitForOrdersLoad() {
    await this.waitForApiResponse(/\/api\/orders/);
    await this.orderTable.waitFor({ state: 'visible' });
  }

  /**
   * Click create order button
   */
  async clickCreateOrder() {
    await this.clickButton(this.createButton);
    await this.waitForNavigation(/\/dashboard\/orders\/(sales|purchase)\/new/);
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: {
    customer: string;
    items: Array<{ product: string; quantity: number }>;
    notes?: string;
  }) {
    // Select customer
    await this.selectOption(this.customerSelect, orderData.customer);

    // Add items
    for (const item of orderData.items) {
      await this.selectOption(this.productSelect, item.product);
      await this.fillInput(this.quantityInput, item.quantity.toString());
      await this.clickButton(this.addItemButton);
      await this.wait(500); // Wait for item to be added
    }

    // Add notes if provided
    if (orderData.notes) {
      await this.fillInput(this.notesInput, orderData.notes);
    }

    // Submit form
    const responsePromise = this.waitForApiResponse(/\/api\/orders/);
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
   * Search for order
   */
  async searchOrder(searchTerm: string) {
    await this.fillInput(this.searchInput, searchTerm);
    await this.wait(500); // Debounce
    await this.waitForApiResponse(/\/api\/orders/);
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string) {
    await this.selectOption(this.statusFilter, status);
    await this.waitForApiResponse(/\/api\/orders/);
  }

  /**
   * Click on first order
   */
  async clickFirstOrder() {
    await this.orderRows.first().click();
    await this.waitForNavigation(/\/dashboard\/orders\/(sales|purchase)\/\d+/);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(newStatus: string) {
    await this.clickButton(this.updateStatusButton);
    await this.page.locator('.ant-modal').waitFor({ state: 'visible' });
    await this.selectOption(this.statusSelect, newStatus);
    
    const responsePromise = this.waitForApiResponse(/\/api\/orders/);
    await this.clickButton(this.confirmStatusButton);
    await responsePromise;
  }

  /**
   * Process payment
   */
  async processPayment(paymentData: {
    method: string;
    amount: number;
  }) {
    await this.clickButton(this.processPaymentButton);
    await this.page.locator('.ant-modal').waitFor({ state: 'visible' });
    
    await this.selectOption(this.paymentMethodSelect, paymentData.method);
    await this.fillInput(this.paymentAmountInput, paymentData.amount.toString());
    
    const responsePromise = this.waitForApiResponse(/\/api\/payments/);
    await this.clickButton(this.confirmPaymentButton);
    await responsePromise;
  }

  /**
   * Get order status
   */
  async getOrderStatus(): Promise<string> {
    return await this.getTextContent(this.orderStatus);
  }

  /**
   * Get order count
   */
  async getOrderCount(): Promise<number> {
    await this.orderRows.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await this.orderRows.count();
  }

  /**
   * Check if order exists in list
   */
  async orderExists(orderNumber: string): Promise<boolean> {
    const orderRow = this.page.locator(`tr:has-text("${orderNumber}")`);
    return await this.isVisible(orderRow);
  }

  /**
   * Check if on orders page
   */
  async isOnOrdersPage(): Promise<boolean> {
    return this.page.url().includes('/dashboard/orders');
  }
}

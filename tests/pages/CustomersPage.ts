import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CustomersPage - Page Object Model for Customers management
 * 
 * Handles:
 * - Customer list view
 * - Customer creation
 * - Customer editing
 * - Customer deletion
 * - Customer search and filter
 */
export class CustomersPage extends BasePage {
  // Locators for list view
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly customerTable: Locator;
  readonly customerRows: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;

  // Locators for form
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly countryInput: Locator;
  readonly taxIdInput: Locator;
  readonly typeSelect: Locator;
  readonly statusSelect: Locator;
  readonly notesInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Locators for actions
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly viewButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // List view
    this.pageTitle = page.locator('h1, h2').filter({ hasText: 'Customers' });
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New Customer"), button:has-text("Add Customer")');
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    this.customerTable = page.locator('.ant-table');
    this.customerRows = page.locator('.ant-table-tbody tr');
    this.loadingSpinner = page.locator('.ant-spin');
    this.emptyState = page.locator('.ant-empty');

    // Form fields
    this.nameInput = page.locator('input[name="name"], input#name');
    this.emailInput = page.locator('input[name="email"], input#email');
    this.phoneInput = page.locator('input[name="phone"], input#phone');
    this.addressInput = page.locator('input[name="address"], textarea[name="address"]');
    this.cityInput = page.locator('input[name="city"], input#city');
    this.countryInput = page.locator('input[name="country"], input#country');
    this.taxIdInput = page.locator('input[name="taxId"], input#taxId');
    this.typeSelect = page.locator('.ant-select').filter({ has: page.locator('input[name="type"]') });
    this.statusSelect = page.locator('.ant-select').filter({ has: page.locator('input[name="status"]') });
    this.notesInput = page.locator('textarea[name="notes"], textarea#notes');
    this.saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    this.cancelButton = page.locator('button:has-text("Cancel")');

    // Actions
    this.editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    this.deleteButton = page.locator('button:has-text("Delete")').first();
    this.confirmDeleteButton = page.locator('.ant-modal button:has-text("OK"), .ant-modal button:has-text("Delete")');
    this.viewButton = page.locator('button:has-text("View"), a:has-text("View")').first();
  }

  /**
   * Navigate to customers page
   */
  async goto() {
    await super.goto('/dashboard/customers');
  }

  /**
   * Wait for customers list to load
   */
  async waitForCustomersLoad() {
    await this.waitForApiResponse('/api/customers');
    await this.customerTable.waitFor({ state: 'visible' });
  }

  /**
   * Click create customer button
   */
  async clickCreateCustomer() {
    await this.clickButton(this.createButton);
    await this.waitForNavigation('/dashboard/customers/new');
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    type?: string;
    status?: string;
    notes?: string;
  }) {
    // Fill required fields
    await this.fillInput(this.nameInput, customerData.name);
    await this.fillInput(this.emailInput, customerData.email);
    await this.fillInput(this.phoneInput, customerData.phone);

    // Fill optional fields
    if (customerData.address) {
      await this.fillInput(this.addressInput, customerData.address);
    }
    if (customerData.city) {
      await this.fillInput(this.cityInput, customerData.city);
    }
    if (customerData.country) {
      await this.fillInput(this.countryInput, customerData.country);
    }
    if (customerData.taxId) {
      await this.fillInput(this.taxIdInput, customerData.taxId);
    }
    if (customerData.type) {
      await this.selectOption(this.typeSelect, customerData.type);
    }
    if (customerData.status) {
      await this.selectOption(this.statusSelect, customerData.status);
    }
    if (customerData.notes) {
      await this.fillInput(this.notesInput, customerData.notes);
    }

    // Submit form
    const responsePromise = this.waitForApiResponse('/api/customers');
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
   * Search for customer
   */
  async searchCustomer(searchTerm: string) {
    await this.fillInput(this.searchInput, searchTerm);
    await this.wait(500); // Debounce
    await this.waitForApiResponse('/api/customers');
  }

  /**
   * Get customer count
   */
  async getCustomerCount(): Promise<number> {
    await this.customerRows.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await this.customerRows.count();
  }

  /**
   * Click edit on first customer
   */
  async clickEditFirstCustomer() {
    await this.clickButton(this.editButton);
    await this.waitForNavigation(/\/dashboard\/customers\/\d+/);
  }

  /**
   * Click delete on first customer
   */
  async clickDeleteFirstCustomer() {
    await this.clickButton(this.deleteButton);
    await this.page.locator('.ant-modal').waitFor({ state: 'visible' });
  }

  /**
   * Confirm delete
   */
  async confirmDelete() {
    const responsePromise = this.waitForApiResponse('/api/customers');
    await this.clickButton(this.confirmDeleteButton);
    await responsePromise;
  }

  /**
   * Update customer
   */
  async updateCustomer(updates: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
  }>) {
    if (updates.name) {
      await this.fillInput(this.nameInput, updates.name);
    }
    if (updates.email) {
      await this.fillInput(this.emailInput, updates.email);
    }
    if (updates.phone) {
      await this.fillInput(this.phoneInput, updates.phone);
    }
    if (updates.address) {
      await this.fillInput(this.addressInput, updates.address);
    }

    const responsePromise = this.waitForApiResponse('/api/customers');
    await this.clickButton(this.saveButton);
    await responsePromise;
  }

  /**
   * Check if customer exists in list
   */
  async customerExists(customerName: string): Promise<boolean> {
    const customerRow = this.page.locator(`tr:has-text("${customerName}")`);
    return await this.isVisible(customerRow);
  }

  /**
   * Check if on customers page
   */
  async isOnCustomersPage(): Promise<boolean> {
    return this.page.url().includes('/dashboard/customers');
  }
}

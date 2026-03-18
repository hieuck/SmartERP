import { expect, test } from '@playwright/test';
import { CustomersPage } from '../../pages/CustomersPage';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Customers E2E Tests
 *
 * Covers:
 * 1. List customers with pagination
 * 2. Create customer
 * 3. Edit customer
 * 4. Delete customer
 * 5. Search customers
 * 6. Form validation
 * 7. Empty state
 */
test.describe('Customer Management', () => {
  let loginPage: LoginPage;
  let customersPage: CustomersPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    customersPage = new CustomersPage(page);

    await loginPage.goto();
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');
    await customersPage.goto();
    await customersPage.waitForCustomersLoad();
  });

  test('should display customers list', async ({ page }) => {
    expect(await customersPage.isOnCustomersPage()).toBe(true);
    await expect(customersPage.customerTable).toBeVisible();
    await expect(customersPage.createButton).toBeVisible();
  });

  test('should show pagination controls', async ({ page }) => {
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();
  });

  test('should create a new customer successfully', async ({ page }) => {
    await customersPage.clickCreateCustomer();

    const customerData = {
      name: `Test Customer ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      phone: '0901234567',
      address: '123 Test Street',
      city: 'Ho Chi Minh City',
      country: 'Vietnam',
    };

    await customersPage.createCustomer(customerData);
    await page.waitForURL('/dashboard/customers');

    expect(await customersPage.customerExists(customerData.name)).toBe(true);
  });

  test('should validate required fields on create', async ({ page }) => {
    await customersPage.clickCreateCustomer();
    await customersPage.saveButton.click();

    const errors = page.locator('.ant-form-item-explain-error');
    await expect(errors.first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await customersPage.clickCreateCustomer();
    await customersPage.nameInput.fill('Test Customer');
    await customersPage.emailInput.fill('not-an-email');
    await customersPage.saveButton.click();

    const emailError = page.locator('.ant-form-item-explain-error').filter({ hasText: /email/i });
    await expect(emailError).toBeVisible();
  });

  test('should search customers by name', async ({ page }) => {
    await customersPage.clickCreateCustomer();
    const uniqueName = `SearchTarget ${Date.now()}`;
    await customersPage.createCustomer({
      name: uniqueName,
      email: `search-${Date.now()}@example.com`,
      phone: '0901234567',
    });
    await page.waitForURL('/dashboard/customers');

    await customersPage.searchCustomer(uniqueName);
    await page.waitForTimeout(1000);

    expect(await customersPage.customerExists(uniqueName)).toBe(true);
  });

  test('should show empty state for no search results', async ({ page }) => {
    await customersPage.searchCustomer('NONEXISTENT_CUSTOMER_XYZ_999');
    await page.waitForTimeout(1000);

    const emptyState = page.locator('.ant-empty, [data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
  });

  test('should edit customer successfully', async ({ page }) => {
    await customersPage.clickCreateCustomer();
    const originalName = `EditTarget ${Date.now()}`;
    await customersPage.createCustomer({
      name: originalName,
      email: `edit-${Date.now()}@example.com`,
      phone: '0901234567',
    });
    await page.waitForURL('/dashboard/customers');

    await customersPage.searchCustomer(originalName);
    await page.waitForTimeout(1000);
    await customersPage.clickEditFirstCustomer();

    const updatedName = `${originalName} Updated`;
    await customersPage.updateCustomer({ name: updatedName });
    await page.waitForURL('/dashboard/customers');

    expect(await customersPage.customerExists(updatedName)).toBe(true);
  });

  test('should delete customer successfully', async ({ page }) => {
    await customersPage.clickCreateCustomer();
    const name = `DeleteTarget ${Date.now()}`;
    await customersPage.createCustomer({
      name,
      email: `delete-${Date.now()}@example.com`,
      phone: '0901234567',
    });
    await page.waitForURL('/dashboard/customers');

    await customersPage.searchCustomer(name);
    await page.waitForTimeout(1000);

    const countBefore = await customersPage.getCustomerCount();
    await customersPage.clickDeleteFirstCustomer();
    await customersPage.confirmDelete();
    await page.waitForTimeout(1000);

    const countAfter = await customersPage.getCustomerCount();
    expect(countAfter).toBe(countBefore - 1);
    expect(await customersPage.customerExists(name)).toBe(false);
  });

  test('should cancel customer creation', async ({ page }) => {
    await customersPage.clickCreateCustomer();
    await customersPage.nameInput.fill('Will Not Save');
    await customersPage.cancelButton.click();

    await page.waitForURL('/dashboard/customers');
    expect(await customersPage.isOnCustomersPage()).toBe(true);
  });

  test('should handle API error gracefully', async ({ page }) => {
    await page.route('**/api/customers*', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/dashboard/customers');
    await page.waitForTimeout(2000);

    const errorEl = page.locator(
      '.ant-message-error, .ant-notification-notice-error, .ant-alert-error',
    );
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });
});

/**
 * Test Data Helper
 * Generates test data for E2E tests
 */

/**
 * Generate unique test user data
 */
export function generateTestUser() {
  const timestamp = Date.now();
  return {
    companyName: `Test Company ${timestamp}`,
    fullName: 'Nguyen Van Test',
    email: `test${timestamp}@example.com`,
    phone: '0912345678',
    password: 'Test123!@#',
  };
}

/**
 * Generate unique product data
 */
export function generateTestProduct() {
  const timestamp = Date.now();
  return {
    sku: `SKU-${timestamp}`,
    name: `Test Product ${timestamp}`,
    salePrice: '100000',
    costPrice: '80000',
    stock: '100',
    category: 'Electronics',
    description: 'Test product description',
  };
}

/**
 * Generate unique customer data
 */
export function generateTestCustomer() {
  const timestamp = Date.now();
  return {
    name: `Test Customer ${timestamp}`,
    email: `customer${timestamp}@example.com`,
    phone: '0987654321',
    address: '123 Test Street, Test City',
  };
}

/**
 * Generate unique order data
 */
export function generateTestOrder() {
  const timestamp = Date.now();
  return {
    customerName: `Customer ${timestamp}`,
    productName: `Product ${timestamp}`,
    quantity: 5,
    notes: 'Test order notes',
  };
}

/**
 * Wait for a specific amount of time
 * @param ms - Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random number between min and max
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

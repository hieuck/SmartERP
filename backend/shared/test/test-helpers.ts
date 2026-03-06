/**
 * Test Helper Utilities
 * Common helper functions for testing
 */

/**
 * Generate unique test identifier
 * Useful for preventing data conflicts in parallel tests
 */
export function generateTestId(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Wait for a condition to be true
 * Useful for async operations in tests
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await sleep(interval);
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock request object for testing controllers
 */
export function createMockRequest(overrides?: any): any {
  return {
    user: {
      id: 'test-user-001',
      tenantId: 'test-tenant-001',
      role: 'admin',
    },
    headers: {},
    query: {},
    params: {},
    body: {},
    ...overrides,
  };
}

/**
 * Create mock response object for testing controllers
 */
export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.message) return error.response.message;
  return 'Unknown error';
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
}

/**
 * Create a spy on console methods to suppress logs during tests
 */
export function suppressConsoleLogs(): { restore: () => void } {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();

  return {
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}

/**
 * Deep clone an object (useful for test data)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Compare two objects for equality (ignoring specific fields)
 */
export function objectsEqualIgnoring(
  obj1: any,
  obj2: any,
  ignoreFields: string[] = ['createdAt', 'updatedAt', 'id']
): boolean {
  const filtered1 = { ...obj1 };
  const filtered2 = { ...obj2 };

  ignoreFields.forEach(field => {
    delete filtered1[field];
    delete filtered2[field];
  });

  return JSON.stringify(filtered1) === JSON.stringify(filtered2);
}

/**
 * Generate random Vietnamese phone number
 */
export function generateVietnamesePhone(): string {
  const prefixes = ['090', '091', '093', '094', '097', '098', '099'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return prefix + suffix;
}

/**
 * Generate random Vietnamese name
 */
export function generateVietnameseName(): string {
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
  const middleNames = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Anh', 'Quốc', 'Thanh'];
  const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hà', 'Hùng', 'Linh', 'Mai', 'Nam', 'Phương'];

  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];

  return `${lastName} ${middleName} ${firstName}`;
}

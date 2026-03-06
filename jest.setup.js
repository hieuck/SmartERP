/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.TEST_DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'erp_test';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test utilities
global.testHelpers = {
  generateTestId: (prefix = 'test') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  },
};

// Mock Date.now() for consistent timestamps in tests (optional)
// Uncomment if you need consistent timestamps
// const mockDate = new Date('2024-01-01T00:00:00.000Z');
// global.Date.now = jest.fn(() => mockDate.getTime());

console.log('✅ Jest setup complete');

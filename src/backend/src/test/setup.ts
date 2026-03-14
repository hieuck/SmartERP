/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/smart_erp_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  tenantId: 'test-tenant-id',
  role: 'admin',
  permissions: ['*'],
};

export const mockTenant = {
  id: 'test-tenant-id',
  name: 'Test Company',
  status: 'active',
  subscriptionPlan: 'professional',
};

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

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
global.testUtils = {
  // Generate random email for testing
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
  
  // Generate random string
  randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  // Clear caches
  // Cleanup resources
  await new Promise(resolve => setTimeout(resolve, 500));
});

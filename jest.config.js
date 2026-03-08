module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/backend', '<rootDir>/frontend', '<rootDir>/shared'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    '!**/*.e2e.spec.ts', // Exclude E2E tests from unit test runs
    '!**/*.integration.spec.ts', // Exclude integration tests from unit test runs
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'backend/*/src/**/*.ts',
    'frontend/src/**/*.{ts,tsx}',
    'shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/*.e2e.spec.ts',
    '!**/*.integration.spec.ts',
    '!**/main.ts',
    '!**/*.module.ts',
    '!**/*.entity.ts',
    '!**/index.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    // Critical: Security & Permission (MUST be 100%)
    './src/backend/common/security/**/*.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    // High Priority: Services & Controllers (85%)
    './src/backend/domains/*/services/**/*.ts': {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
    './src/backend/domains/*/controllers/**/*.ts': {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
    // Medium Priority: Entities (80%)
    './src/backend/domains/*/entities/**/*.ts': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    // Utilities (90% - should be pure functions)
    './src/backend/common/utils/**/*.ts': {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
    // Shared code (85% - used across modules)
    './src/shared/**/*.ts': {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'html', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  maxWorkers: '50%', // Use 50% of available CPU cores for parallel execution
  verbose: true,
  bail: false, // Don't stop on first failure in CI
};

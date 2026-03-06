module.exports = {
  displayName: 'security-tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.security.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/node_modules/**', '!**/dist/**'],
  coverageDirectory: './coverage',
  testTimeout: 30000,
  verbose: true,
  bail: false,
  maxWorkers: 1, // Run tests sequentially to avoid rate limiting issues
};

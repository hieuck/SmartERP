module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.api.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../../src/$1',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../../coverage-api',
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
  bail: false, // Continue running tests even if some fail
  verbose: true,
};

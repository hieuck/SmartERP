import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for SmartERP
 * 
 * Features:
 * - Multiple browsers (chromium, firefox, webkit)
 * - Screenshot on failure
 * - Video recording on failure
 * - Retry logic for flaky tests
 * - Parallel execution
 * - Trace on first retry
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 60_000,
  
  // Maximum time for expect() assertions
  expect: {
    timeout: 10_000,
  },
  
  // Run tests sequentially to prevent worker hanging (e2e-testing best practice)
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Single worker for clean exit (e2e-testing best practice)
  workers: 1,
  
  // Global teardown for cleanup
  globalTeardown: './tests/global-teardown.ts',
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-results.json' }],
    ['junit', { outputFile: 'playwright-results.xml' }],
    ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 10_000,
    
    // Navigation timeout
    navigationTimeout: 30_000,
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Locale
    locale: 'en-US',
    
    // Timezone
    timezoneId: 'Asia/Ho_Chi_Minh',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific settings
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: './src/frontend',
  },
});

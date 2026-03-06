import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-ui',
  fullyParallel: false, // Run sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid conflicts
  reporter: [
    ['html', { outputFolder: 'playwright-report-ui' }],
    ['list'],
  ],
  
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start servers before running tests
  webServer: [
    {
      command: 'cd ../.. && cd backend/monolith-app && npm run dev',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'cd ../.. && cd frontend && npm run dev',
      url: 'http://localhost:5175',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});

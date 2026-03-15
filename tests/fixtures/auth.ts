import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Authentication Fixtures
 * 
 * Provides authenticated context for tests that require login
 * 
 * Usage:
 * import { test } from '../fixtures/auth';
 * 
 * test('my test', async ({ authenticatedPage }) => {
 *   // Already logged in
 * });
 */

type AuthFixtures = {
  authenticatedPage: Page;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

/**
 * Test credentials
 */
export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
  },
  user: {
    email: 'user@test.com',
    password: 'user123',
  },
  manager: {
    email: 'manager@test.com',
    password: 'manager123',
  },
};

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Authenticated page fixture
   * Automatically logs in before each test
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    
    // Navigate to login page
    await loginPage.goto();
    
    // Login with admin credentials
    await loginPage.login(
      TEST_CREDENTIALS.admin.email,
      TEST_CREDENTIALS.admin.password
    );
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Use the authenticated page
    await use(page);
    
    // Cleanup: logout after test
    try {
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), span:has-text("Logout")');
      if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
      }
    } catch {
      // Ignore logout errors
    }
  },

  /**
   * LoginPage fixture
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * DashboardPage fixture
   */
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper function to login with specific credentials
 */
export async function loginAs(
  page: Page,
  role: 'admin' | 'user' | 'manager'
) {
  const loginPage = new LoginPage(page);
  const credentials = TEST_CREDENTIALS[role];
  
  await loginPage.goto();
  await loginPage.login(credentials.email, credentials.password);
  await page.waitForURL('/dashboard');
}

/**
 * Helper function to logout
 */
export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), span:has-text("Logout")');
  await logoutButton.click();
  await page.waitForURL('/login');
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check if auth token exists in localStorage
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Helper function to clear authentication
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
  });
}

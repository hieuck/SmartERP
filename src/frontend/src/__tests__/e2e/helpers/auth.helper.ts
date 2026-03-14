import { Page } from '@playwright/test';

/**
 * Authentication Helper
 * Provides reusable authentication functions for E2E tests
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export const DEFAULT_CREDENTIALS: LoginCredentials = {
  email: 'admin@test.com',
  password: 'admin123',
};

/**
 * Login to the application
 * @param page - Playwright page object
 * @param credentials - Login credentials (defaults to admin account)
 */
export async function login(
  page: Page,
  credentials: LoginCredentials = DEFAULT_CREDENTIALS,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(credentials.email);
  await page.getByLabel(/mật khẩu|password/i).fill(credentials.password);
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  
  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Logout from the application
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  const logoutButton = page.getByRole('button', { name: /đăng xuất|logout/i });
  await logoutButton.click();
  
  // Wait for navigation to login
  await page.waitForURL(/\/login/, { timeout: 5000 });
}

/**
 * Check if user is authenticated
 * @param page - Playwright page object
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  return url.includes('/dashboard');
}

/**
 * Register a new user
 * @param page - Playwright page object
 * @param userData - User registration data
 */
export async function register(
  page: Page,
  userData: {
    companyName: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
  },
): Promise<void> {
  await page.goto('/register');
  
  await page.getByLabel(/tên công ty/i).fill(userData.companyName);
  await page.getByLabel(/họ và tên/i).fill(userData.fullName);
  await page.getByLabel(/email/i).fill(userData.email);
  await page.getByLabel(/số điện thoại/i).fill(userData.phone);
  await page.getByLabel(/^mật khẩu$/i).fill(userData.password);
  await page.getByLabel(/xác nhận mật khẩu/i).fill(userData.password);
  await page.getByText(/tôi đồng ý với/i).click();
  
  await page.getByRole('button', { name: /đăng ký miễn phí/i }).click();
  
  // Wait for success
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

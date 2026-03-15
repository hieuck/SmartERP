import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

/**
 * Authentication Flow E2E Tests
 * 
 * Test cases:
 * 1. User can login with valid credentials
 * 2. User cannot login with invalid credentials
 * 3. User sees error message for invalid email format
 * 4. User sees error message for missing password
 * 5. Remember me functionality works
 * 6. User can logout
 */
test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('should display login page correctly', async ({ page }) => {
    // Verify page title
    const title = await loginPage.getPageTitle();
    expect(title).toContain('Login');

    // Verify form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Login with valid credentials
    await loginPage.login('admin@test.com', 'admin123');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Verify on dashboard page
    expect(await dashboardPage.isOnDashboardPage()).toBe(true);

    // Verify dashboard loads correctly
    const pageTitle = await dashboardPage.getPageTitle();
    expect(pageTitle).toContain('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Login with invalid credentials
    await loginPage.login('admin@test.com', 'wrongpassword');

    // Verify error message is displayed
    expect(await loginPage.hasError()).toBe(true);

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toContain('invalid');

    // Verify still on login page
    expect(await loginPage.isOnLoginPage()).toBe(true);
  });

  test('should show error for invalid email format', async ({ page }) => {
    // Fill invalid email
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('password123');
    await loginPage.submitButton.click();

    // Verify validation error (Ant Design form validation)
    const emailError = page.locator('.ant-form-item-explain-error').first();
    await expect(emailError).toBeVisible();
    expect(await emailError.textContent()).toContain('email');
  });

  test('should show error for missing password', async ({ page }) => {
    // Fill email only
    await loginPage.emailInput.fill('admin@test.com');
    await loginPage.submitButton.click();

    // Verify validation error
    const passwordError = page.locator('.ant-form-item-explain-error').filter({ hasText: 'password' });
    await expect(passwordError).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    // Fill short password
    await loginPage.emailInput.fill('admin@test.com');
    await loginPage.passwordInput.fill('12345');
    await loginPage.submitButton.click();

    // Verify validation error
    const passwordError = page.locator('.ant-form-item-explain-error').filter({ hasText: /password|6/ });
    await expect(passwordError).toBeVisible();
  });

  test('should disable submit button while loading', async ({ page }) => {
    // Start login
    await loginPage.emailInput.fill('admin@test.com');
    await loginPage.passwordInput.fill('admin123');
    
    // Click submit and immediately check if disabled
    const submitPromise = loginPage.submitButton.click();
    
    // Button should be disabled during API call
    await expect(loginPage.submitButton).toBeDisabled();
    
    await submitPromise;
  });

  test('should remember email when remember me is checked', async ({ page, context }) => {
    // Login with remember me
    await loginPage.login('admin@test.com', 'admin123', true);

    // Wait for redirect
    await page.waitForURL('/dashboard');

    // Logout (navigate back to login)
    await page.goto('/login');

    // Verify email is remembered
    const emailValue = await loginPage.emailInput.inputValue();
    expect(emailValue).toBe('admin@test.com');
  });

  test('should not remember email when remember me is unchecked', async ({ page, context }) => {
    // Clear any remembered email first
    await page.evaluate(() => localStorage.removeItem('rememberedEmail'));

    // Login without remember me
    await loginPage.login('admin@test.com', 'admin123', false);

    // Wait for redirect
    await page.waitForURL('/dashboard');

    // Logout (navigate back to login)
    await page.goto('/login');

    // Verify email is not remembered
    const emailValue = await loginPage.emailInput.inputValue();
    expect(emailValue).toBe('');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await loginPage.login('admin@test.com', 'admin123');
    await page.waitForURL('/dashboard');

    // Click logout button (in header/menu)
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), span:has-text("Logout")');
    await logoutButton.click();

    // Wait for redirect to login
    await page.waitForURL('/login');

    // Verify on login page
    expect(await loginPage.isOnLoginPage()).toBe(true);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login');
    expect(await loginPage.isOnLoginPage()).toBe(true);
  });

  test('should handle network error gracefully', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);

    // Try to login
    await loginPage.emailInput.fill('admin@test.com');
    await loginPage.passwordInput.fill('admin123');
    await loginPage.submitButton.click();

    // Wait a bit for error to show
    await page.waitForTimeout(2000);

    // Verify error message is shown
    expect(await loginPage.hasError()).toBe(true);

    // Restore online
    await context.setOffline(false);
  });
});

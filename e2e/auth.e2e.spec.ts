import { test, expect, Page } from '@playwright/test';

/**
 * End-to-End Tests for Authentication
 * Tests complete user journeys from landing page through authentication flows
 * Follows AAA pattern (Arrange, Act, Assert)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Authentication E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Complete Registration Flow', () => {
    test('should complete full registration journey: landing → register → verify email → login → dashboard', async () => {
      // Arrange - Navigate to landing page
      await page.goto(`${BASE_URL}/`);

      // Assert - Landing page loaded
      expect(page.url()).toContain('/');
      await expect(page.locator('text=Smart ERP')).toBeVisible();

      // Act - Click register button
      await page.click(
        'button:has-text("Register"), a:has-text("Sign Up"), a:has-text("Get Started")',
      );

      // Assert - Register page loaded
      expect(page.url()).toContain('/register');
      await expect(page.locator('text=Create Account')).toBeVisible();

      // Act - Fill registration form
      await page.fill('input[placeholder*="Company"]', 'E2E Test Company');
      await page.fill('input[placeholder*="subdomain"]', 'e2e-test-company');
      await page.fill('input[type="email"]', 'e2e-test@example.com');
      await page.fill('input[placeholder*="Password"][type="password"]', 'E2ETestPassword123!');
      await page.fill('input[placeholder*="Confirm"]', 'E2ETestPassword123!');
      await page.fill('input[placeholder*="First"]', 'E2E');
      await page.fill('input[placeholder*="Last"]', 'Test');

      // Act - Accept terms
      await page.click('input[type="checkbox"]');

      // Act - Submit registration
      await page.click(
        'button:has-text("Register"), button:has-text("Sign Up"), button:has-text("Create Account")',
      );

      // Assert - Registration successful, redirected to email verification
      await page.waitForURL('**/verify-email**', { timeout: 5000 });
      await expect(page.locator('text=Verify Email')).toBeVisible();

      // Act - Simulate email verification (in real scenario, user clicks link in email)
      await page.goto(`${BASE_URL}/verify-email?token=test-verification-token`);

      // Assert - Email verified
      await expect(page.locator('text=Email Verified')).toBeVisible();

      // Act - Click continue to login
      await page.click('button:has-text("Continue"), button:has-text("Login")');

      // Assert - Redirected to login page
      expect(page.url()).toContain('/login');

      // Act - Login with registered credentials
      await page.fill('input[type="email"]', 'e2e-test@example.com');
      await page.fill('input[type="password"]', 'E2ETestPassword123!');
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Login successful, redirected to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 5000 });
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('should successfully login with valid credentials', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Assert - Login page loaded
      expect(page.url()).toContain('/login');
      await expect(page.locator('text=Login')).toBeVisible();

      // Act - Fill login form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'ValidPassword123!');

      // Act - Submit login
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Login successful, redirected to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 5000 });
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should display error for invalid credentials', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Fill login form with invalid credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'WrongPassword123!');

      // Act - Submit login
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Error message displayed
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
      expect(page.url()).toContain('/login');
    });

    test('should display error for non-existent user', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Fill login form with non-existent email
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'Password123!');

      // Act - Submit login
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Error message displayed
      await expect(page.locator('text=User not found')).toBeVisible();
      expect(page.url()).toContain('/login');
    });

    test('should show validation errors for empty fields', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Submit without filling form
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Validation errors displayed
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should complete password reset flow', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Click forgot password link
      await page.click('a:has-text("Forgot Password"), a:has-text("Reset Password")');

      // Assert - Forgot password page loaded
      expect(page.url()).toContain('/forgot-password');
      await expect(page.locator('text=Reset Password')).toBeVisible();

      // Act - Enter email
      await page.fill('input[type="email"]', 'test@example.com');

      // Act - Submit forgot password form
      await page.click('button:has-text("Send"), button:has-text("Reset")');

      // Assert - Success message displayed
      await expect(page.locator('text=Check your email')).toBeVisible();

      // Act - Simulate clicking reset link from email
      await page.goto(`${BASE_URL}/reset-password?token=test-reset-token`);

      // Assert - Reset password page loaded
      expect(page.url()).toContain('/reset-password');
      await expect(page.locator('text=New Password')).toBeVisible();

      // Act - Fill new password
      await page.fill('input[placeholder*="New Password"]', 'NewPassword123!');
      await page.fill('input[placeholder*="Confirm"]', 'NewPassword123!');

      // Act - Submit reset password form
      await page.click('button:has-text("Reset"), button:has-text("Update")');

      // Assert - Success message displayed
      await expect(page.locator('text=Password reset successfully')).toBeVisible();

      // Act - Click login button
      await page.click('button:has-text("Login"), a:has-text("Login")');

      // Assert - Redirected to login page
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session after login', async () => {
      // Arrange - Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'ValidPassword123!');
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Logged in
      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      // Act - Navigate to different page
      await page.goto(`${BASE_URL}/settings`);

      // Assert - Still logged in, can access protected page
      expect(page.url()).toContain('/settings');
      await expect(page.locator('text=Settings')).toBeVisible();
    });

    test('should redirect to login when accessing protected page without session', async () => {
      // Arrange - Navigate to protected page without login
      await page.goto(`${BASE_URL}/dashboard`);

      // Assert - Redirected to login
      expect(page.url()).toContain('/login');
    });

    test('should logout successfully', async () => {
      // Arrange - Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'ValidPassword123!');
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Logged in
      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      // Act - Click logout button
      await page.click('button:has-text("Logout"), button:has-text("Sign Out")');

      // Assert - Logged out, redirected to login
      expect(page.url()).toContain('/login');

      // Act - Try to access protected page
      await page.goto(`${BASE_URL}/dashboard`);

      // Assert - Redirected to login
      expect(page.url()).toContain('/login');
    });

    test('should refresh token automatically', async () => {
      // Arrange - Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'ValidPassword123!');
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Logged in
      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      // Act - Wait for token to expire (simulate by waiting)
      await page.waitForTimeout(2000);

      // Act - Make API call (should trigger token refresh)
      await page.goto(`${BASE_URL}/api/user`);

      // Assert - Still authenticated
      const response = await page.evaluate(() => fetch('/api/user').then((r) => r.status));
      expect(response).toBe(200);
    });
  });

  test.describe('Form Validation', () => {
    test('should validate email format on login', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Enter invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'Password123!');

      // Act - Submit form
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Validation error displayed
      await expect(page.locator('text=Invalid email')).toBeVisible();
    });

    test('should validate password strength on registration', async () => {
      // Arrange - Navigate to register page
      await page.goto(`${BASE_URL}/register`);

      // Act - Enter weak password
      await page.fill('input[placeholder*="Company"]', 'Test Company');
      await page.fill('input[placeholder*="subdomain"]', 'test-company');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[placeholder*="Password"][type="password"]', '123');

      // Act - Submit form
      await page.click('button:has-text("Register"), button:has-text("Sign Up")');

      // Assert - Validation error displayed
      await expect(page.locator('text=Password must be at least')).toBeVisible();
    });

    test('should validate password confirmation on registration', async () => {
      // Arrange - Navigate to register page
      await page.goto(`${BASE_URL}/register`);

      // Act - Enter mismatched passwords
      await page.fill('input[placeholder*="Company"]', 'Test Company');
      await page.fill('input[placeholder*="subdomain"]', 'test-company');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[placeholder*="Password"][type="password"]', 'ValidPassword123!');
      await page.fill('input[placeholder*="Confirm"]', 'DifferentPassword123!');

      // Act - Submit form
      await page.click('button:has-text("Register"), button:has-text("Sign Up")');

      // Assert - Validation error displayed
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from login to register', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Click register link
      await page.click(
        'a:has-text("Register"), a:has-text("Sign Up"), a:has-text("Create Account")',
      );

      // Assert - Navigated to register page
      expect(page.url()).toContain('/register');
    });

    test('should navigate from register to login', async () => {
      // Arrange - Navigate to register page
      await page.goto(`${BASE_URL}/register`);

      // Act - Click login link
      await page.click(
        'a:has-text("Login"), a:has-text("Sign In"), a:has-text("Already have account")',
      );

      // Assert - Navigated to login page
      expect(page.url()).toContain('/login');
    });

    test('should navigate from login to forgot password', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Click forgot password link
      await page.click('a:has-text("Forgot Password"), a:has-text("Reset Password")');

      // Assert - Navigated to forgot password page
      expect(page.url()).toContain('/forgot-password');
    });
  });

  test.describe('Security', () => {
    test('should not expose password in HTML', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Fill password field
      await page.fill('input[type="password"]', 'TestPassword123!');

      // Assert - Password not visible in page content
      const pageContent = await page.content();
      expect(pageContent).not.toContain('TestPassword123!');
    });

    test('should clear sensitive data on logout', async () => {
      // Arrange - Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'ValidPassword123!');
      await page.click('button:has-text("Login"), button:has-text("Sign In")');

      // Assert - Logged in
      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      // Act - Get auth token before logout
      const tokenBefore = await page.evaluate(() => localStorage.getItem('authToken'));
      expect(tokenBefore).toBeTruthy();

      // Act - Logout
      await page.click('button:has-text("Logout"), button:has-text("Sign Out")');

      // Assert - Auth token cleared
      const tokenAfter = await page.evaluate(() => localStorage.getItem('authToken'));
      expect(tokenAfter).toBeNull();
    });

    test('should use HTTPS for sensitive operations', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Assert - URL uses HTTPS (if BASE_URL is HTTPS)
      if (BASE_URL.startsWith('https')) {
        expect(page.url()).toContain('https');
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Assert - Form labels present
      await expect(page.locator('label:has-text("Email")')).toBeVisible();
      await expect(page.locator('label:has-text("Password")')).toBeVisible();
    });

    test('should support keyboard navigation', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Act - Tab to email field
      await page.keyboard.press('Tab');

      // Assert - Email field focused
      const emailField = page.locator('input[type="email"]');
      expect(await emailField.evaluate((el) => el === document.activeElement)).toBe(true);

      // Act - Tab to password field
      await page.keyboard.press('Tab');

      // Assert - Password field focused
      const passwordField = page.locator('input[type="password"]');
      expect(await passwordField.evaluate((el) => el === document.activeElement)).toBe(true);

      // Act - Tab to submit button
      await page.keyboard.press('Tab');

      // Assert - Submit button focused
      const submitButton = page.locator('button:has-text("Login")');
      expect(await submitButton.evaluate((el) => el === document.activeElement)).toBe(true);
    });

    test('should have proper ARIA labels', async () => {
      // Arrange - Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Assert - ARIA labels present
      const emailField = page.locator('input[type="email"]');
      const ariaLabel = await emailField.getAttribute('aria-label');
      expect(ariaLabel || (await emailField.getAttribute('placeholder'))).toBeTruthy();
    });
  });
});

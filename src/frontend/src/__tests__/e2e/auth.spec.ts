import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * Tests complete user registration and login journey
 * 
 * Test Coverage:
 * - Registration with full validation
 * - Login with various scenarios
 * - Session management
 * - Protected route access
 * - Error handling
 */

// Test data generator
const generateTestUser = () => {
  const timestamp = Date.now();
  return {
    companyName: `Test Company ${timestamp}`,
    fullName: 'Nguyen Van Test',
    email: `test${timestamp}@example.com`,
    phone: '0912345678',
    password: 'Test123!@#',
  };
};

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Smart ERP/i);
    
    // Verify all form fields are visible
    await expect(page.getByLabel(/tên công ty/i)).toBeVisible();
    await expect(page.getByLabel(/tên miền/i)).toBeVisible();
    await expect(page.getByLabel(/họ và tên/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/số điện thoại/i)).toBeVisible();
    await expect(page.getByLabel(/^mật khẩu$/i)).toBeVisible();
    await expect(page.getByLabel(/xác nhận mật khẩu/i)).toBeVisible();
    
    // Verify submit button
    await expect(page.getByRole('button', { name: /đăng ký miễn phí/i })).toBeVisible();
    
    // Verify terms checkbox
    await expect(page.getByText(/tôi đồng ý với/i)).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /đăng ký miễn phí/i }).click();

    // Should show validation messages
    await expect(page.locator('text=/vui lòng nhập tên công ty/i')).toBeVisible();
    await expect(page.locator('text=/vui lòng nhập họ tên/i')).toBeVisible();
    await expect(page.locator('text=/vui lòng nhập email/i')).toBeVisible();
    await expect(page.locator('text=/vui lòng nhập số điện thoại/i')).toBeVisible();
    await expect(page.locator('text=/vui lòng nhập mật khẩu/i')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/email/i).blur();

    // Should show email validation error
    await expect(page.locator('text=/email không hợp lệ/i')).toBeVisible();
  });

  test('should show validation error for invalid phone format', async ({ page }) => {
    await page.getByLabel(/số điện thoại/i).fill('123');
    await page.getByLabel(/số điện thoại/i).blur();

    // Should show phone validation error
    await expect(page.locator('text=/số điện thoại không hợp lệ/i')).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.getByLabel(/^mật khẩu$/i).fill('weak');
    await page.getByLabel(/^mật khẩu$/i).blur();

    // Should show password validation errors
    await expect(page.locator('text=/mật khẩu phải có ít nhất 8 ký tự/i')).toBeVisible();
  });

  test('should show validation error for password without uppercase', async ({ page }) => {
    await page.getByLabel(/^mật khẩu$/i).fill('test1234');
    await page.getByLabel(/^mật khẩu$/i).blur();

    // Should show password strength validation error
    await expect(page.locator('text=/mật khẩu phải chứa ít nhất một chữ hoa/i')).toBeVisible();
  });

  test('should show validation error for mismatched password confirmation', async ({ page }) => {
    await page.getByLabel(/^mật khẩu$/i).fill('Test123!@#');
    await page.getByLabel(/xác nhận mật khẩu/i).fill('Different123!@#');
    await page.getByLabel(/xác nhận mật khẩu/i).blur();

    // Should show password mismatch error
    await expect(page.locator('text=/mật khẩu xác nhận không khớp/i')).toBeVisible();
  });

  test('should show validation error when terms not accepted', async ({ page }) => {
    const user = generateTestUser();

    // Fill all fields but don't check terms
    await page.getByLabel(/tên công ty/i).fill(user.companyName);
    await page.getByLabel(/họ và tên/i).fill(user.fullName);
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/số điện thoại/i).fill(user.phone);
    await page.getByLabel(/^mật khẩu$/i).fill(user.password);
    await page.getByLabel(/xác nhận mật khẩu/i).fill(user.password);

    // Try to submit
    await page.getByRole('button', { name: /đăng ký miễn phí/i }).click();

    // Should show terms validation error
    await expect(page.locator('text=/vui lòng đồng ý với điều khoản/i')).toBeVisible();
  });

  test('should auto-generate slug from company name', async ({ page }) => {
    // Type company name with Vietnamese characters and spaces
    const companyInput = page.getByLabel(/tên công ty/i);
    await companyInput.fill('Công Ty TNHH ABC XYZ');
    
    // Trigger blur to ensure onChange fires
    await companyInput.blur();
    
    // Wait for React to update state
    await page.waitForTimeout(500);

    // Slug should be auto-generated
    const slugInput = page.getByLabel(/tên miền/i);
    await expect(slugInput).toHaveValue(/cong-ty-tnhh-abc-xyz/i, { timeout: 2000 });
  });

  test('should register successfully with valid data', async ({ page }) => {
    const user = generateTestUser();

    // Fill registration form
    await page.getByLabel(/tên công ty/i).fill(user.companyName);
    await page.getByLabel(/họ và tên/i).fill(user.fullName);
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/số điện thoại/i).fill(user.phone);
    await page.getByLabel(/^mật khẩu$/i).fill(user.password);
    await page.getByLabel(/xác nhận mật khẩu/i).fill(user.password);
    
    // Accept terms
    await page.getByText(/tôi đồng ý với/i).click();

    // Submit form
    await page.getByRole('button', { name: /đăng ký miễn phí/i }).click();

    // Should redirect to dashboard (no success message check - Ant Design message.success() not reliable for E2E)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    
    // Verify dashboard loaded
    await expect(page.getByRole('heading', { name: /dashboard/i }).first()).toBeVisible();
  });

  test('should show error for duplicate email registration', async ({ page }) => {
    // Use a known existing email (from demo account)
    await page.getByLabel(/tên công ty/i).fill('Test Company');
    await page.getByLabel(/họ và tên/i).fill('Test User');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/số điện thoại/i).fill('0912345678');
    await page.getByLabel(/^mật khẩu$/i).fill('Test123!@#');
    await page.getByLabel(/xác nhận mật khẩu/i).fill('Test123!@#');
    await page.getByText(/tôi đồng ý với/i).click();

    // Submit form
    await page.getByRole('button', { name: /đăng ký miễn phí/i }).click();

    // Should show error message (check for Alert component)
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /đăng nhập/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });
});

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page with all elements', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Smart ERP/i);
    
    // Verify form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mật khẩu/i)).toBeVisible();
    await expect(page.getByText(/ghi nhớ đăng nhập/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /quên mật khẩu/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible();
    
    // Verify demo credentials card
    await expect(page.locator('text=/tài khoản demo/i')).toBeVisible();
    await expect(page.locator('text=/admin@test.com/i')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Should show validation messages
    await expect(page.locator('text=/vui lòng nhập email/i')).toBeVisible();
    await expect(page.locator('text=/vui lòng nhập mật khẩu/i')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/email/i).blur();

    // Should show email validation error
    await expect(page.locator('text=/email không hợp lệ/i')).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.getByLabel(/mật khẩu/i).fill('12345');
    await page.getByLabel(/mật khẩu/i).blur();

    // Should show password length validation error
    await expect(page.locator('text=/mật khẩu phải có ít nhất 6 ký tự/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/mật khẩu/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Should show error message (check for Alert component or error text)
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form with demo credentials
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/mật khẩu/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Verify dashboard content is visible (use first() to avoid strict mode violation)
    await expect(page.getByRole('heading', { name: /dashboard/i }).first()).toBeVisible();
  });

  test('should remember email when "remember me" is checked', async ({ page }) => {
    const testEmail = 'remember@test.com';

    // Check remember me and login
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/mật khẩu/i).fill('Test123!@#');
    await page.getByText(/ghi nhớ đăng nhập/i).click();
    
    // Note: This will fail login but should save email
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    
    // Wait for error
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();

    // Email should be pre-filled
    await expect(page.getByLabel(/email/i)).toHaveValue(testEmail);
  });

  test('should have link to registration page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /đăng ký ngay/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
  });
});

test.describe('Session Management', () => {
  test('should persist session after page reload', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/mật khẩu/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /dashboard/i }).first()).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/mật khẩu/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Click user avatar dropdown to open menu
    await page.locator('.ant-dropdown-trigger').click();
    
    // Wait for dropdown menu to appear
    await page.waitForTimeout(500);
    
    // Click logout menu item
    await page.getByText(/đăng xuất/i).click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/dashboard/products');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should redirect authenticated user from login to dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/mật khẩu/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Try to go back to login page
    await page.goto('/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect authenticated user from register to dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/mật khẩu/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Try to go to register page
    await page.goto('/register');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Complete User Journey', () => {
  test('should complete full registration and login flow', async ({ page }) => {
    const user = generateTestUser();

    // Step 1: Register new account
    await page.goto('/register');
    await page.getByLabel(/tên công ty/i).fill(user.companyName);
    await page.getByLabel(/họ và tên/i).fill(user.fullName);
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/số điện thoại/i).fill(user.phone);
    await page.getByLabel(/^mật khẩu$/i).fill(user.password);
    await page.getByLabel(/xác nhận mật khẩu/i).fill(user.password);
    await page.getByText(/tôi đồng ý với/i).click();
    await page.getByRole('button', { name: /đăng ký miễn phí/i }).click();

    // Should redirect to dashboard after registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Step 2: Logout - Click user avatar dropdown
    await page.locator('.ant-dropdown-trigger').click();
    await page.waitForTimeout(500);
    await page.getByText(/đăng xuất/i).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // Step 3: Login with registered credentials
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/mật khẩu/i).fill(user.password);
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Should successfully login and redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=/dashboard|tổng quan/i')).toBeVisible();
  });
});

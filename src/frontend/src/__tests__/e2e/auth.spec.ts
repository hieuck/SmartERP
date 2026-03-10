import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * Tests the complete user authentication journey
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Smart ERP/);
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Should show validation messages
    await expect(page.locator('text=/email/i')).toBeVisible();
    await expect(page.locator('text=/password/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Should show error message
    await expect(page.locator('text=/sai email hoặc mật khẩu/i')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/dashboard/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByRole('button', { name: /đăng xuất/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/dashboard/i')).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard/products');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/xác nhận mật khẩu/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /đăng ký/i })).toBeVisible();
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('123');
    await page.getByLabel(/xác nhận mật khẩu/i).fill('456');
    await page.getByRole('button', { name: /đăng ký/i }).click();

    // Should show validation messages
    await expect(page.locator('text=/email không hợp lệ/i')).toBeVisible();
    await expect(page.locator('text=/mật khẩu/i')).toBeVisible();
  });

  test('should register successfully with valid data', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).fill('Test123!@#');
    await page.getByLabel(/xác nhận mật khẩu/i).fill('Test123!@#');
    await page.getByRole('button', { name: /đăng ký/i }).click();

    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL(/\/dashboard|\/login/);
  });
});

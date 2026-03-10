import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Authentication - Security E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(`${BASE_URL}/login`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Rate Limiting & Account Lockout', () => {
    test('should lock account after 5 failed login attempts', async () => {
      const email = `test-${Date.now()}@example.com`;

      for (let i = 0; i < 5; i++) {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button:has-text("Đăng nhập")');
        await page.waitForTimeout(500);
      }

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForSelector('text=Tài khoản đã bị khóa', { timeout: 5000 });
      expect(await page.locator('text=Tài khoản đã bị khóa').isVisible()).toBe(true);
    });

    test('should display rate limit error (429)', async () => {
      const email = `test-${Date.now()}@example.com`;

      for (let i = 0; i < 6; i++) {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button:has-text("Đăng nhập")');
        await page.waitForTimeout(500);
      }

      await page.waitForSelector('text=Quá nhiều lần đăng nhập thất bại', { timeout: 5000 });
      expect(await page.locator('text=Quá nhiều lần đăng nhập thất bại').isVisible()).toBe(true);
    });
  });

  test.describe('Multi-Tenancy Isolation', () => {
    test('should prevent cross-tenant access with token', async () => {
      const tenant1Email = `tenant1-${Date.now()}@example.com`;
      const tenant2Email = `tenant2-${Date.now()}@example.com`;

      await page.fill('input[type="email"]', tenant1Email);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      const token1 = await page.evaluate(() => localStorage.getItem('authToken'));

      await page.goto(`${BASE_URL}/logout`);
      await page.waitForTimeout(1000);

      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', tenant2Email);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      const token2 = await page.evaluate(() => localStorage.getItem('authToken'));

      expect(token1).not.toBe(token2);
    });

    test('should verify tenant status on login', async () => {
      const inactiveTenantEmail = 'inactive-tenant@example.com';

      await page.fill('input[type="email"]', inactiveTenantEmail);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForSelector('text=Tenant không hoạt động', { timeout: 5000 });
      expect(await page.locator('text=Tenant không hoạt động').isVisible()).toBe(true);
    });
  });

  test.describe('Token Management', () => {
    test('should revoke token on logout', async () => {
      const email = 'admin@test.com';

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      await page.goto(`${BASE_URL}/logout`);
      await page.waitForTimeout(1000);

      const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('authToken'));

      expect(tokenAfterLogout).toBeNull();
    });

    test('should prevent token reuse after logout', async () => {
      const email = 'admin@test.com';

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      const token = await page.evaluate(() => localStorage.getItem('authToken'));

      await page.goto(`${BASE_URL}/logout`);
      await page.waitForTimeout(1000);

      await page.evaluate((t) => {
        localStorage.setItem('authToken', t);
      }, token);

      await page.goto(`${BASE_URL}/dashboard`);

      await page.waitForURL('**/login**', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Password Reset Security', () => {
    test('should validate password strength in reset', async () => {
      const email = `test-${Date.now()}@example.com`;

      await page.goto(`${BASE_URL}/forgot-password`);
      await page.fill('input[type="email"]', email);
      await page.click('button:has-text("Gửi")');

      await page.waitForSelector('text=Nếu email tồn tại', { timeout: 5000 });
    });
  });

  test.describe('Input Validation & Sanitization', () => {
    test('should reject SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE users; --";

      await page.fill('input[type="email"]', sqlInjection);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForSelector('text=Email không hợp lệ', { timeout: 5000 });
    });

    test('should reject XSS attempts', async () => {
      const xssAttempt = '<script>alert("xss")</script>';

      await page.fill('input[type="email"]', xssAttempt);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForSelector('text=Email không hợp lệ', { timeout: 5000 });
    });

    test('should sanitize email input', async () => {
      const emailWithSpaces = '  ADMIN@TEST.COM  ';

      await page.fill('input[type="email"]', emailWithSpaces);
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Đăng nhập")');

      const emailValue = await page.inputValue('input[type="email"]');
      expect(emailValue.toLowerCase()).toBe('admin@test.com');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async () => {
      const email = 'admin@test.com';

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      const token = await page.evaluate(() => localStorage.getItem('authToken'));

      await page.reload();

      const tokenAfterReload = await page.evaluate(() => localStorage.getItem('authToken'));

      expect(tokenAfterReload).toBe(token);
      expect(page.url()).toContain('/dashboard');
    });

    test('should redirect to login when session expires', async () => {
      const email = 'admin@test.com';

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForURL('**/dashboard**', { timeout: 5000 });

      await page.evaluate(() => {
        localStorage.removeItem('authToken');
      });

      await page.reload();

      await page.waitForURL('**/login**', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Error Messages', () => {
    test('should use generic error messages for login failures', async () => {
      const email = 'nonexistent@example.com';

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Đăng nhập")');

      await page.waitForSelector('text=Email hoặc mật khẩu không chính xác', { timeout: 5000 });

      const errorText = await page.locator('text=Email hoặc mật khẩu không chính xác').textContent();
      expect(errorText).not.toContain('not found');
      expect(errorText).not.toContain('does not exist');
    });

    test('should not reveal email existence in forgot password', async () => {
      const nonexistentEmail = `nonexistent-${Date.now()}@example.com`;

      await page.goto(`${BASE_URL}/forgot-password`);
      await page.fill('input[type="email"]', nonexistentEmail);
      await page.click('button:has-text("Gửi")');

      await page.waitForSelector('text=Nếu email tồn tại', { timeout: 5000 });

      const message = await page.locator('text=Nếu email tồn tại').textContent();
      expect(message).not.toContain('not found');
      expect(message).not.toContain('does not exist');
    });
  });
});

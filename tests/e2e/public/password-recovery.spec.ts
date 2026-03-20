import { expect, test } from '@playwright/test';

test.describe('Password Recovery', () => {
  test('submits forgot-password successfully and shows the success state', async ({ page }) => {
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            message: 'If the email exists, a password reset link has been sent',
          },
        }),
      });
    });

    await page.goto('/forgot-password');
    await page.getByLabel(/^email$/i).fill('owner@example.com');
    await page.getByRole('button', { name: /send reset instructions|gửi hướng dẫn đặt lại/i }).click();

    await expect(page.locator('.ant-result-title')).toContainText(/check your inbox|kiểm tra hộp thư/i);
  });

  test('shows forgot-password API errors inline', async ({ page }) => {
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Too many requests',
        }),
      });
    });

    await page.goto('/forgot-password');
    await page.getByLabel(/^email$/i).fill('owner@example.com');
    await page.getByRole('button', { name: /send reset instructions|gửi hướng dẫn đặt lại/i }).click();

    await expect(page.locator('.ant-alert')).toContainText(/too many requests/i);
  });

  test('shows a clear warning when reset token is missing', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.locator('.ant-result-title')).toContainText(
      /reset link is missing or invalid|liên kết đặt lại không hợp lệ/i,
    );
  });

  test('submits reset-password successfully when token is present', async ({ page }) => {
    await page.route('**/api/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            message: 'Password reset successful',
          },
        }),
      });
    });

    await page.goto('/reset-password?token=reset-token-for-e2e');
    await page.getByLabel(/^password$/i).fill('NewPassword1');
    await page.getByLabel(/confirm password|xác nhận mật khẩu/i).fill('NewPassword1');
    await page.getByRole('button', { name: /update password|cập nhật mật khẩu/i }).click();

    await expect(page.locator('.ant-result-title')).toContainText(/password updated|đã cập nhật mật khẩu/i);
  });
});

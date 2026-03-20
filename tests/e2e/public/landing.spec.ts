import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero content and primary call-to-action buttons', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('h1').first()).toContainText(
      /quản lý sản xuất và kinh doanh|production and business management/i,
    );
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
  });

  test('navigates to register page from the hero CTA', async ({ page }) => {
    await page.locator('a[href="/register"]').first().click();

    await page.waitForURL('**/register');
    await expect(page.getByRole('button', { name: /register|đăng ký/i })).toBeVisible();
  });

  test('expands FAQ content without crashing', async ({ page }) => {
    const secondFaqTrigger = page.getByRole('tab').nth(1);
    await secondFaqTrigger.click();

    await expect(page.getByRole('tabpanel')).toContainText(
      /Không cần|technical knowledge|operational teams/i,
    );
  });

  test('shows footer links for legal pages', async ({ page }) => {
    await expect(page.locator('footer a[href="/privacy"]')).toBeVisible();
    await expect(page.locator('footer a[href="/terms"]')).toBeVisible();
  });
});

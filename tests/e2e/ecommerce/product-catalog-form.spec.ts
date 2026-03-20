import { expect, Page, test } from '@playwright/test';

const mockUser = {
  id: 'user-1',
  username: 'admin@test.com',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
};

async function injectAuthenticatedSession(page: Page) {
  await page.addInitScript(
    ({ token, user }) => {
      sessionStorage.setItem('e2e_access_token', token);
      sessionStorage.setItem('e2e_user', JSON.stringify(user));
    },
    { token: 'ecommerce-access-token', user: mockUser },
  );
}

test.describe('Ecommerce Product Catalog Form', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthenticatedSession(page);
  });

  test('loads create mode route', async ({ page }) => {
    await page.goto('/dashboard/ecommerce/products/new');

    await expect(page.getByRole('heading', { name: /Thêm sản phẩm|New Product/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tạo mới|Create/i })).toBeVisible();
    await expect(page.getByPlaceholder(/SKU-001/i)).toBeVisible();
  });

  test('loads edit mode data from API', async ({ page }) => {
    await page.route('**/api/ecommerce/products/P-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sku: 'SKU-001',
          name: 'Laptop Pro',
          description: 'Flagship device',
          price: 25000000,
          stockQuantity: 12,
          isPublished: true,
        }),
      });
    });

    await page.goto('/dashboard/ecommerce/products/P-1');

    await expect(
      page.getByRole('heading', { name: /Chỉnh sửa sản phẩm|Edit Product/i }),
    ).toBeVisible();
    await expect(page.locator('input[value="SKU-001"]')).toBeVisible();
    await expect(page.locator('input[value="Laptop Pro"]')).toBeVisible();
  });
});

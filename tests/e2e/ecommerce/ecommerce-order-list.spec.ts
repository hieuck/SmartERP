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

test.describe('Ecommerce Order List', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthenticatedSession(page);
  });

  test('loads ecommerce order list with mocked order data', async ({ page }) => {
    await page.route('**/api/orders', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'o-1',
              orderNumber: 'DH-001',
              customerId: 'CUS-01',
              totalAmount: 1200000,
              status: 'confirmed',
              paymentStatus: 'paid',
              createdAt: '2026-03-20T00:00:00.000Z',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/ecommerce/orders');

    const main = page.getByRole('main');

    await expect(main.getByText(/Đơn hàng online|Online Orders/i)).toBeVisible();
    await expect(main.getByText('DH-001')).toBeVisible();
    await expect(main.getByText(/confirmed|Đã xác nhận/i)).toBeVisible();
    await expect(main.getByText(/paid|Đã thanh toán/i)).toBeVisible();
  });
});

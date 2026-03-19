import { expect, Page, test } from '@playwright/test';

const mockUser = {
  id: 'user-1',
  username: 'admin@test.com',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
};

type ProductSeed = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  status: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
};

async function injectAuthenticatedSession(page: Page) {
  await page.addInitScript(
    ({ token, user }) => {
      sessionStorage.setItem('e2e_access_token', token);
      sessionStorage.setItem('e2e_user', JSON.stringify(user));
    },
    { token: 'product-list-token', user: mockUser },
  );
}

async function seedProductDatabase(
  page: Page,
  products: ProductSeed[],
  syncQueueCount = 0,
  options?: { token?: string | null; online?: boolean },
) {
  await page.goto('/login');

  await page.evaluate(
    async ({ products: productSeeds, syncQueueCount: queueCount, token, online }) => {
      const { db } = await import('/src/lib/offline/db.ts');

      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }

      if (online === false) {
        Object.defineProperty(window.navigator, 'onLine', {
          configurable: true,
          value: false,
        });
      }

      await db.products.clear();
      await db.syncQueue.clear();

      const now = new Date();
      await db.products.bulkPut(
        productSeeds.map((product, index) => ({
          id: product.id,
          tenantId: 'tenant-1',
          version: 1,
          createdAt: now,
          updatedAt: now,
          syncStatus: product.syncStatus,
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: product.price,
          cost: product.cost,
          status: product.status,
          stockQuantity: 20 - index,
        })),
      );

      for (let i = 0; i < queueCount; i += 1) {
        await db.syncQueue.add({
          entity: 'products',
          operation: 'update',
          data: { id: `queued-${i}` },
          createdAt: now,
          retryCount: 0,
        });
      }
    },
    {
      products,
      syncQueueCount,
      token: options?.token ?? null,
      online: options?.online,
    },
  );
}

const seededProducts: ProductSeed[] = [
  {
    id: 'product-1',
    sku: 'SKU-001',
    name: 'Gypsum Board A',
    description: 'Main gypsum product',
    price: 120000,
    cost: 80000,
    status: 'active',
    syncStatus: 'synced',
  },
  {
    id: 'product-2',
    sku: 'SKU-002',
    name: 'Metal Frame B',
    description: 'Metal frame accessory',
    price: 95000,
    cost: 70000,
    status: 'inactive',
    syncStatus: 'pending',
  },
  {
    id: 'product-3',
    sku: 'ACC-003',
    name: 'Ceiling Hook C',
    description: 'Accessory for installation',
    price: 45000,
    cost: 20000,
    status: 'active',
    syncStatus: 'conflict',
  },
];

test.describe('Product List Operations', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthenticatedSession(page);
    await seedProductDatabase(page, seededProducts);
    await page.goto('/dashboard/products');
    await expect(page.getByText(/product list/i)).toBeVisible();
  });

  test('displays products loaded from offline storage', async ({ page }) => {
    await expect(page.locator('.ant-table')).toBeVisible();
    await expect(page.getByText(/total 3 products/i)).toBeVisible();
    await expect(page.locator('.ant-table-content')).toContainText('Gypsum Board A');
    await expect(page.locator('.ant-table-content')).toContainText('Metal Frame B');
  });

  test('searches products by name and sku', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search products/i);

    await searchInput.fill('metal');
    await expect(page.getByText(/total 1 products?/i)).toBeVisible();
    await expect(page.locator('.ant-table-content')).toContainText('Metal Frame B');

    await searchInput.clear();
    await searchInput.fill('ACC-003');
    await expect(page.getByText(/total 1 products?/i)).toBeVisible();
    await expect(page.locator('.ant-table-content')).toContainText('Ceiling Hook C');
  });

  test('shows empty state when no products match the search', async ({ page }) => {
    await page.getByPlaceholder(/search products/i).fill('does-not-exist');

    await expect(page.locator('.ant-empty')).toBeVisible();
    await expect(page.locator('.ant-table-content')).not.toContainText('Gypsum Board A');
  });

  test('shows pending sync badge when queue has offline changes', async ({ page }) => {
    await seedProductDatabase(page, seededProducts, 2);
    await page.goto('/dashboard/products');

    await expect(page.getByText(/pending sync/i)).toBeVisible();
    await expect(page.locator('.ant-scroll-number')).toContainText('2');
  });

  test('navigates to category management from the extra action button', async ({ page }) => {
    await page.getByRole('button', { name: /manage categories/i }).click();

    await page.waitForURL('**/dashboard/products/categories');
    expect(page.url()).toContain('/dashboard/products/categories');
  });

  test('deletes a product from offline storage after confirmation', async ({ page }) => {
    const targetRow = page.locator('.ant-table-content tbody tr', { hasText: 'Metal Frame B' });
    await targetRow.getByRole('button', { name: /delete/i }).click();

    const confirmDialog = page.locator('.ant-popconfirm');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /delete/i }).click();

    await expect(page.locator('.ant-table-content')).not.toContainText('Metal Frame B');
    await expect(page.getByText(/total 2 products/i)).toBeVisible();
  });

  test('disables sync action when browser is offline', async ({ page }) => {
    const freshPage = await page.context().newPage();
    await injectAuthenticatedSession(freshPage);
    await freshPage.addInitScript(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        get: () => false,
      });
    });
    await seedProductDatabase(freshPage, seededProducts, 0, { online: false });
    await freshPage.goto('/dashboard/products');

    const syncButton = freshPage.getByRole('button', { name: /sync now/i });
    await expect(syncButton).toBeDisabled();
    await expect(freshPage.locator('.ant-badge-status-text').filter({ hasText: /offline/i })).toBeVisible();
    await freshPage.close();
  });
});

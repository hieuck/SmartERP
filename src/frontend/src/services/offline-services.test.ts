import { describe, expect, it, vi } from 'vitest';

const createOfflineServiceMock = vi.fn((table: string, endpoint: string) => ({
  table,
  endpoint,
}));

vi.mock('../lib/offline/offline-service', () => ({
  createOfflineService: createOfflineServiceMock,
}));

describe('offlineServices', () => {
  it('creates offline services for each configured entity and exports the aggregated map', async () => {
    const module = await import('./offline-services');

    expect(createOfflineServiceMock).toHaveBeenCalledWith('users', 'users');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('products', 'products');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('customers', 'customers');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('suppliers', 'suppliers');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('salesOrders', 'salesOrders');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('invoices', 'invoices');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('payments', 'payments');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('purchaseOrders', 'purchaseOrders');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('warehouses', 'warehouses');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('stocks', 'stocks');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('stockReceipts', 'stockReceipts');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('attendances', 'attendances');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('notifications', 'notifications');
    expect(createOfflineServiceMock).toHaveBeenCalledWith('categories', 'categories');

    expect(module.offlineServices.users).toEqual({ table: 'users', endpoint: 'users' });
    expect(module.offlineServices.products).toEqual({ table: 'products', endpoint: 'products' });
    expect(module.offlineServices.categories).toEqual({
      table: 'categories',
      endpoint: 'categories',
    });
  });
});

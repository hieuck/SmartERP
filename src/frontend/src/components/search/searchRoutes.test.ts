import { describe, expect, it } from 'vitest';
import { buildSearchResultsRoute, buildSearchRoute } from './searchRoutes';

describe('searchRoutes', () => {
  it('builds dashboard detail routes for standard entities', () => {
    expect(buildSearchRoute('products', 'product-1')).toBe('/dashboard/products/product-1');
    expect(buildSearchRoute('customers', 'customer-1')).toBe('/dashboard/customers/customer-1');
    expect(buildSearchRoute('suppliers', 'supplier-1')).toBe('/dashboard/suppliers/supplier-1');
  });

  it('builds order detail routes from order type', () => {
    expect(buildSearchRoute('orders', 'sales-1', { type: 'sales' })).toBe(
      '/dashboard/orders/sales/sales-1',
    );
    expect(buildSearchRoute('orders', 'purchase-1', { type: 'purchase' })).toBe(
      '/dashboard/orders/purchase/purchase-1',
    );
  });

  it('returns empty routes for unsupported search targets', () => {
    expect(buildSearchRoute('orders', 'unknown-1', { type: 'draft' })).toBe('');
    expect(buildSearchRoute('unknown', 'unknown-1')).toBe('');
  });

  it('builds dashboard search results routes', () => {
    expect(buildSearchResultsRoute('invoice 001')).toBe('/dashboard/search?q=invoice%20001');
  });
});

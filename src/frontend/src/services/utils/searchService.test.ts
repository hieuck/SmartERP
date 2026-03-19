import searchService from './searchService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = new Map<string, string>();

    vi.mocked(localStorage.getItem).mockImplementation((key: string) =>
      storage.has(key) ? storage.get(key)! : null,
    );
    vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
      storage.set(key, value);
    });
    vi.mocked(localStorage.removeItem).mockImplementation((key: string) => {
      storage.delete(key);
    });
    vi.mocked(localStorage.clear).mockImplementation(() => {
      storage.clear();
    });
    vi.mocked(localStorage.key).mockImplementation((index: number) =>
      Array.from(storage.keys())[index] ?? null,
    );
    Object.defineProperty(localStorage, 'length', {
      configurable: true,
      get: () => storage.size,
    });

    localStorage.clear();
  });

  it('performs global search with default paging', async () => {
    const mockResult = { hits: { total: { value: 1 }, hits: [] } };
    mockApiGet.mockResolvedValue({ data: mockResult });

    const result = await searchService.globalSearch('invoice');

    expect(api.get).toHaveBeenCalledWith('/search/global', {
      params: { q: 'invoice', from: 0, size: 20 },
    });
    expect(result).toEqual(mockResult);
  });

  it('performs product search with filters', async () => {
    const filters = { status: 'active', categoryId: 'cat-1' };
    const mockResult = { hits: { total: { value: 2 }, hits: [] } };
    mockApiGet.mockResolvedValue({ data: mockResult });

    const result = await searchService.searchProducts('laptop', filters);

    expect(api.get).toHaveBeenCalledWith('/search/products', {
      params: { q: 'laptop', ...filters },
    });
    expect(result).toEqual(mockResult);
  });

  it('performs customer, supplier, and order search against their endpoints', async () => {
    const mockResult = { hits: { total: { value: 0 }, hits: [] } };
    mockApiGet.mockResolvedValue({ data: mockResult });

    await searchService.searchCustomers('acme');
    await searchService.searchSuppliers('acme');
    await searchService.searchOrders('SO-001');

    expect(api.get).toHaveBeenNthCalledWith(1, '/search/customers', {
      params: { q: 'acme' },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/search/suppliers', {
      params: { q: 'acme' },
    });
    expect(api.get).toHaveBeenNthCalledWith(3, '/search/orders', {
      params: { q: 'SO-001' },
    });
  });

  it('gets suggestions with optional params', async () => {
    const mockSuggestions = ['invoice', 'inventory'];
    mockApiGet.mockResolvedValue({ data: mockSuggestions });

    const result = await searchService.suggest('inv', 'name', 'products');

    expect(api.get).toHaveBeenCalledWith('/search/suggest', {
      params: { q: 'inv', field: 'name', index: 'products' },
    });
    expect(result).toEqual(mockSuggestions);
  });

  it('performs advanced search via post', async () => {
    const payload = {
      query: 'warehouse',
      filters: { status: 'active' },
      from: 10,
      size: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    };
    const mockResult = { hits: { total: { value: 3 }, hits: [] } };
    mockApiPost.mockResolvedValue({ data: mockResult });

    const result = await searchService.advancedSearch(payload);

    expect(api.post).toHaveBeenCalledWith('/search/advanced', payload);
    expect(result).toEqual(mockResult);
  });

  it('returns empty saved filters when localStorage is empty', () => {
    expect(searchService.getSavedFilters()).toEqual([]);
  });

  it('filters saved filters by module', () => {
    localStorage.setItem(
      'savedFilters',
      JSON.stringify([
        {
          id: '1',
          name: 'Orders only',
          module: 'orders',
          filters: { status: 'pending' },
          createdAt: '2026-03-19T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Products only',
          module: 'products',
          filters: { status: 'active' },
          createdAt: '2026-03-19T00:00:01.000Z',
        },
      ]),
    );

    expect(searchService.getSavedFilters('orders')).toEqual([
      {
        id: '1',
        name: 'Orders only',
        module: 'orders',
        filters: { status: 'pending' },
        createdAt: '2026-03-19T00:00:00.000Z',
      },
    ]);
  });

  it('saves a filter to localStorage', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(123456789);
    const isoSpy = vi
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue('2026-03-19T10:00:00.000Z');

    const result = searchService.saveFilter('Low stock', 'inventory', { minStock: 5 });

    expect(result).toEqual({
      id: '123456789',
      name: 'Low stock',
      module: 'inventory',
      filters: { minStock: 5 },
      createdAt: '2026-03-19T10:00:00.000Z',
    });
    expect(JSON.parse(localStorage.getItem('savedFilters') || '[]')).toEqual([result]);

    nowSpy.mockRestore();
    isoSpy.mockRestore();
  });

  it('deletes a saved filter from localStorage', () => {
    localStorage.setItem(
      'savedFilters',
      JSON.stringify([
        {
          id: '1',
          name: 'Keep me',
          module: 'orders',
          filters: {},
          createdAt: '2026-03-19T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Delete me',
          module: 'orders',
          filters: {},
          createdAt: '2026-03-19T00:00:01.000Z',
        },
      ]),
    );

    searchService.deleteFilter('2');

    expect(JSON.parse(localStorage.getItem('savedFilters') || '[]')).toEqual([
      {
        id: '1',
        name: 'Keep me',
        module: 'orders',
        filters: {},
        createdAt: '2026-03-19T00:00:00.000Z',
      },
    ]);
  });
});

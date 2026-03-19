import dashboardService from './dashboardService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps overview data from nested payload', async () => {
    const overview = {
      revenue: { today: 1, thisWeek: 2, thisMonth: 3, growth: 4 },
      orders: { total: 5, pending: 1, completed: 3, cancelled: 1 },
      inventory: { totalProducts: 10, lowStock: 2, outOfStock: 1, totalValue: 1000 },
      customers: { total: 20, active: 15, new: 3 },
      payments: { pending: 1, completed: 10, totalAmount: 5000 },
    };
    mockApiGet.mockResolvedValue({ data: { data: overview } });

    const result = await dashboardService.getOverview();

    expect(api.get).toHaveBeenCalledWith('/dashboard/overview');
    expect(result).toEqual(overview);
  });

  it('falls back to raw overview payload when data wrapper is absent', async () => {
    const overview = {
      revenue: { today: 0, thisWeek: 0, thisMonth: 0, growth: 0 },
      orders: { total: 0, pending: 0, completed: 0, cancelled: 0 },
      inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
      customers: { total: 0, active: 0, new: 0 },
      payments: { pending: 0, completed: 0, totalAmount: 0 },
    };
    mockApiGet.mockResolvedValue({ data: overview });

    const result = await dashboardService.getOverview();

    expect(result).toEqual(overview);
  });

  it('gets sales chart with default days and unwraps array data', async () => {
    const chart = [{ date: '2026-03-01', revenue: 100, orders: 2 }];
    mockApiGet.mockResolvedValue({ data: { data: chart } });

    const result = await dashboardService.getSalesChart();

    expect(api.get).toHaveBeenCalledWith('/dashboard/sales-chart', { params: { days: 30 } });
    expect(result).toEqual(chart);
  });

  it('returns empty array when sales chart payload is not an array', async () => {
    mockApiGet.mockResolvedValue({ data: { data: { invalid: true } } });

    const result = await dashboardService.getSalesChart(7);

    expect(api.get).toHaveBeenCalledWith('/dashboard/sales-chart', { params: { days: 7 } });
    expect(result).toEqual([]);
  });

  it('gets top products with default limit', async () => {
    const products = [{ id: 'p-1', name: 'Product A', revenue: 1000, quantity: 5 }];
    mockApiGet.mockResolvedValue({ data: products });

    const result = await dashboardService.getTopProducts();

    expect(api.get).toHaveBeenCalledWith('/dashboard/top-products', { params: { limit: 10 } });
    expect(result).toEqual(products);
  });

  it('gets top customers with custom limit', async () => {
    const customers = [{ id: 'c-1', name: 'Customer A', totalSpent: 2000, orderCount: 3 }];
    mockApiGet.mockResolvedValue({ data: { data: customers } });

    const result = await dashboardService.getTopCustomers(5);

    expect(api.get).toHaveBeenCalledWith('/dashboard/top-customers', { params: { limit: 5 } });
    expect(result).toEqual(customers);
  });

  it('returns empty array for invalid top customer payload', async () => {
    mockApiGet.mockResolvedValue({ data: { data: null } });

    const result = await dashboardService.getTopCustomers();

    expect(result).toEqual([]);
  });

  it('gets revenue by category and normalizes invalid payloads', async () => {
    const categories = [{ category: 'Electronics', revenue: 5000, percentage: 50 }];
    mockApiGet.mockResolvedValueOnce({ data: { data: categories } });
    mockApiGet.mockResolvedValueOnce({ data: { data: 'invalid' } });

    const valid = await dashboardService.getRevenueByCategory();
    const invalid = await dashboardService.getRevenueByCategory();

    expect(api.get).toHaveBeenNthCalledWith(1, '/dashboard/revenue-by-category');
    expect(api.get).toHaveBeenNthCalledWith(2, '/dashboard/revenue-by-category');
    expect(valid).toEqual(categories);
    expect(invalid).toEqual([]);
  });
});

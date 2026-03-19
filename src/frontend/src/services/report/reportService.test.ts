import reportService from './reportService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets current stock report', async () => {
    const mockResponse = { data: { items: [] } };
    mockApiGet.mockResolvedValue(mockResponse);

    const result = await reportService.getCurrentStock();

    expect(api.get).toHaveBeenCalledWith('/reports/inventory/current-stock');
    expect(result).toEqual(mockResponse.data);
  });

  it('gets inventory report with date range params', async () => {
    const params = { startDate: '2026-01-01', endDate: '2026-01-31' };
    const mockResponse = { data: { totals: {} } };
    mockApiGet.mockResolvedValue(mockResponse);

    const result = await reportService.getInventoryReport(params);

    expect(api.get).toHaveBeenCalledWith('/reports/inventory/report', { params });
    expect(result).toEqual(mockResponse.data);
  });

  it('gets sales report with params', async () => {
    const params = { startDate: '2026-01-01', endDate: '2026-01-31' };
    mockApiGet.mockResolvedValue({ data: { revenue: 1000 } });

    const result = await reportService.getSalesReport(params);

    expect(api.get).toHaveBeenCalledWith('/reports/sales/report', { params });
    expect(result).toEqual({ revenue: 1000 });
  });

  it('exports inventory excel with blob response type', async () => {
    const blob = new Blob(['excel']);
    const params = { startDate: '2026-01-01', endDate: '2026-01-31', warehouseId: 'wh-1' };
    mockApiGet.mockResolvedValue({ data: blob });

    const result = await reportService.exportInventoryToExcel(params);

    expect(api.get).toHaveBeenCalledWith('/reports/inventory/export/excel', {
      params,
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });

  it('exports inventory pdf with blob response type', async () => {
    const blob = new Blob(['pdf']);
    const params = { startDate: '2026-01-01', endDate: '2026-01-31', warehouseId: 'wh-1' };
    mockApiGet.mockResolvedValue({ data: blob });

    const result = await reportService.exportInventoryToPDF(params);

    expect(api.get).toHaveBeenCalledWith('/reports/inventory/export/pdf', {
      params,
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });

  it('uses the same stock movement endpoint for both aliases', async () => {
    const params = { startDate: '2026-01-01', endDate: '2026-01-31' };
    mockApiGet.mockResolvedValue({ data: { movements: [] } });

    const resultA = await reportService.getStockMovement(params);
    const resultB = await reportService.getInventoryMovements(params);

    expect(api.get).toHaveBeenNthCalledWith(1, '/reports/inventory/stock-movement', { params });
    expect(api.get).toHaveBeenNthCalledWith(2, '/reports/inventory/stock-movement', { params });
    expect(resultA).toEqual({ movements: [] });
    expect(resultB).toEqual({ movements: [] });
  });

  it('gets slow moving products with default days', async () => {
    mockApiGet.mockResolvedValue({ data: { products: [] } });

    const result = await reportService.getSlowMovingProducts();

    expect(api.get).toHaveBeenCalledWith('/reports/inventory/slow-moving', {
      params: { days: 90 },
    });
    expect(result).toEqual({ products: [] });
  });

  it('gets best selling products with limit', async () => {
    const params = { startDate: '2026-01-01', endDate: '2026-01-31', limit: 5 };
    mockApiGet.mockResolvedValue({ data: { items: [] } });

    const result = await reportService.getBestSellingProducts(params);

    expect(api.get).toHaveBeenCalledWith('/reports/sales/best-selling', { params });
    expect(result).toEqual({ items: [] });
  });

  it('exports generic pdf report by type', async () => {
    const blob = new Blob(['generic-pdf']);
    const params = { startDate: '2026-01-01', endDate: '2026-01-31', tenantId: 'tenant-1' };
    mockApiGet.mockResolvedValue({ data: blob });

    const result = await reportService.exportPDF('sales', params);

    expect(api.get).toHaveBeenCalledWith('/reports/sales/export/pdf', {
      params,
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });

  it('gets dashboard chart data with defaults', async () => {
    mockApiGet.mockResolvedValue({ data: { labels: [], datasets: [] } });

    const revenue = await reportService.getRevenueChart();
    const selling = await reportService.getBestSellingChart();

    expect(api.get).toHaveBeenNthCalledWith(1, '/dashboard/revenue-chart', {
      params: { period: 'month' },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/dashboard/best-selling-chart', {
      params: { limit: 10 },
    });
    expect(revenue).toEqual({ labels: [], datasets: [] });
    expect(selling).toEqual({ labels: [], datasets: [] });
  });
});

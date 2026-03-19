import reportingService from './reportingService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);

describe('reportingService', () => {
  const params = { startDate: '2026-03-01', endDate: '2026-03-31' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets sales reporting endpoints', async () => {
    const sales = { totalRevenue: 1000 };
    const dailySales = [{ date: '2026-03-01', revenue: 100, orders: 2, customers: 2 }];
    const productPerformance = [{ productId: 'prod-1', revenue: 500 }];
    mockApiGet.mockResolvedValueOnce({ data: sales });
    mockApiGet.mockResolvedValueOnce({ data: dailySales });
    mockApiGet.mockResolvedValueOnce({ data: productPerformance });

    const salesResult = await reportingService.getSalesReport(params);
    const dailyResult = await reportingService.getDailySales(params);
    const productResult = await reportingService.getProductPerformance(params);

    expect(api.get).toHaveBeenNthCalledWith(1, '/reporting/sales', { params });
    expect(api.get).toHaveBeenNthCalledWith(2, '/reporting/daily-sales', { params });
    expect(api.get).toHaveBeenNthCalledWith(3, '/reporting/product-performance', { params });
    expect(salesResult).toEqual(sales);
    expect(dailyResult).toEqual(dailySales);
    expect(productResult).toEqual(productPerformance);
  });

  it('gets inventory and customer reporting endpoints', async () => {
    const inventory = { totalProducts: 10 };
    const lowStock = [{ productId: 'prod-1', currentQuantity: 2 }];
    const movements = [{ productId: 'prod-1', quantity: 5 }];
    const customers = { totalCustomers: 20 };
    const topCustomers = [{ customerId: 'cus-1', totalSpent: 1000 }];
    mockApiGet.mockResolvedValueOnce({ data: inventory });
    mockApiGet.mockResolvedValueOnce({ data: lowStock });
    mockApiGet.mockResolvedValueOnce({ data: movements });
    mockApiGet.mockResolvedValueOnce({ data: customers });
    mockApiGet.mockResolvedValueOnce({ data: topCustomers });

    const inventoryResult = await reportingService.getInventoryReport();
    const lowStockResult = await reportingService.getLowStockReport();
    const movementResult = await reportingService.getStockMovementReport(params);
    const customerResult = await reportingService.getCustomerReport(params);
    const topCustomersResult = await reportingService.getTopCustomers(5);

    expect(api.get).toHaveBeenNthCalledWith(1, '/reporting/inventory');
    expect(api.get).toHaveBeenNthCalledWith(2, '/reporting/inventory/low-stock');
    expect(api.get).toHaveBeenNthCalledWith(3, '/reporting/inventory/movements', { params });
    expect(api.get).toHaveBeenNthCalledWith(4, '/reporting/customers', { params });
    expect(api.get).toHaveBeenNthCalledWith(5, '/reporting/customers/top', {
      params: { limit: 5 },
    });
    expect(inventoryResult).toEqual(inventory);
    expect(lowStockResult).toEqual(lowStock);
    expect(movementResult).toEqual(movements);
    expect(customerResult).toEqual(customers);
    expect(topCustomersResult).toEqual(topCustomers);
  });

  it('gets financial reports and exports report blobs', async () => {
    const financial = { totalRevenue: 1000, totalExpenses: 300 };
    const profitLoss = { grossProfit: 700 };
    const cashFlow = [{ date: '2026-03-01', income: 200, expense: 50, balance: 150 }];
    const blob = new Blob(['report'], { type: 'application/pdf' });
    mockApiGet.mockResolvedValueOnce({ data: financial });
    mockApiGet.mockResolvedValueOnce({ data: profitLoss });
    mockApiGet.mockResolvedValueOnce({ data: cashFlow });
    mockApiGet.mockResolvedValueOnce({ data: blob });
    mockApiGet.mockResolvedValueOnce({ data: blob });
    mockApiGet.mockResolvedValueOnce({ data: blob });
    mockApiGet.mockResolvedValueOnce({ data: blob });

    const financialResult = await reportingService.getFinancialReport(params);
    const profitResult = await reportingService.getProfitLoss(params);
    const cashResult = await reportingService.getCashFlow(params);
    const salesExport = await reportingService.exportSalesReport(params, 'excel');
    const inventoryExport = await reportingService.exportInventoryReport();
    const customerExport = await reportingService.exportCustomerReport(params, 'pdf');
    const financialExport = await reportingService.exportFinancialReport(params, 'excel');

    expect(api.get).toHaveBeenNthCalledWith(1, '/reporting/financial', { params });
    expect(api.get).toHaveBeenNthCalledWith(2, '/reporting/financial/profit-loss', { params });
    expect(api.get).toHaveBeenNthCalledWith(3, '/reporting/financial/cash-flow', { params });
    expect(api.get).toHaveBeenNthCalledWith(4, '/reporting/sales/export/excel', {
      params,
      responseType: 'blob',
    });
    expect(api.get).toHaveBeenNthCalledWith(5, '/reporting/inventory/export/pdf', {
      responseType: 'blob',
    });
    expect(api.get).toHaveBeenNthCalledWith(6, '/reporting/customers/export/pdf', {
      params,
      responseType: 'blob',
    });
    expect(api.get).toHaveBeenNthCalledWith(7, '/reporting/financial/export/excel', {
      params,
      responseType: 'blob',
    });
    expect(financialResult).toEqual(financial);
    expect(profitResult).toEqual(profitLoss);
    expect(cashResult).toEqual(cashFlow);
    expect(salesExport).toEqual(blob);
    expect(inventoryExport).toEqual(blob);
    expect(customerExport).toEqual(blob);
    expect(financialExport).toEqual(blob);
  });
});

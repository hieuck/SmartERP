import api from './api';

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

export interface ReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

const reportService = {
  // Inventory Reports
  getCurrentStock: async () => {
    const response = await api.get('/reports/inventory/current-stock');
    return response.data;
  },

  getInventoryReport: async (params?: DateRangeParams) => {
    const response = await api.get('/reports/inventory/report', { params });
    return response.data;
  },

  getSalesReport: async (params?: DateRangeParams) => {
    const response = await api.get('/reports/sales/report', { params });
    return response.data;
  },

  getFinancialReport: async (params?: DateRangeParams) => {
    const response = await api.get('/reports/financial/report', { params });
    return response.data;
  },

  exportInventoryToExcel: async (params?: any) => {
    const response = await api.get('/reports/inventory/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportInventoryToPDF: async (params?: any) => {
    const response = await api.get('/reports/inventory/export/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  getStockMovement: async (params: DateRangeParams) => {
    const response = await api.get('/reports/inventory/stock-movement', { params });
    return response.data;
  },

  getInventoryMovements: async (params: DateRangeParams) => {
    const response = await api.get('/reports/inventory/stock-movement', { params });
    return response.data;
  },

  getLowStockProducts: async () => {
    const response = await api.get('/reports/inventory/low-stock');
    return response.data;
  },

  getOverstockProducts: async () => {
    const response = await api.get('/reports/inventory/overstock');
    return response.data;
  },

  getSlowMovingProducts: async (days: number = 90) => {
    const response = await api.get('/reports/inventory/slow-moving', {
      params: { days },
    });
    return response.data;
  },

  // Sales Reports
  getRevenueByPeriod: async (params: DateRangeParams) => {
    const response = await api.get('/reports/sales/revenue-by-period', { params });
    return response.data;
  },

  getRevenueByProduct: async (params: DateRangeParams) => {
    const response = await api.get('/reports/sales/revenue-by-product', { params });
    return response.data;
  },

  getRevenueByCustomer: async (params: DateRangeParams) => {
    const response = await api.get('/reports/sales/revenue-by-customer', { params });
    return response.data;
  },

  getBestSellingProducts: async (params: DateRangeParams & { limit?: number }) => {
    const response = await api.get('/reports/sales/best-selling', { params });
    return response.data;
  },

  getSlowSellingProducts: async (params: DateRangeParams & { limit?: number }) => {
    const response = await api.get('/reports/sales/slow-selling', { params });
    return response.data;
  },

  // Purchase Reports
  getPurchaseByPeriod: async (params: DateRangeParams) => {
    const response = await api.get('/reports/purchase/by-period', { params });
    return response.data;
  },

  getPurchaseByProduct: async (params: DateRangeParams) => {
    const response = await api.get('/reports/purchase/by-product', { params });
    return response.data;
  },

  getPurchaseBySupplier: async (params: DateRangeParams) => {
    const response = await api.get('/reports/purchase/by-supplier', { params });
    return response.data;
  },

  getSupplierPriceComparison: async (productId?: string) => {
    const response = await api.get('/reports/purchase/price-comparison', {
      params: { productId },
    });
    return response.data;
  },

  // Financial Reports
  getAccountsReceivable: async () => {
    const response = await api.get('/reports/financial/accounts-receivable');
    return response.data;
  },

  getAccountsPayable: async () => {
    const response = await api.get('/reports/financial/accounts-payable');
    return response.data;
  },

  getCashFlow: async (params: DateRangeParams) => {
    const response = await api.get('/reports/financial/cash-flow', { params });
    return response.data;
  },

  getGrossProfit: async (params: DateRangeParams) => {
    const response = await api.get('/reports/financial/gross-profit', { params });
    return response.data;
  },

  getOverdueDebt: async () => {
    const response = await api.get('/reports/financial/overdue-debt');
    return response.data;
  },

  // Export Functions
  exportPDF: async (reportType: string, params: any) => {
    const response = await api.get(`/reports/${reportType}/export/pdf`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (reportType: string, params: any) => {
    const response = await api.get(`/reports/${reportType}/export/excel`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Dashboard
  getDashboardData: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  getRevenueChart: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    const response = await api.get('/dashboard/revenue-chart', {
      params: { period },
    });
    return response.data;
  },

  getBestSellingChart: async (limit: number = 10) => {
    const response = await api.get('/dashboard/best-selling-chart', {
      params: { limit },
    });
    return response.data;
  },
};

export default reportService;

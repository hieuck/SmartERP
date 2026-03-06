import api from './api';

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  warehouseBreakdown: Array<{
    warehouseId: string;
    warehouseName: string;
    productCount: number;
    totalValue: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalValue: number;
  }>;
}

export interface CustomerReport {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
  }>;
  customersByStatus: Record<string, number>;
}

export interface FinancialReport {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashFlow: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  profit: number;
  profitMargin: number;
}

export const reportingService = {
  // Sales Reports
  getSalesReport: async (params: DateRangeParams): Promise<SalesReport> => {
    const response = await api.get('/reporting/sales', { params });
    return response.data;
  },

  getDailySales: async (params: DateRangeParams): Promise<DailySales[]> => {
    const response = await api.get('/reporting/daily-sales', { params });
    return response.data;
  },

  getProductPerformance: async (params: DateRangeParams): Promise<ProductPerformance[]> => {
    const response = await api.get('/reporting/product-performance', { params });
    return response.data;
  },

  // Inventory Reports
  getInventoryReport: async (): Promise<InventoryReport> => {
    const response = await api.get('/reporting/inventory');
    return response.data;
  },

  getLowStockReport: async () => {
    const response = await api.get('/reporting/inventory/low-stock');
    return response.data;
  },

  getStockMovementReport: async (params: DateRangeParams) => {
    const response = await api.get('/reporting/inventory/movements', { params });
    return response.data;
  },

  // Customer Reports
  getCustomerReport: async (params?: DateRangeParams): Promise<CustomerReport> => {
    const response = await api.get('/reporting/customers', { params });
    return response.data;
  },

  getTopCustomers: async (limit: number = 10) => {
    const response = await api.get('/reporting/customers/top', { params: { limit } });
    return response.data;
  },

  // Financial Reports
  getFinancialReport: async (params: DateRangeParams): Promise<FinancialReport> => {
    const response = await api.get('/reporting/financial', { params });
    return response.data;
  },

  getProfitLoss: async (params: DateRangeParams) => {
    const response = await api.get('/reporting/financial/profit-loss', { params });
    return response.data;
  },

  getCashFlow: async (params: DateRangeParams) => {
    const response = await api.get('/reporting/financial/cash-flow', { params });
    return response.data;
  },

  // Export Functions
  exportSalesReport: async (params: DateRangeParams, format: 'pdf' | 'excel' = 'pdf') => {
    const response = await api.get(`/reporting/sales/export/${format}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportInventoryReport: async (format: 'pdf' | 'excel' = 'pdf') => {
    const response = await api.get(`/reporting/inventory/export/${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportCustomerReport: async (params: DateRangeParams, format: 'pdf' | 'excel' = 'pdf') => {
    const response = await api.get(`/reporting/customers/export/${format}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportFinancialReport: async (params: DateRangeParams, format: 'pdf' | 'excel' = 'pdf') => {
    const response = await api.get(`/reporting/financial/export/${format}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportingService;

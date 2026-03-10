import api from './api';

export interface DashboardOverview {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
  };
  payments: {
    pending: number;
    completed: number;
    totalAmount: number;
  };
}

export interface SalesChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalSpent: number;
  orderCount: number;
}

export interface RevenueByCategory {
  category: string;
  revenue: number;
  percentage: number;
}

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  getSalesChart: async (days: number = 30): Promise<SalesChartData[]> => {
    const response = await api.get('/dashboard/sales-chart', { params: { days } });
    return response.data;
  },

  getTopProducts: async (limit: number = 10): Promise<TopProduct[]> => {
    const response = await api.get('/dashboard/top-products', { params: { limit } });
    return response.data;
  },

  getTopCustomers: async (limit: number = 10): Promise<TopCustomer[]> => {
    const response = await api.get('/dashboard/top-customers', { params: { limit } });
    return response.data;
  },

  getRevenueByCategory: async (): Promise<RevenueByCategory[]> => {
    const response = await api.get('/dashboard/revenue-by-category');
    return response.data;
  },
};

export default dashboardService;

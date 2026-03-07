import { apiClient } from './client';

export interface DashboardStats {
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  orders: {
    today: number;
    week: number;
    month: number;
    pending: number;
  };
  inventory: {
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  customers: {
    total: number;
    new: number;
  };
  receivables: number;
  payables: number;
}

export interface ChartData {
  labels: string[];
  values: number[];
}

export interface RecentOrder {
  id: string;
  code: string;
  customerName: string;
  totalAmount: number;
  status: string;
  orderDate: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
}

const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/api/v1/dashboard/stats');
    return response.data.data;
  },

  async getRevenueChart(period: 'week' | 'month' | 'year'): Promise<ChartData> {
    const response = await apiClient.get(`/api/v1/dashboard/revenue-chart?period=${period}`);
    return response.data.data;
  },

  async getTopProductsChart(limit: number = 5): Promise<ChartData> {
    const response = await apiClient.get(`/api/v1/dashboard/top-products?limit=${limit}`);
    return response.data.data;
  },

  async getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
    const response = await apiClient.get(`/api/v1/dashboard/recent-orders?limit=${limit}`);
    return response.data.data;
  },

  async getLowStockProducts(limit: number = 10): Promise<LowStockProduct[]> {
    const response = await apiClient.get(`/api/v1/dashboard/low-stock?limit=${limit}`);
    return response.data.data;
  },
};

export default dashboardService;

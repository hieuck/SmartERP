import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import dashboardService, {
  DashboardStats,
  ChartData,
  RecentOrder,
  LowStockProduct,
} from '../../services/api/dashboardService';

interface DashboardState {
  stats: DashboardStats | null;
  revenueChart: ChartData | null;
  topProductsChart: ChartData | null;
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  stats: null,
  revenueChart: null,
  topProductsChart: null,
  recentOrders: [],
  lowStockProducts: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async () => {
  return await dashboardService.getStats();
});

export const fetchRevenueChart = createAsyncThunk(
  'dashboard/fetchRevenueChart',
  async (period: 'week' | 'month' | 'year') => {
    return await dashboardService.getRevenueChart(period);
  },
);

export const fetchTopProductsChart = createAsyncThunk(
  'dashboard/fetchTopProductsChart',
  async () => {
    return await dashboardService.getTopProductsChart(5);
  },
);

export const fetchRecentOrders = createAsyncThunk('dashboard/fetchRecentOrders', async () => {
  return await dashboardService.getRecentOrders(5);
});

export const fetchLowStockProducts = createAsyncThunk(
  'dashboard/fetchLowStockProducts',
  async () => {
    return await dashboardService.getLowStockProducts(10);
  },
);

export const refreshDashboard = createAsyncThunk('dashboard/refresh', async (_, { dispatch }) => {
  await Promise.all([
    dispatch(fetchDashboardStats()),
    dispatch(fetchRevenueChart('week')),
    dispatch(fetchTopProductsChart()),
    dispatch(fetchRecentOrders()),
    dispatch(fetchLowStockProducts()),
  ]);
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch stats
    builder.addCase(fetchDashboardStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchDashboardStats.fulfilled,
      (state, action: PayloadAction<DashboardStats>) => {
        state.stats = action.payload;
        state.loading = false;
        state.lastUpdated = new Date().toISOString();
      },
    );
    builder.addCase(fetchDashboardStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch dashboard stats';
    });

    // Fetch revenue chart
    builder.addCase(fetchRevenueChart.fulfilled, (state, action: PayloadAction<ChartData>) => {
      state.revenueChart = action.payload;
    });

    // Fetch top products chart
    builder.addCase(fetchTopProductsChart.fulfilled, (state, action: PayloadAction<ChartData>) => {
      state.topProductsChart = action.payload;
    });

    // Fetch recent orders
    builder.addCase(fetchRecentOrders.fulfilled, (state, action: PayloadAction<RecentOrder[]>) => {
      state.recentOrders = action.payload;
    });

    // Fetch low stock products
    builder.addCase(
      fetchLowStockProducts.fulfilled,
      (state, action: PayloadAction<LowStockProduct[]>) => {
        state.lowStockProducts = action.payload;
      },
    );

    // Refresh dashboard
    builder.addCase(refreshDashboard.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(refreshDashboard.fulfilled, (state) => {
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    });
    builder.addCase(refreshDashboard.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to refresh dashboard';
    });
  },
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import ReportsPage from '../../pages/reports/ReportsPage';
import reportService from '../../services/report/reportService';

// Mock services
vi.mock('../../services/reportService', () => ({
  default: {
    getInventoryReport: vi.fn(),
    getSalesReport: vi.fn(),
    getFinancialReport: vi.fn(),
    exportInventoryToExcel: vi.fn(),
    exportInventoryToPDF: vi.fn(),
    getCurrentStock: vi.fn(),
    getStockMovement: vi.fn(),
    getLowStockProducts: vi.fn(),
    getRevenueByPeriod: vi.fn(),
    getRevenueByProduct: vi.fn(),
    getRevenueByCustomer: vi.fn(),
    getBestSellingProducts: vi.fn(),
    getPurchaseByPeriod: vi.fn(),
    getPurchaseByProduct: vi.fn(),
    getPurchaseBySupplier: vi.fn(),
    getAccountsReceivable: vi.fn(),
    getAccountsPayable: vi.fn(),
    getCashFlow: vi.fn(),
    getGrossProfit: vi.fn(),
    exportPDF: vi.fn(),
    exportExcel: vi.fn(),
  },
}));

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      isAuthenticated: true,
      user: { id: '1', username: 'test', email: 'test@test.com' },
      token: 'test-token',
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>,
  );
};

describe('Reports Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should display inventory report', async () => {
    vi.mocked(reportService.getInventoryReport).mockResolvedValue({
      data: [
        {
          productId: '1',
          productName: 'Product 1',
          sku: 'P001',
          quantity: 100,
          value: 10000000,
        },
        {
          productId: '2',
          productName: 'Product 2',
          sku: 'P002',
          quantity: 50,
          value: 5000000,
        },
      ],
      summary: {
        totalProducts: 2,
        totalQuantity: 150,
        totalValue: 15000000,
      },
    });

    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Báo cáo tồn kho')).toBeInTheDocument();
    });

    // Click generate button
    const generateButton = screen.getAllByText('Tạo báo cáo')[0];
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.getInventoryReport).toHaveBeenCalled();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  test('should display sales report', async () => {
    vi.mocked(reportService.getSalesReport).mockResolvedValue({
      data: [
        {
          date: '2024-01-01',
          orderCount: 10,
          revenue: 5000000,
          profit: 1000000,
        },
        {
          date: '2024-01-02',
          orderCount: 15,
          revenue: 7500000,
          profit: 1500000,
        },
      ],
      summary: {
        totalOrders: 25,
        totalRevenue: 12500000,
        totalProfit: 2500000,
      },
    });

    renderWithProviders(<ReportsPage />);

    // Switch to sales tab
    const salesTab = screen.getByText('Báo cáo bán hàng');
    fireEvent.click(salesTab);

    await waitFor(() => {
      expect(screen.getByText('Báo cáo doanh thu')).toBeInTheDocument();
    });

    // Click generate button
    const generateButton = screen.getAllByText('Tạo báo cáo')[0];
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.getSalesReport).toHaveBeenCalled();
    });
  });

  test('should display financial report', async () => {
    vi.mocked(reportService.getFinancialReport).mockResolvedValue({
      data: {
        revenue: 50000000,
        cost: 30000000,
        profit: 20000000,
        receivables: 10000000,
        payables: 5000000,
      },
    });

    renderWithProviders(<ReportsPage />);

    // Switch to financial tab
    const financialTab = screen.getByText('Báo cáo tài chính');
    fireEvent.click(financialTab);

    await waitFor(() => {
      expect(screen.getByText('Báo cáo công nợ')).toBeInTheDocument();
    });

    // Click generate button
    const generateButton = screen.getAllByText('Tạo báo cáo')[0];
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.getFinancialReport).toHaveBeenCalled();
    });
  });

  test('should export report to Excel', async () => {
    vi.mocked(reportService.getInventoryReport).mockResolvedValue({
      data: [
        {
          productId: '1',
          productName: 'Product 1',
          sku: 'P001',
          quantity: 100,
          value: 10000000,
        },
      ],
      summary: {
        totalProducts: 1,
        totalQuantity: 100,
        totalValue: 10000000,
      },
    });
    vi.mocked(reportService.exportInventoryToExcel).mockResolvedValue(new Blob());

    renderWithProviders(<ReportsPage />);

    // Generate report first
    const generateButton = screen.getAllByText('Tạo báo cáo')[0];
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByText('Xuất Excel');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(reportService.exportInventoryToExcel).toHaveBeenCalled();
    });
  });

  test('should export report to PDF', async () => {
    vi.mocked(reportService.getInventoryReport).mockResolvedValue({
      data: [
        {
          productId: '1',
          productName: 'Product 1',
          sku: 'P001',
          quantity: 100,
          value: 10000000,
        },
      ],
      summary: {
        totalProducts: 1,
        totalQuantity: 100,
        totalValue: 10000000,
      },
    });
    vi.mocked(reportService.exportInventoryToPDF).mockResolvedValue(new Blob());

    renderWithProviders(<ReportsPage />);

    // Generate report first
    const generateButton = screen.getAllByText('Tạo báo cáo')[0];
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByText('Xuất PDF');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(reportService.exportInventoryToPDF).toHaveBeenCalled();
    });
  });

  test('should filter report by date range', async () => {
    vi.mocked(reportService.getSalesReport).mockResolvedValue({
      data: [],
      summary: {
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
      },
    });

    renderWithProviders(<ReportsPage />);

    // Switch to sales tab
    const salesTab = screen.getByText('Báo cáo bán hàng');
    fireEvent.click(salesTab);

    await waitFor(() => {
      expect(screen.getByText('Báo cáo doanh thu')).toBeInTheDocument();
    });

    // Select date range
    const dateRangePicker = screen.getAllByPlaceholderText('Chọn ngày')[0];
    fireEvent.click(dateRangePicker);

    // Click generate button
    const generateButton = screen.getAllByText('Tạo báo cáo')[0];
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.getSalesReport).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String),
        }),
      );
    });
  });
});

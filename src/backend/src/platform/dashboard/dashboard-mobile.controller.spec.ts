import { Test, TestingModule } from '@nestjs/testing';
import { DashboardMobileController } from './dashboard-mobile.controller';
import { DashboardService } from './dashboard.service';
import { ChartPeriod } from './dto/mobile-chart.dto';
import { createMockUser } from '@/common/test/test-helpers';

describe('DashboardMobileController', () => {
  let controller: DashboardMobileController;
  let service: DashboardService;

  const mockDashboardService = {
    getMobileStats: jest.fn(),
    getRevenueChart: jest.fn(),
    getTopProducts: jest.fn(),
    getRecentOrders: jest.fn(),
    getLowStockProducts: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardMobileController],
      providers: [{ provide: DashboardService, useValue: mockDashboardService }],
    }).compile();

    controller = module.get<DashboardMobileController>(DashboardMobileController);
    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return mobile dashboard stats', async () => {
      const tenantId = 'tenant-123';
      const mockStats = {
        revenue: { today: 50000, week: 300000, month: 1200000 },
        orders: { today: 10, week: 50, month: 200, pending: 15 },
        inventory: { totalValue: 2000000, lowStockCount: 5, outOfStockCount: 2 },
        customers: { total: 100, new: 10 },
        receivables: 500000,
        payables: 300000,
      };
      mockDashboardService.getMobileStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(tenantId);

      expect(result).toEqual(mockStats);
      expect(service.getMobileStats).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getRevenueChart', () => {
    it('should return revenue chart', async () => {
      const tenantId = 'tenant-123';
      const mockChart = { labels: ['Mon', 'Tue'], values: [100000, 150000] };
      mockDashboardService.getRevenueChart.mockResolvedValue(mockChart);

      const result = await controller.getRevenueChart(tenantId, { period: ChartPeriod.WEEK });

      expect(result).toEqual(mockChart);
      expect(service.getRevenueChart).toHaveBeenCalledWith(tenantId, ChartPeriod.WEEK);
    });
  });

  describe('getTopProducts', () => {
    it('should return top 5 products', async () => {
      const tenantId = 'tenant-123';
      const mockProducts = [{ id: '1', name: 'Product A', quantity: 100, revenue: 500000 }];
      mockDashboardService.getTopProducts.mockResolvedValue(mockProducts);

      const result = await controller.getTopProducts(tenantId, {});

      expect(result).toBeDefined();
      expect(service.getTopProducts).toHaveBeenCalledWith(tenantId, 5);
    });
  });

  describe('getRecentOrders', () => {
    it('should return 5 recent orders', async () => {
      const tenantId = 'tenant-123';
      const mockOrders = [{ id: '1', orderNumber: 'ORD-001', customerName: 'Customer A', totalAmount: 100000, status: 'completed', createdAt: new Date() }];
      mockDashboardService.getRecentOrders.mockResolvedValue(mockOrders);

      const result = await controller.getRecentOrders(tenantId, {});

      expect(result).toEqual(mockOrders);
      expect(service.getRecentOrders).toHaveBeenCalledWith(tenantId, 5);
    });
  });

  describe('getLowStock', () => {
    it('should return 10 low stock products', async () => {
      const tenantId = 'tenant-123';
      const mockProducts = [{ id: '1', name: 'Product A', sku: 'SKU-001', currentStock: 5, minStock: 10, status: 'low' }];
      mockDashboardService.getLowStockProducts.mockResolvedValue(mockProducts);

      const result = await controller.getLowStock(tenantId, {});

      expect(result).toEqual(mockProducts);
      expect(service.getLowStockProducts).toHaveBeenCalledWith(tenantId, 10);
    });
  });
});

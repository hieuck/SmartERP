import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getOverview: jest.fn(),
    getSalesChart: jest.fn(),
    getTopProducts: jest.fn(),
    getTopCustomers: jest.fn(),
    getRevenueByCategory: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockDashboardService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return dashboard overview', async () => {
      const mockOverview = {
        revenue: { today: 100000, thisWeek: 500000, thisMonth: 2000000, growth: 15 },
        orders: { total: 150, pending: 20, completed: 120, cancelled: 10 },
        inventory: { totalProducts: 50, lowStock: 5, outOfStock: 2, totalValue: 1000000 },
        customers: { total: 100, active: 80, new: 10 },
        payments: { pending: 50000, completed: 950000, totalAmount: 1000000 },
      };
      mockDashboardService.getOverview.mockResolvedValue(mockOverview);

      const result = await controller.getOverview(mockUser);

      expect(result).toEqual(mockOverview);
      expect(service.getOverview).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getSalesChart', () => {
    it('should return sales chart with default 30 days', async () => {
      const mockData = [{ date: '2026-03-01', revenue: 100000, orders: 10 }];
      mockDashboardService.getSalesChart.mockResolvedValue(mockData);

      const result = await controller.getSalesChart(mockUser, {});

      expect(result).toEqual(mockData);
      expect(service.getSalesChart).toHaveBeenCalledWith(mockUser, 30);
    });
  });

  describe('getTopProducts', () => {
    it('should return top 10 products', async () => {
      const mockProducts = [{ id: '1', name: 'Product A', quantity: 100, revenue: 500000 }];
      mockDashboardService.getTopProducts.mockResolvedValue(mockProducts);

      const result = await controller.getTopProducts(mockUser, {});

      expect(result).toEqual(mockProducts);
      expect(service.getTopProducts).toHaveBeenCalledWith(mockUser, 10);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top 10 customers', async () => {
      const mockCustomers = [{ id: '1', name: 'Customer A', email: 'a@test.com', orders: 20, revenue: 1000000 }];
      mockDashboardService.getTopCustomers.mockResolvedValue(mockCustomers);

      const result = await controller.getTopCustomers(mockUser, {});

      expect(result).toEqual(mockCustomers);
      expect(service.getTopCustomers).toHaveBeenCalledWith(mockUser, 10);
    });
  });

  describe('getRevenueByCategory', () => {
    it('should return revenue by category', async () => {
      const mockRevenue = [{ categoryId: '1', categoryName: 'Electronics', revenue: 500000, percentage: 50 }];
      mockDashboardService.getRevenueByCategory.mockResolvedValue(mockRevenue);

      const result = await controller.getRevenueByCategory(mockUser);

      expect(result).toEqual(mockRevenue);
      expect(service.getRevenueByCategory).toHaveBeenCalledWith(mockUser);
    });
  });
});

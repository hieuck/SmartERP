import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('ReportController', () => {
  let controller: ReportController;
  let service: ReportService;

  const mockReportService = {
    getDashboardSummary: jest.fn(),
    getInventoryReport: jest.fn(),
    getLowStockReport: jest.fn(),
    getSalesReport: jest.fn(),
    getTopProducts: jest.fn(),
    getCustomerReport: jest.fn(),
    getMaterialsReport: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: mockReportService,
        },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary', async () => {
      const tenantId = 'tenant-123';
      const mockSummary = {
        totalRevenue: 100000,
        totalOrders: 50,
        totalCustomers: 25,
      };
      mockReportService.getDashboardSummary.mockResolvedValue(mockSummary);

      const result = await controller.getDashboardSummary(tenantId);

      expect(result).toEqual(mockSummary);
      expect(service.getDashboardSummary).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getInventoryReport', () => {
    it('should return inventory report', async () => {
      const tenantId = 'tenant-123';
      const mockReport = {
        totalItems: 100,
        totalValue: 50000,
      };
      mockReportService.getInventoryReport.mockResolvedValue(mockReport);

      const result = await controller.getInventoryReport(tenantId);

      expect(result).toEqual(mockReport);
      expect(service.getInventoryReport).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getLowStockReport', () => {
    it('should return low stock report', async () => {
      const tenantId = 'tenant-123';
      const mockReport = [
        { productId: '1', name: 'Product 1', stock: 5 },
        { productId: '2', name: 'Product 2', stock: 3 },
      ];
      mockReportService.getLowStockReport.mockResolvedValue(mockReport);

      const result = await controller.getLowStockReport(tenantId);

      expect(result).toEqual(mockReport);
      expect(service.getLowStockReport).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getSalesReport', () => {
    it('should return sales report for date range', async () => {
      const tenantId = 'tenant-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const mockReport = {
        totalSales: 100000,
        orderCount: 50,
      };
      mockReportService.getSalesReport.mockResolvedValue(mockReport);

      const result = await controller.getSalesReport(tenantId, startDate, endDate);

      expect(result).toEqual(mockReport);
      expect(service.getSalesReport).toHaveBeenCalledWith(
        tenantId,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('getTopProducts', () => {
    it('should return top products with default limit', async () => {
      const tenantId = 'tenant-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const mockProducts = [
        { productId: '1', name: 'Product 1', sales: 1000 },
        { productId: '2', name: 'Product 2', sales: 800 },
      ];
      mockReportService.getTopProducts.mockResolvedValue(mockProducts);

      const result = await controller.getTopProducts(tenantId, startDate, endDate);

      expect(result).toEqual(mockProducts);
      expect(service.getTopProducts).toHaveBeenCalledWith(
        tenantId,
        new Date(startDate),
        new Date(endDate),
        10,
      );
    });

    it('should return top products with custom limit', async () => {
      const tenantId = 'tenant-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const limit = 5;
      const mockProducts = [
        { productId: '1', name: 'Product 1', sales: 1000 },
      ];
      mockReportService.getTopProducts.mockResolvedValue(mockProducts);

      const result = await controller.getTopProducts(tenantId, startDate, endDate, limit);

      expect(result).toEqual(mockProducts);
      expect(service.getTopProducts).toHaveBeenCalledWith(
        tenantId,
        new Date(startDate),
        new Date(endDate),
        5,
      );
    });
  });

  describe('getCustomerReport', () => {
    it('should return customer report', async () => {
      const tenantId = 'tenant-123';
      const mockReport = {
        totalCustomers: 100,
        activeCustomers: 80,
      };
      mockReportService.getCustomerReport.mockResolvedValue(mockReport);

      const result = await controller.getCustomerReport(tenantId);

      expect(result).toEqual(mockReport);
      expect(service.getCustomerReport).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getMaterialsReport', () => {
    it('should return materials report', async () => {
      const tenantId = 'tenant-123';
      const mockReport = {
        totalMaterials: 50,
        totalValue: 25000,
      };
      mockReportService.getMaterialsReport.mockResolvedValue(mockReport);

      const result = await controller.getMaterialsReport(tenantId);

      expect(result).toEqual(mockReport);
      expect(service.getMaterialsReport).toHaveBeenCalledWith(tenantId);
    });
  });
});

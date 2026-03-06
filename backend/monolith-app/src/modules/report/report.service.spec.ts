import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { Product } from '../product/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Order } from '../order/entities/order.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Material } from '../production/entities/material.entity';
import { CacheService } from '@/common/cache/cache.service';

describe('ReportService', () => {
  let service: ReportService;
  // Unused repository variables - keeping for future test implementation

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockInventoryRepository = {
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockOrderRepository = {
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCustomerRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockMaterialRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn((key, factory) => factory()), // Call factory directly for testing
    invalidateEntity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockInventoryRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Material),
          useValue: mockMaterialRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventoryReport', () => {
    it('should return inventory report', async () => {
      const mockStats = {
        totalItems: '2',
        totalQuantity: '150',
        totalValue: '3000',
      };
      const mockInventory = [
        { id: '1', productId: 'p1', quantity: 100, totalValue: 2000 },
        { id: '2', productId: 'p2', quantity: 50, totalValue: 1000 },
      ];

      mockQueryBuilder.getRawOne.mockResolvedValueOnce(mockStats);
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockInventory);

      const result = await service.getInventoryReport('tenant-1');

      expect(result.totalItems).toBe(2);
      expect(result.totalQuantity).toBe(150);
      expect(result.totalValue).toBe(3000);
      expect(result.items).toEqual(mockInventory);
    });

    it('should handle empty inventory', async () => {
      const mockStats = {
        totalItems: '0',
        totalQuantity: null,
        totalValue: null,
      };

      mockQueryBuilder.getRawOne.mockResolvedValueOnce(mockStats);
      mockQueryBuilder.getMany.mockResolvedValueOnce([]);

      const result = await service.getInventoryReport('tenant-1');

      expect(result.totalItems).toBe(0);
      expect(result.totalQuantity).toBe(0);
      expect(result.totalValue).toBe(0);
    });
  });

  describe('getLowStockReport', () => {
    it('should return low stock items', async () => {
      const mockLowStock = [{ id: '1', productId: 'p1', quantity: 5, reservedQuantity: 3 }];

      mockQueryBuilder.getMany.mockResolvedValue(mockLowStock);

      const result = await service.getLowStockReport('tenant-1');

      expect(result.totalItems).toBe(1);
      expect(result.items).toEqual(mockLowStock);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inv.quantity <= inv.reservedQuantity + 10',
      );
    });
  });

  describe('getSalesReport', () => {
    it('should return sales report for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD001',
          totalAmount: 1000,
          status: 'completed',
          createdAt: new Date('2024-01-15'),
          customerId: 'c1',
        },
        {
          id: '2',
          orderNumber: 'ORD002',
          totalAmount: 1500,
          status: 'completed',
          createdAt: new Date('2024-01-20'),
          customerId: 'c2',
        },
      ];

      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        totalOrders: '2',
        totalRevenue: '2500',
        averageOrderValue: '1250',
      });
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockOrders);

      const result = await service.getSalesReport('tenant-1', startDate, endDate);

      expect(result.totalOrders).toBe(2);
      expect(result.totalRevenue).toBe(2500);
      expect(result.averageOrderValue).toBe(1250);
      expect(result.period).toEqual({ startDate, endDate });
      expect(result.sampleOrders).toEqual(mockOrders);
    });

    it('should handle no orders', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        totalOrders: '0',
        totalRevenue: null,
        averageOrderValue: null,
      });
      mockQueryBuilder.getMany.mockResolvedValueOnce([]);

      const result = await service.getSalesReport('tenant-1', startDate, endDate);

      expect(result.totalOrders).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
    });
  });

  describe('getTopProducts', () => {
    it('should return top products', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockProducts = [
        { id: '1', name: 'Product 1', sku: 'SKU001' },
        { id: '2', name: 'Product 2', sku: 'SKU002' },
      ];

      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.getTopProducts('tenant-1', startDate, endDate, 10);

      expect(result.products).toEqual(mockProducts);
      expect(result.period).toEqual({ startDate, endDate });
      expect(mockProductRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getCustomerReport', () => {
    it('should return customer report', async () => {
      const mockCustomers = [
        { id: '1', name: 'Customer 1', status: 'active' },
        { id: '2', name: 'Customer 2', status: 'active' },
        { id: '3', name: 'Customer 3', status: 'inactive' },
      ];
      const mockOrders = [
        { id: '1', customerId: '1' },
        { id: '2', customerId: '2' },
      ];

      mockCustomerRepository.find.mockResolvedValue(mockCustomers);
      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.getCustomerReport('tenant-1');

      expect(result.totalCustomers).toBe(3);
      expect(result.activeCustomers).toBe(2);
      expect(result.totalOrders).toBe(2);
      expect(result.customers).toEqual(mockCustomers);
    });
  });

  describe('getMaterialsReport', () => {
    it('should return materials report', async () => {
      const mockMaterials = [
        {
          id: '1',
          name: 'Material 1',
          stockQuantity: 100,
          purchasePrice: 10,
          reorderPoint: 20,
        },
        {
          id: '2',
          name: 'Material 2',
          stockQuantity: 15,
          purchasePrice: 20,
          reorderPoint: 20,
        },
        {
          id: '3',
          name: 'Material 3',
          stockQuantity: 50,
          purchasePrice: 15,
          reorderPoint: null,
        },
      ];

      mockMaterialRepository.find.mockResolvedValue(mockMaterials);

      const result = await service.getMaterialsReport('tenant-1');

      expect(result.totalMaterials).toBe(3);
      expect(result.totalValue).toBe(100 * 10 + 15 * 20 + 50 * 15);
      expect(result.lowStock).toBe(1); // Only material 2 is at/below reorder point
      expect(result.materials).toEqual(mockMaterials);
    });

    it('should handle materials without reorder points', async () => {
      const mockMaterials = [
        {
          id: '1',
          name: 'Material 1',
          stockQuantity: 100,
          purchasePrice: 10,
          reorderPoint: null,
        },
      ];

      mockMaterialRepository.find.mockResolvedValue(mockMaterials);

      const result = await service.getMaterialsReport('tenant-1');

      expect(result.lowStock).toBe(0);
    });
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary', async () => {
      const mockRecentOrders = [
        {
          id: '1',
          orderNumber: 'ORD001',
          totalAmount: 1000,
          status: 'completed',
          createdAt: new Date(),
          customerId: 'c1',
        },
        {
          id: '2',
          orderNumber: 'ORD002',
          totalAmount: 1500,
          status: 'completed',
          createdAt: new Date(),
          customerId: 'c2',
        },
      ];

      mockProductRepository.count.mockResolvedValue(50);
      mockInventoryRepository.count.mockResolvedValue(100);
      mockOrderRepository.count.mockResolvedValue(200);
      mockCustomerRepository.count.mockResolvedValue(30);
      mockMaterialRepository.count.mockResolvedValue(25);
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockRecentOrders);

      const result = await service.getDashboardSummary('tenant-1');

      expect(result.summary).toEqual({
        products: 50,
        inventory: 100,
        orders: 200,
        customers: 30,
        materials: 25,
        totalRevenue: 2500,
      });
      expect(result.recentOrders).toEqual(mockRecentOrders);
    });

    it('should handle zero counts', async () => {
      mockProductRepository.count.mockResolvedValue(0);
      mockInventoryRepository.count.mockResolvedValue(0);
      mockOrderRepository.count.mockResolvedValue(0);
      mockCustomerRepository.count.mockResolvedValue(0);
      mockMaterialRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValueOnce([]);

      const result = await service.getDashboardSummary('tenant-1');

      expect(result.summary.products).toBe(0);
      expect(result.summary.totalRevenue).toBe(0);
      expect(result.recentOrders).toEqual([]);
    });
  });
});

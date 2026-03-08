import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Order } from '../order/entities/order.entity';
import { Product } from '../product/entities/product.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Category } from '../category/entities/category.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { ChartPeriod } from './dto/mobile-chart.dto';
import { createMockUser } from '@/common/test/test-helpers';

describe('DashboardService', () => {
  let service: DashboardService;
  let orderRepository: Repository<Order>;
  let productRepository: Repository<Product>;
  let customerRepository: Repository<Customer>;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  };

  const mockOrderRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    count: jest.fn(),
  };

  const mockProductRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    count: jest.fn(),
  };

  const mockCustomerRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    count: jest.fn(),
  };

  const mockInventoryRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    count: jest.fn(),
  };

  const mockPaymentRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    count: jest.fn(),
  };

  const mockCategoryRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    getOrSet: jest.fn((key, callback) => callback()),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: getRepositoryToken(Product), useValue: mockProductRepository },
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepository },
        { provide: getRepositoryToken(Inventory), useValue: mockInventoryRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepository },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return dashboard overview with all stats', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: 1000000 });
      mockOrderRepository.count.mockResolvedValue(150);
      mockProductRepository.count.mockResolvedValue(50);
      mockCustomerRepository.count.mockResolvedValue(100);

      const result = await service.getOverview(tenantId);

      expect(result).toBeDefined();
      expect(result.revenue).toBeDefined();
      expect(result.orders).toBeDefined();
      expect(result.inventory).toBeDefined();
      expect(result.customers).toBeDefined();
      expect(result.payments).toBeDefined();
    });
  });

  describe('getMobileStats', () => {
    it('should return mobile dashboard stats', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: 500000 });
      mockOrderRepository.count.mockResolvedValue(75);
      mockCustomerRepository.count.mockResolvedValue(50);

      const result = await service.getMobileStats(tenantId);

      expect(result).toBeDefined();
      expect(result.revenue).toBeDefined();
      expect(result.orders).toBeDefined();
      expect(result.inventory).toBeDefined();
      expect(result.customers).toBeDefined();
    });
  });

  describe('getSalesChart', () => {
    it('should return sales chart data for 7 days', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { date: '2026-03-01', revenue: 100000, orders: 10 },
        { date: '2026-03-02', revenue: 150000, orders: 15 },
      ]);

      const result = await service.getSalesChart(tenantId, 7);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('order.tenantId = :tenantId', { tenantId });
    });
  });

  describe('getRevenueChart', () => {
    it('should return revenue chart for week period', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { date: '2026-03-01', revenue: 100000 },
      ]);

      const result = await service.getRevenueChart(tenantId, ChartPeriod.WEEK);

      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.values).toBeDefined();
    });
  });

  describe('getTopProducts', () => {
    it('should return top 10 selling products', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getMany.mockResolvedValue([
        { id: '1', name: 'Product A' },
      ]);

      const result = await service.getTopProducts(tenantId, 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top 10 customers', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { id: '1', name: 'Customer A', email: 'a@test.com', orders: 20, revenue: 1000000 },
      ]);

      const result = await service.getTopCustomers(tenantId, 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRevenueByCategory', () => {
    it('should return revenue by category', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { categoryId: '1', categoryName: 'Electronics', revenue: 500000, percentage: 50 },
      ]);

      const result = await service.getRevenueByCategory(tenantId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRecentOrders', () => {
    it('should return 5 recent orders', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getMany.mockResolvedValue([
        { 
          id: '1', 
          orderNumber: 'ORD-001', 
          totalAmount: 100000, 
          status: 'completed', 
          createdAt: new Date(),
          customer: { name: 'Customer A' }
        },
      ]);

      const result = await service.getRecentOrders(tenantId, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low stock products', async () => {
      const tenantId = 'tenant-123';
      mockQueryBuilder.getMany.mockResolvedValue([
        { 
          id: '1', 
          quantity: 5, 
          reorderPoint: 10,
          product: { id: '1', name: 'Product A', sku: 'SKU-001' }
        },
      ]);

      const result = await service.getLowStockProducts(tenantId, 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

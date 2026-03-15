import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Order } from '@/domains/sales/order/entities/order.entity';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Inventory } from '@/domains/inventory/stock/entities/inventory.entity';
import { Payment } from '@/domains/accounting/payment/entities/payment.entity';
import { CacheService } from '@/common/cache/cache.service';
import { User } from '@/common/security/permission.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let inventoryRepository: jest.Mocked<Repository<Inventory>>;
  let paymentRepository: jest.Mocked<Repository<Payment>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  } as any;

  const createQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    getCount: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Order),
          useValue: { count: jest.fn(), createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: { count: jest.fn(), createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: { count: jest.fn(), createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Inventory),
          useValue: { count: jest.fn(), createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: { count: jest.fn(), createQueryBuilder: jest.fn() },
        },
        { provide: CacheService, useValue: { getOrSet: jest.fn() } },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    orderRepository = module.get(getRepositoryToken(Order));
    productRepository = module.get(getRepositoryToken(Product));
    customerRepository = module.get(getRepositoryToken(Customer));
    inventoryRepository = module.get(getRepositoryToken(Inventory));
    paymentRepository = module.get(getRepositoryToken(Payment));
    cacheService = module.get(CacheService);
  });

  describe('getOverview', () => {
    it('should return dashboard overview', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const qb = createQueryBuilder();
      qb.getRawOne.mockResolvedValue({ total: '10000' });
      qb.getCount.mockResolvedValue(5);
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);
      orderRepository.count.mockResolvedValue(10);

      productRepository.count.mockResolvedValue(50);
      customerRepository.count.mockResolvedValue(20);
      customerRepository.createQueryBuilder.mockReturnValue(qb as any);
      inventoryRepository.createQueryBuilder.mockReturnValue(qb as any);
      paymentRepository.count.mockResolvedValue(15);
      paymentRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getOverview(mockUser);

      expect(result).toBeDefined();
      expect(result.revenue).toBeDefined();
      expect(result.orders).toBeDefined();
      expect(result.inventory).toBeDefined();
      expect(result.customers).toBeDefined();
      expect(result.payments).toBeDefined();
    });
  });

  describe('getSalesChart', () => {
    it('should return sales chart data', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const qb = createQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { date: '2024-01-01', revenue: '1000', orders: '5' },
        { date: '2024-01-02', revenue: '2000', orders: '10' },
      ]);
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getSalesChart(mockUser, 7);

      expect(result).toHaveLength(2);
      expect(result[0].revenue).toBe(1000);
      expect(result[0].orders).toBe(5);
    });
  });

  describe('getTopProducts', () => {
    it('should return top products', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const qb = createQueryBuilder();
      qb.getMany.mockResolvedValue([
        { id: 'prod-1', name: 'Product 1' },
        { id: 'prod-2', name: 'Product 2' },
      ]);
      productRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getTopProducts(mockUser, 5);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Product 1');
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const qb = createQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { id: 'cust-1', name: 'Customer 1', totalSpent: '5000', orderCount: '10' },
      ]);
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getTopCustomers(mockUser, 5);

      expect(result).toHaveLength(1);
      expect(result[0].totalSpent).toBe(5000);
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const qb = createQueryBuilder();
      qb.getMany.mockResolvedValue([
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          totalAmount: 1000,
          status: 'completed',
          createdAt: new Date(),
          customer: { name: 'Customer 1' },
        },
      ]);
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getRecentOrders(mockUser, 10);

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('ORD-001');
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low stock products', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const qb = createQueryBuilder();
      qb.getMany.mockResolvedValue([
        {
          id: 'inv-1',
          quantity: 5,
          reorderPoint: 10,
          product: { id: 'prod-1', name: 'Product 1', sku: 'SKU-001' },
        },
      ]);
      inventoryRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getLowStockProducts(mockUser, 10);

      expect(result).toHaveLength(1);
      expect(result[0].currentStock).toBe(5);
    });
  });
});

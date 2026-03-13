import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Order } from '@/domains/sales/order/entities/order.entity';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;
  let cacheService: {
    getOrSet: jest.Mock;
    del: jest.Mock;
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const mockCacheService = {
      getOrSet: jest.fn((key: string, fn: () => unknown) => fn()),
      del: jest.fn(),
    };

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should search across products, customers, and orders', async () => {
      const mockUser = createMockUser();

      const mockProducts = [
        {
          id: '1',
          name: 'Test Product',
          sku: 'SKU001',
          price: 100,
          description: 'Test description',
        },
      ];

      const mockCustomers = [
        {
          id: '2',
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '1234567890',
        },
      ];

      const mockOrders = [
        {
          id: '3',
          orderNumber: 'ORD001',
          totalAmount: 200,
          status: 'pending',
        },
      ];

      mockQueryBuilder.getMany
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce(mockCustomers)
        .mockResolvedValueOnce(mockOrders);

      const results = await service.search(mockUser, 'test');

      expect(results).toHaveLength(3);
      expect(results[0].type).toBe('product');
      expect(results[1].type).toBe('customer');
      expect(results[2].type).toBe('order');
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should use cache for search results', async () => {
      const mockUser = createMockUser();

      const cachedResults = [
        {
          type: 'product',
          id: '1',
          title: 'Cached Product',
          description: 'From cache',
        },
      ];

      cacheService.getOrSet.mockResolvedValue(cachedResults);

      const results = await service.search(mockUser, 'test');

      expect(results).toEqual(cachedResults);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('search'),
        expect.any(Function),
        300,
      );
    });
  });

  describe('searchByType', () => {
    it('should filter search results by type', async () => {
      const mockResults = [
        {
          type: 'product',
          id: '1',
          title: 'Product 1',
          description: 'Description 1',
        },
        {
          type: 'customer',
          id: '2',
          title: 'Customer 1',
          description: 'Description 2',
        },
      ];

      cacheService.getOrSet.mockImplementation((key, fn) => fn());
      jest.spyOn(service, 'search').mockResolvedValue(mockResults);

      const results = await service.searchByType('tenant1', 'product', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('product');
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should use cache for type-specific search', async () => {
      const cachedResults = [
        {
          type: 'product',
          id: '1',
          title: 'Cached Product',
          description: 'From cache',
        },
      ];

      cacheService.getOrSet.mockResolvedValue(cachedResults);

      const results = await service.searchByType('tenant1', 'product', 'test');

      expect(results).toEqual(cachedResults);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('search:tenant1:type:product:test'),
        expect.any(Function),
        300, // SHORT TTL (5 minutes)
      );
    });
  });
});

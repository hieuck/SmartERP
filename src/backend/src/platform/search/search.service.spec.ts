import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchService } from './search.service';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Order } from '@/domains/sales/order/entities/order.entity';
import { CacheService } from '@/common/cache/cache.service';
import { User } from '@/common/security/permission.service';
import { CacheTTL } from '@/common/cache/cache.config';

describe('SearchService', () => {
  let service: SearchService;
  let productRepository: jest.Mocked<Repository<Product>>;
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    sku: 'TEST-001',
    description: 'Test description',
    price: 100,
  };

  const mockCustomer = {
    id: 'customer-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
  };

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    totalAmount: 500,
    status: 'pending',
  };

  beforeEach(async () => {
    const mockProductRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockCustomerRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockOrderRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockCacheService = {
      getOrSet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    productRepository = module.get(getRepositoryToken(Product));
    customerRepository = module.get(getRepositoryToken(Customer));
    orderRepository = module.get(getRepositoryToken(Order));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should return cached results if available', async () => {
      const cachedResults = [
        { type: 'product', id: 'product-1', title: 'Test Product', description: 'SKU: TEST-001' },
      ];
      cacheService.getOrSet.mockResolvedValue(cachedResults);

      const result = await service.search(mockUser, 'test');

      expect(result).toEqual(cachedResults);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should search products by name, sku, and description', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };
      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      customerRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([]),
      } as any);
      orderRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      const result = await service.search(mockUser, 'test');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'product',
        id: 'product-1',
        title: 'Test Product',
        description: 'SKU: TEST-001 - Price: 100',
        metadata: { sku: 'TEST-001', price: 100 },
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :query OR product.sku ILIKE :query OR product.description ILIKE :query)',
        { query: '%test%' },
      );
    });

    it('should search customers by name, email, and phone', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      customerRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([mockCustomer]),
      } as any);
      orderRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      const result = await service.search(mockUser, 'john');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'customer',
        id: 'customer-1',
        title: 'John Doe',
        description: 'Email: john@example.com - Phone: 1234567890',
        metadata: { email: 'john@example.com', phone: '1234567890' },
      });
    });

    it('should search orders by order number', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      customerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      orderRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([mockOrder]),
      } as any);

      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      const result = await service.search(mockUser, 'ORD');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'order',
        id: 'order-1',
        title: 'Order ORD-001',
        description: 'Total: 500 - Status: pending',
        metadata: { orderNumber: 'ORD-001', total: 500, status: 'pending' },
      });
    });

    it('should return combined results from all entities', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };
      mockQueryBuilder.getMany
        .mockResolvedValueOnce([mockProduct])
        .mockResolvedValueOnce([mockCustomer])
        .mockResolvedValueOnce([mockOrder]);

      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      customerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      const result = await service.search(mockUser, 'test');

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.type)).toEqual(['product', 'customer', 'order']);
    });

    it('should return empty array when no results found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      customerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      const result = await service.search(mockUser, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should limit results to 10 per entity', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      customerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      await service.search(mockUser, 'test');

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledTimes(3); // Once for each entity
    });

    it('should use correct cache key with tenant and query', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      customerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      await service.search(mockUser, 'test query');

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('search:tenant-1:query:test query'),
        expect.any(Function),
        CacheTTL.SHORT,
      );
    });

    it('should handle special characters in search query', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      customerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      await service.search(mockUser, 'test@#$%');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(String),
        { query: '%test@#$%%' },
      );
    });
  });

  describe('searchByType', () => {
    it('should return only products when type is product', async () => {
      const allResults = [
        { type: 'product', id: 'product-1', title: 'Product', description: '' },
        { type: 'customer', id: 'customer-1', title: 'Customer', description: '' },
        { type: 'order', id: 'order-1', title: 'Order', description: '' },
      ];

      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        if (key.includes('type:product')) {
          return fn();
        }
        return allResults;
      });

      jest.spyOn(service, 'search').mockResolvedValue(allResults);

      const result = await service.searchByType('tenant-1', 'product', 'test');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('product');
    });

    it('should return only customers when type is customer', async () => {
      const allResults = [
        { type: 'product', id: 'product-1', title: 'Product', description: '' },
        { type: 'customer', id: 'customer-1', title: 'Customer', description: '' },
      ];

      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        if (key.includes('type:customer')) {
          return fn();
        }
        return allResults;
      });

      jest.spyOn(service, 'search').mockResolvedValue(allResults);

      const result = await service.searchByType('tenant-1', 'customer', 'test');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('customer');
    });

    it('should return only orders when type is order', async () => {
      const allResults = [
        { type: 'customer', id: 'customer-1', title: 'Customer', description: '' },
        { type: 'order', id: 'order-1', title: 'Order', description: '' },
      ];

      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        if (key.includes('type:order')) {
          return fn();
        }
        return allResults;
      });

      jest.spyOn(service, 'search').mockResolvedValue(allResults);

      const result = await service.searchByType('tenant-1', 'order', 'test');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('order');
    });

    it('should return empty array when no results match type', async () => {
      const allResults = [
        { type: 'product', id: 'product-1', title: 'Product', description: '' },
      ];

      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        if (key.includes('type:customer')) {
          return fn();
        }
        return allResults;
      });

      jest.spyOn(service, 'search').mockResolvedValue(allResults);

      const result = await service.searchByType('tenant-1', 'customer', 'test');

      expect(result).toEqual([]);
    });

    it('should use correct cache key with type', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());
      jest.spyOn(service, 'search').mockResolvedValue([]);

      await service.searchByType('tenant-1', 'product', 'test query');

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('search:tenant-1:type:product:test query'),
        expect.any(Function),
        CacheTTL.SHORT,
      );
    });

    it('should cache results with SHORT TTL', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());
      jest.spyOn(service, 'search').mockResolvedValue([]);

      await service.searchByType('tenant-1', 'product', 'test');

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        CacheTTL.SHORT,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheTTL } from '@/common/cache/cache.config';
import { CacheService } from '@/common/cache/cache.service';
import { User } from '@/common/security/permission.service';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Order } from '@/domains/sales/order/entities/order.entity';
import { Supplier } from '@/domains/purchasing/supplier/entities/supplier.entity';
import { PurchaseOrder } from '@/domains/purchasing/purchase-order/entities/purchase-order.entity';
import { SearchService } from './search.service';

type QueryBuilderMock<T> = {
  leftJoinAndSelect: jest.MockedFunction<(relation: string, alias: string) => QueryBuilderMock<T>>;
  where: jest.MockedFunction<(query: string, params?: Record<string, unknown>) => QueryBuilderMock<T>>;
  andWhere: jest.MockedFunction<
    (query: string, params?: Record<string, unknown>) => QueryBuilderMock<T>
  >;
  take: jest.MockedFunction<(limit: number) => QueryBuilderMock<T>>;
  getMany: jest.MockedFunction<() => Promise<T[]>>;
};

function createQueryBuilderMock<T>(results: T[]): QueryBuilderMock<T> {
  const builder = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn().mockResolvedValue(results),
  } as unknown as QueryBuilderMock<T>;

  builder.leftJoinAndSelect.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.andWhere.mockReturnValue(builder);
  builder.take.mockReturnValue(builder);

  return builder;
}

describe('SearchService', () => {
  let service: SearchService;
  let productRepository: jest.Mocked<Repository<Product>>;
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let supplierRepository: jest.Mocked<Repository<Supplier>>;
  let purchaseOrderRepository: jest.Mocked<Repository<PurchaseOrder>>;
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
    status: 'active',
  } as Product;

  const mockCustomer = {
    id: 'customer-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    status: 'active',
  } as Customer;

  const mockSupplier = {
    id: 'supplier-1',
    name: 'ACME Supply',
    email: 'supply@example.com',
    phone: '0987654321',
    status: 'active',
  } as Supplier;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'SO-001',
    totalAmount: 500,
    status: 'pending',
    createdAt: new Date('2026-03-20T09:00:00.000Z'),
  } as Order;

  const mockPurchaseOrder = {
    id: 'purchase-order-1',
    poNumber: 'PO-001',
    totalAmount: 900,
    status: 'confirmed',
    orderDate: new Date('2026-03-21T09:00:00.000Z'),
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
  } as PurchaseOrder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(Product),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: CacheService,
          useValue: { getOrSet: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    productRepository = module.get(getRepositoryToken(Product));
    customerRepository = module.get(getRepositoryToken(Customer));
    orderRepository = module.get(getRepositoryToken(Order));
    supplierRepository = module.get(getRepositoryToken(Supplier));
    purchaseOrderRepository = module.get(getRepositoryToken(PurchaseOrder));
    cacheService = module.get(CacheService);

    productRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]) as never);
    customerRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]) as never);
    orderRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]) as never);
    supplierRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]) as never);
    purchaseOrderRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]) as never);

    cacheService.getOrSet.mockImplementation(async (_key, factory) => factory());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('returns cached legacy results when cache resolves immediately', async () => {
      const cachedResults = [
        { type: 'product', id: 'product-1', title: 'Cached Product', description: 'cached' },
      ];
      cacheService.getOrSet.mockResolvedValue(cachedResults);

      const result = await service.search(mockUser, 'cached');

      expect(result).toEqual(cachedResults);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('search:tenant-1:query:cached'),
        expect.any(Function),
        CacheTTL.SHORT,
      );
    });

    it('combines products, customers, suppliers, and both order types into legacy results', async () => {
      productRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([mockProduct]) as never);
      customerRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockCustomer]) as never,
      );
      supplierRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockSupplier]) as never,
      );
      orderRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([mockOrder]) as never);
      purchaseOrderRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockPurchaseOrder]) as never,
      );

      const result = await service.search(mockUser, 'test');

      expect(result).toHaveLength(5);
      expect(result.map((item) => item.type)).toEqual([
        'product',
        'customer',
        'supplier',
        'order',
        'order',
      ]);
      expect(result[4]).toEqual({
        type: 'order',
        id: 'purchase-order-1',
        title: 'Purchase Order PO-001',
        description: 'Total: 900 - Status: confirmed',
        metadata: {
          orderNumber: 'PO-001',
          total: 900,
          status: 'confirmed',
          orderType: 'purchase',
        },
      });
    });

    it('returns an empty array for blank queries', async () => {
      const result = await service.search(mockUser, '   ');

      expect(result).toEqual([]);
      expect(cacheService.getOrSet).not.toHaveBeenCalled();
    });

    it('uses the expected ILIKE query when searching products', async () => {
      const builder = createQueryBuilderMock([mockProduct]);
      productRepository.createQueryBuilder.mockReturnValue(builder as never);

      await service.search(mockUser, 'laptop');

      expect(builder.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :query OR product.sku ILIKE :query OR product.description ILIKE :query)',
        { query: '%laptop%' },
      );
      expect(builder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('searchByType', () => {
    it('returns only supplier results for supplier type', async () => {
      supplierRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockSupplier]) as never,
      );

      const result = await service.searchByType('tenant-1', 'supplier', 'acme');

      expect(result).toEqual([
        {
          type: 'supplier',
          id: 'supplier-1',
          title: 'ACME Supply',
          description: 'Email: supply@example.com - Phone: 0987654321',
          metadata: {
            email: 'supply@example.com',
            phone: '0987654321',
            status: 'active',
          },
        },
      ]);
    });

    it('returns both sales and purchase order results for order type', async () => {
      orderRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([mockOrder]) as never);
      purchaseOrderRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockPurchaseOrder]) as never,
      );

      const result = await service.searchByType('tenant-1', 'order', 'SO');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Sales Order SO-001');
      expect(result[1].title).toBe('Purchase Order PO-001');
    });

    it('returns an empty array for unknown search types', async () => {
      const result = await service.searchByType('tenant-1', 'unknown', 'test');

      expect(result).toEqual([]);
    });
  });

  describe('compatibility responses', () => {
    it('returns Elasticsearch-like hits for global search', async () => {
      productRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([mockProduct]) as never);
      customerRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockCustomer]) as never,
      );
      orderRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([mockOrder]) as never);
      purchaseOrderRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockPurchaseOrder]) as never,
      );

      const result = await service.globalSearch(mockUser, 'order', 0, 10);

      expect(result.hits.total.value).toBe(4);
      expect(result.hits.hits[0]).toEqual({
        _id: 'product-1',
        _index: 'products',
        _score: 1,
        _source: {
          name: 'Test Product',
          sku: 'TEST-001',
          price: 100,
          salePrice: 100,
          status: 'active',
        },
      });
      expect(result.hits.hits[3]).toEqual({
        _id: 'purchase-order-1',
        _index: 'orders',
        _score: 1,
        _source: {
          code: 'PO-001',
          orderNumber: 'PO-001',
          poNumber: 'PO-001',
          totalAmount: 900,
          orderDate: mockPurchaseOrder.orderDate,
          status: 'confirmed',
          type: 'purchase',
        },
      });
    });

    it('returns supplier hits for supplier search', async () => {
      supplierRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockSupplier]) as never,
      );

      const result = await service.searchSuppliers('tenant-1', 'acme');

      expect(result).toEqual({
        hits: {
          total: { value: 1 },
          hits: [
            {
              _id: 'supplier-1',
              _index: 'suppliers',
              _score: 1,
              _source: {
                name: 'ACME Supply',
                email: 'supply@example.com',
                phone: '0987654321',
                status: 'active',
              },
            },
          ],
        },
      });
    });

    it('returns combined order hits with the route-friendly type discriminator', async () => {
      orderRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([mockOrder]) as never);
      purchaseOrderRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([mockPurchaseOrder]) as never,
      );

      const result = await service.searchOrders('tenant-1', 'order');

      expect(result.hits.total.value).toBe(2);
      expect(result.hits.hits.map((hit) => hit._source.type)).toEqual(['sales', 'purchase']);
    });
  });
});

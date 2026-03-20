import { HttpException, HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { SearchController } from './search.controller';
import { SearchResponse, SearchService, SearchResult } from './search.service';

describe('SearchController (Integration)', () => {
  let app: INestApplication;
  let searchService: jest.Mocked<SearchService>;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const mockSearchResults: SearchResult[] = [
    {
      type: 'product',
      id: 'product-123',
      title: 'Laptop Dell XPS 15',
      description: 'SKU: DELL-XPS-15 - Price: 25000000',
      metadata: { sku: 'DELL-XPS-15', price: 25000000 },
    },
    {
      type: 'customer',
      id: 'customer-123',
      title: 'John Doe',
      description: 'Email: john@example.com - Phone: 0123456789',
      metadata: { email: 'john@example.com', phone: '0123456789' },
    },
    {
      type: 'order',
      id: 'order-123',
      title: 'Sales Order ORD-001',
      description: 'Total: 50000000 - Status: completed',
      metadata: { orderNumber: 'ORD-001', total: 50000000, status: 'completed' },
    },
  ];

  const mockCompatResponse: SearchResponse = {
    hits: {
      total: { value: 2 },
      hits: [
        {
          _id: 'product-123',
          _index: 'products',
          _score: 1,
          _source: {
            name: 'Laptop Dell XPS 15',
            sku: 'DELL-XPS-15',
            price: 25000000,
            salePrice: 25000000,
            status: 'active',
          },
        },
        {
          _id: 'order-123',
          _index: 'orders',
          _score: 1,
          _source: {
            code: 'ORD-001',
            orderNumber: 'ORD-001',
            totalAmount: 50000000,
            orderDate: '2026-03-20T09:00:00.000Z',
            status: 'completed',
            type: 'sales',
          },
        },
      ],
    },
  };

  beforeAll(async () => {
    const mockSearchService = {
      search: jest.fn(),
      searchByType: jest.fn(),
      globalSearch: jest.fn(),
      searchProducts: jest.fn(),
      searchCustomers: jest.fn(),
      searchSuppliers: jest.fn(),
      searchOrders: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const httpRequest = context.switchToHttp().getRequest();
        const authHeader = httpRequest.headers.authorization;

        if (authHeader?.startsWith('Bearer ')) {
          httpRequest.user = mockUser;
          return true;
        }

        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    searchService = moduleFixture.get(SearchService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /search', () => {
    it('returns legacy search results for a query', async () => {
      searchService.search.mockResolvedValue(mockSearchResults);

      const response = await request(app.getHttpServer())
        .get('/search?q=laptop')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockSearchResults);
      expect(searchService.search).toHaveBeenCalledWith(mockUser, 'laptop');
    });

    it('passes through encoded unicode queries', async () => {
      const unicodeQuery = 'máy tính 🔍';
      searchService.search.mockResolvedValue([mockSearchResults[0]]);

      await request(app.getHttpServer())
        .get(`/search?q=${encodeURIComponent(unicodeQuery)}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, unicodeQuery);
    });

    it('requires authentication', async () => {
      await request(app.getHttpServer()).get('/search?q=test').expect(401);
    });

    it('surfaces service errors', async () => {
      searchService.search.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/search?q=test')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /search/by-type', () => {
    it('filters legacy results by type', async () => {
      searchService.searchByType.mockResolvedValue([mockSearchResults[0]]);

      const response = await request(app.getHttpServer())
        .get('/search/by-type?type=product&q=laptop')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([mockSearchResults[0]]);
      expect(searchService.searchByType).toHaveBeenCalledWith('tenant-123', 'product', 'laptop');
    });

    it('allows empty query values without crashing', async () => {
      searchService.searchByType.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/search/by-type?type=product&q=')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.searchByType).toHaveBeenCalledWith('tenant-123', 'product', '');
    });
  });

  describe('GET /search/global and compatibility endpoints', () => {
    it('returns Elasticsearch-like results for global search', async () => {
      searchService.globalSearch.mockResolvedValue(mockCompatResponse);

      const response = await request(app.getHttpServer())
        .get('/search/global?q=laptop&from=0&size=10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockCompatResponse);
      expect(searchService.globalSearch).toHaveBeenCalledWith(mockUser, 'laptop', 0, 10);
    });

    it('proxies compatibility product search', async () => {
      searchService.searchProducts.mockResolvedValue(mockCompatResponse);

      const response = await request(app.getHttpServer())
        .get('/search/products?q=laptop')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockCompatResponse);
      expect(searchService.searchProducts).toHaveBeenCalledWith('tenant-123', 'laptop');
    });

    it('proxies compatibility customer, supplier, and order searches', async () => {
      searchService.searchCustomers.mockResolvedValue(mockCompatResponse);
      searchService.searchSuppliers.mockResolvedValue(mockCompatResponse);
      searchService.searchOrders.mockResolvedValue(mockCompatResponse);

      await request(app.getHttpServer())
        .get('/search/customers?q=john')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      await request(app.getHttpServer())
        .get('/search/suppliers?q=acme')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      await request(app.getHttpServer())
        .get('/search/orders?q=SO-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.searchCustomers).toHaveBeenCalledWith('tenant-123', 'john');
      expect(searchService.searchSuppliers).toHaveBeenCalledWith('tenant-123', 'acme');
      expect(searchService.searchOrders).toHaveBeenCalledWith('tenant-123', 'SO-001');
    });

    it('requires authentication for compatibility routes too', async () => {
      await request(app.getHttpServer()).get('/search/global?q=test').expect(401);
      await request(app.getHttpServer()).get('/search/orders?q=test').expect(401);
    });
  });
});

/**
 * SearchController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * 1. GET /search?q=xxx - Global search
 * 2. GET /search/by-type?type=xxx&q=xxx - Search by type
 * 3. Authentication tests
 * 4. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { SearchController } from './search.controller';
import { SearchService, SearchResult } from './search.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

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
      title: 'Order ORD-001',
      description: 'Total: 50000000 - Status: completed',
      metadata: { orderNumber: 'ORD-001', total: 50000000, status: 'completed' },
    },
  ];

  beforeAll(async () => {
    const mockSearchService = {
      search: jest.fn(),
      searchByType: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
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
    it('should return search results for query', async () => {
      searchService.search.mockResolvedValue(mockSearchResults);

      const response = await request(app.getHttpServer())
        .get('/search?q=laptop')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockSearchResults);
      expect(searchService.search).toHaveBeenCalledWith(mockUser, 'laptop');
    });

    it('should return results for different entity types', async () => {
      searchService.search.mockResolvedValue(mockSearchResults);

      const response = await request(app.getHttpServer())
        .get('/search?q=test')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body.map((r: SearchResult) => r.type)).toEqual([
        'product',
        'customer',
        'order',
      ]);
    });

    it('should return empty array when no results', async () => {
      searchService.search.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/search?q=nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle search with special characters', async () => {
      searchService.search.mockResolvedValue([mockSearchResults[0]]);

      await request(app.getHttpServer())
        .get('/search?q=laptop%20%26%20accessories')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, 'laptop & accessories');
    });

    it('should handle search with Vietnamese characters', async () => {
      searchService.search.mockResolvedValue([mockSearchResults[0]]);

      await request(app.getHttpServer())
        .get('/search?q=máy%20tính')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, 'máy tính');
    });

    it('should handle empty query string', async () => {
      searchService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/search?q=')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, '');
    });

    it('should handle very long query string', async () => {
      const longQuery = 'a'.repeat(500);
      searchService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get(`/search?q=${longQuery}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, longQuery);
    });

    it('should handle query with numbers', async () => {
      searchService.search.mockResolvedValue([mockSearchResults[2]]);

      await request(app.getHttpServer())
        .get('/search?q=ORD-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, 'ORD-001');
    });

    it('should handle query with email format', async () => {
      searchService.search.mockResolvedValue([mockSearchResults[1]]);

      await request(app.getHttpServer())
        .get('/search?q=john@example.com')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, 'john@example.com');
    });

    it('should handle query with phone number', async () => {
      searchService.search.mockResolvedValue([mockSearchResults[1]]);

      await request(app.getHttpServer())
        .get('/search?q=0123456789')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, '0123456789');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/search?q=test').expect(401);
    });

    it('should handle service errors', async () => {
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
    it('should return search results filtered by type', async () => {
      const productResults = [mockSearchResults[0]];
      searchService.searchByType.mockResolvedValue(productResults);

      const response = await request(app.getHttpServer())
        .get('/search/by-type?type=product&q=laptop')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(productResults);
      expect(searchService.searchByType).toHaveBeenCalledWith('tenant-123', 'product', 'laptop');
    });

    it('should search customers by type', async () => {
      const customerResults = [mockSearchResults[1]];
      searchService.searchByType.mockResolvedValue(customerResults);

      const response = await request(app.getHttpServer())
        .get('/search/by-type?type=customer&q=john')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(customerResults);
      expect(searchService.searchByType).toHaveBeenCalledWith('tenant-123', 'customer', 'john');
    });

    it('should search orders by type', async () => {
      const orderResults = [mockSearchResults[2]];
      searchService.searchByType.mockResolvedValue(orderResults);

      const response = await request(app.getHttpServer())
        .get('/search/by-type?type=order&q=ORD-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(orderResults);
      expect(searchService.searchByType).toHaveBeenCalledWith('tenant-123', 'order', 'ORD-001');
    });

    it('should return empty array when no results for type', async () => {
      searchService.searchByType.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/search/by-type?type=product&q=nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle unknown entity type', async () => {
      searchService.searchByType.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/search/by-type?type=unknown&q=test')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle empty query with type filter', async () => {
      searchService.searchByType.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/search/by-type?type=product&q=')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.searchByType).toHaveBeenCalledWith('tenant-123', 'product', '');
    });

    it('should handle special characters in type search', async () => {
      searchService.searchByType.mockResolvedValue([mockSearchResults[0]]);

      await request(app.getHttpServer())
        .get('/search/by-type?type=product&q=laptop%20%26%20mouse')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.searchByType).toHaveBeenCalledWith(
        'tenant-123',
        'product',
        'laptop & mouse',
      );
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/search/by-type?type=product&q=test').expect(401);
    });

    it('should handle service errors', async () => {
      searchService.searchByType.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/search/by-type?type=product&q=test')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent search requests', async () => {
      searchService.search.mockResolvedValue(mockSearchResults);

      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/search?q=test')
            .set('Authorization', 'Bearer valid-token'),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle search with SQL injection attempts', async () => {
      const maliciousQuery = "'; DROP TABLE products; --";
      searchService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get(`/search?q=${encodeURIComponent(maliciousQuery)}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, maliciousQuery);
    });

    it('should handle search with XSS attempts', async () => {
      const xssQuery = '<script>alert("XSS")</script>';
      searchService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get(`/search?q=${encodeURIComponent(xssQuery)}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, xssQuery);
    });

    it('should handle search with wildcard characters', async () => {
      searchService.search.mockResolvedValue([mockSearchResults[0]]);

      await request(app.getHttpServer())
        .get('/search?q=laptop%25')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, 'laptop%');
    });

    it('should handle search with regex special characters', async () => {
      const regexQuery = 'product.*[0-9]+';
      searchService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get(`/search?q=${encodeURIComponent(regexQuery)}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, regexQuery);
    });

    it('should handle search with unicode characters', async () => {
      const unicodeQuery = '🔍 search emoji';
      searchService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get(`/search?q=${encodeURIComponent(unicodeQuery)}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, unicodeQuery);
    });

    it('should handle search with multiple spaces', async () => {
      const spacedQuery = 'laptop    dell    xps';
      searchService.search.mockResolvedValue([mockSearchResults[0]]);

      await request(app.getHttpServer())
        .get(`/search?q=${encodeURIComponent(spacedQuery)}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, spacedQuery);
    });

    it('should handle search with leading/trailing spaces', async () => {
      const trimQuery = '  laptop  ';
      searchService.search.mockResolvedValue([mockSearchResults[0]]);

      await request(app.getHttpServer())
        .get(`/search?q=${encodeURIComponent(trimQuery)}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, trimQuery);
    });

    it('should handle search with case variations', async () => {
      const queries = ['LAPTOP', 'laptop', 'LaPtOp'];

      for (const query of queries) {
        searchService.search.mockResolvedValue([mockSearchResults[0]]);

        await request(app.getHttpServer())
          .get(`/search?q=${query}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(searchService.search).toHaveBeenCalledWith(mockUser, query);
      }
    });

    it('should handle search with numeric-only query', async () => {
      searchService.search.mockResolvedValue([mockSearchResults[2]]);

      await request(app.getHttpServer())
        .get('/search?q=123456')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, '123456');
    });

    it('should handle rapid successive searches', async () => {
      searchService.search.mockResolvedValue(mockSearchResults);

      const queries = ['a', 'ab', 'abc', 'abcd', 'abcde'];

      for (const query of queries) {
        await request(app.getHttpServer())
          .get(`/search?q=${query}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);
      }

      expect(searchService.search).toHaveBeenCalledTimes(5);
    });

    it('should handle search with URL-encoded characters', async () => {
      searchService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/search?q=product%2Fcategory')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, 'product/category');
    });

    it('should handle search results with complex metadata', async () => {
      const complexResult: SearchResult = {
        type: 'product',
        id: 'product-456',
        title: 'Complex Product',
        description: 'Product with complex metadata',
        metadata: {
          sku: 'PROD-456',
          price: 1000000,
          stock: 50,
          categories: ['electronics', 'computers'],
          attributes: {
            brand: 'Dell',
            model: 'XPS 15',
            specs: {
              cpu: 'Intel i7',
              ram: '16GB',
              storage: '512GB SSD',
            },
          },
        },
      };

      searchService.search.mockResolvedValue([complexResult]);

      const response = await request(app.getHttpServer())
        .get('/search?q=complex')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body[0].metadata).toEqual(complexResult.metadata);
    });

    it('should handle search with missing query parameter', async () => {
      searchService.search.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/search')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.search).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should handle type search with missing type parameter', async () => {
      searchService.searchByType.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/search/by-type?q=test')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(searchService.searchByType).toHaveBeenCalledWith('tenant-123', undefined, 'test');
    });
  });
});

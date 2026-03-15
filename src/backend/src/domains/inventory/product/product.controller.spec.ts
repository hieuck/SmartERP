/**
 * ProductController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases cover all 18 endpoints:
 * POST /products, GET /products, GET /products/count, GET /products/search,
 * GET /products/low-stock, GET /products/featured, GET /products/sku/:sku,
 * GET /products/:id, PUT /products/:id, PATCH /products/:id,
 * PATCH /products/:id/stock, PATCH /products/:id/stock/adjust,
 * PATCH /products/:id/activate, PATCH /products/:id/deactivate,
 * DELETE /products/:id
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { ProductStatus } from './enums/product-status.enum';

describe('ProductController (Integration)', () => {
  let app: INestApplication;
  let productService: jest.Mocked<ProductService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };

  const mockProduct = {
    id: 'prod-123',
    sku: 'PROD-001',
    name: 'Laptop Pro 15',
    description: 'High-performance laptop',
    categoryId: 'cat-123',
    price: 25000000,
    costPrice: 20000000,
    stockQuantity: 50,
    minStockLevel: 10,
    status: ProductStatus.ACTIVE,
    isActive: true,
    isFeatured: false,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockProductService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findBySku: jest.fn(),
      findByCategory: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
      countByStatus: jest.fn(),
      updateStock: jest.fn(),
      adjustStock: jest.fn(),
      getLowStockProducts: jest.fn(),
      getFeaturedProducts: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (
          authHeader &&
          authHeader.startsWith('Bearer ') &&
          authHeader !== 'Bearer invalid-token'
        ) {
          request.user = mockUser;
          return true;
        }
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockProductService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    productService = moduleFixture.get(ProductService);
  });

  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /products', () => {
    it('should create product successfully', async () => {
      productService.create.mockResolvedValue(mockProduct as any);
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send({ sku: 'PROD-002', name: 'New Product', price: 1000000 })
        .expect(201);
      expect(response.body).toEqual(mockProduct);
    });

    it('should return 409 when SKU exists', async () => {
      productService.create.mockRejectedValue(
        new HttpException("Product with SKU 'PROD-001' already exists", HttpStatus.CONFLICT),
      );
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', 'Bearer valid-token')
        .send({ sku: 'PROD-001', name: 'Product' })
        .expect(409);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).post('/products').send({ sku: 'PROD-001' }).expect(401);
    });
  });

  describe('GET /products', () => {
    it('should get all products', async () => {
      productService.findAll.mockResolvedValue([mockProduct] as any);
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toEqual([mockProduct]);
    });

    it('should filter by status', async () => {
      productService.findByStatus.mockResolvedValue([mockProduct] as any);
      await request(app.getHttpServer())
        .get('/products?status=ACTIVE')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(productService.findByStatus).toHaveBeenCalledWith(mockUser, ProductStatus.ACTIVE);
    });

    it('should filter by category', async () => {
      productService.findByCategory.mockResolvedValue([mockProduct] as any);
      await request(app.getHttpServer())
        .get('/products?categoryId=cat-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(productService.findByCategory).toHaveBeenCalledWith(mockUser, 'cat-123');
    });
  });

  describe('GET /products/count', () => {
    it('should get product count', async () => {
      productService.count.mockResolvedValue(100);
      const response = await request(app.getHttpServer())
        .get('/products/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toBe(100);
    });

    it('should count by status', async () => {
      productService.countByStatus.mockResolvedValue(50);
      await request(app.getHttpServer())
        .get('/products/count?status=ACTIVE')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(productService.countByStatus).toHaveBeenCalledWith(mockUser, ProductStatus.ACTIVE);
    });
  });

  describe('GET /products/search', () => {
    it('should search products', async () => {
      productService.search.mockResolvedValue([mockProduct] as any);
      await request(app.getHttpServer())
        .get('/products/search?q=laptop')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(productService.search).toHaveBeenCalledWith(mockUser, 'laptop');
    });
  });

  describe('GET /products/low-stock', () => {
    it('should get low stock products', async () => {
      productService.getLowStockProducts.mockResolvedValue([mockProduct] as any);
      await request(app.getHttpServer())
        .get('/products/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /products/featured', () => {
    it('should get featured products', async () => {
      productService.getFeaturedProducts.mockResolvedValue([mockProduct] as any);
      await request(app.getHttpServer())
        .get('/products/featured')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /products/sku/:sku', () => {
    it('should get product by SKU', async () => {
      productService.findBySku.mockResolvedValue(mockProduct as any);
      const response = await request(app.getHttpServer())
        .get('/products/sku/PROD-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toEqual(mockProduct);
    });

    it('should return 404 when SKU not found', async () => {
      productService.findBySku.mockRejectedValue(
        new HttpException("Product with SKU 'PROD-999' not found", HttpStatus.NOT_FOUND),
      );
      await request(app.getHttpServer())
        .get('/products/sku/PROD-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /products/:id', () => {
    it('should get product by ID', async () => {
      productService.findOne.mockResolvedValue(mockProduct as any);
      const response = await request(app.getHttpServer())
        .get('/products/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toEqual(mockProduct);
    });

    it('should return 404 when ID not found', async () => {
      productService.findOne.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );
      await request(app.getHttpServer())
        .get('/products/prod-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update product', async () => {
      const updated = { ...mockProduct, name: 'Updated Product' };
      productService.update.mockResolvedValue(updated as any);
      const response = await request(app.getHttpServer())
        .put('/products/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated Product' })
        .expect(200);
      expect(response.body.name).toBe('Updated Product');
    });
  });

  describe('PATCH /products/:id', () => {
    it('should partially update product', async () => {
      const updated = { ...mockProduct, price: 30000000 };
      productService.update.mockResolvedValue(updated as any);
      const response = await request(app.getHttpServer())
        .patch('/products/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ price: 30000000 })
        .expect(200);
      expect(response.body.price).toBe(30000000);
    });
  });

  describe('PATCH /products/:id/stock', () => {
    it('should update stock', async () => {
      const updated = { ...mockProduct, stockQuantity: 100 };
      productService.updateStock.mockResolvedValue(updated as any);
      await request(app.getHttpServer())
        .patch('/products/prod-123/stock')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 100 })
        .expect(200);
      expect(productService.updateStock).toHaveBeenCalledWith(mockUser, 'prod-123', 100);
    });
  });

  describe('PATCH /products/:id/stock/adjust', () => {
    it('should adjust stock', async () => {
      const updated = { ...mockProduct, stockQuantity: 60 };
      productService.adjustStock.mockResolvedValue(updated as any);
      await request(app.getHttpServer())
        .patch('/products/prod-123/stock/adjust')
        .set('Authorization', 'Bearer valid-token')
        .send({ adjustment: 10 })
        .expect(200);
      expect(productService.adjustStock).toHaveBeenCalledWith(mockUser, 'prod-123', 10);
    });

    it('should return 400 when insufficient stock', async () => {
      productService.adjustStock.mockRejectedValue(
        new HttpException('Insufficient stock', HttpStatus.BAD_REQUEST),
      );
      await request(app.getHttpServer())
        .patch('/products/prod-123/stock/adjust')
        .set('Authorization', 'Bearer valid-token')
        .send({ adjustment: -1000 })
        .expect(400);
    });
  });

  describe('PATCH /products/:id/activate', () => {
    it('should activate product', async () => {
      const activated = { ...mockProduct, isActive: true };
      productService.activate.mockResolvedValue(activated as any);
      await request(app.getHttpServer())
        .patch('/products/prod-123/activate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('PATCH /products/:id/deactivate', () => {
    it('should deactivate product', async () => {
      const deactivated = { ...mockProduct, isActive: false };
      productService.deactivate.mockResolvedValue(deactivated as any);
      await request(app.getHttpServer())
        .patch('/products/prod-123/deactivate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete product', async () => {
      productService.remove.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .delete('/products/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body.message).toBe('Product deleted successfully');
    });

    it('should return 404 when not found', async () => {
      productService.remove.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );
      await request(app.getHttpServer())
        .delete('/products/prod-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });
});

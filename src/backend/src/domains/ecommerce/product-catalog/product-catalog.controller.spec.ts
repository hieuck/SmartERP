/**
 * ProductCatalogController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. POST /ecommerce/products - Create product
 * 2. GET /ecommerce/products - Search products with filters
 * 3. GET /ecommerce/products/:id - Get product by ID
 * 4. GET /ecommerce/products/sku/:sku - Get product by SKU
 * 5. GET /ecommerce/products/slug/:slug - Get product by slug
 * 6. PATCH /ecommerce/products/:id - Update product
 * 7. DELETE /ecommerce/products/:id - Delete product
 * 8. PATCH /ecommerce/products/:id/publish - Publish product
 * 9. PATCH /ecommerce/products/:id/unpublish - Unpublish product
 * 10. PATCH /ecommerce/products/:id/stock - Update stock
 * 11. GET /ecommerce/products/inventory/low-stock - Get low stock products
 * 12. GET /ecommerce/products/inventory/out-of-stock - Get out of stock products
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ProductCatalogController } from './product-catalog.controller';
import { ProductCatalogService } from './product-catalog.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';
import { ProductStatus } from './enums/product-status.enum';

describe('ProductCatalogController (Integration)', () => {
  let app: INestApplication;
  let productService: jest.Mocked<ProductCatalogService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };

  const mockProduct = {
    id: 'prod-123',
    sku: 'PROD-001',
    slug: 'test-product',
    name: 'Test Product',
    description: 'Test description',
    price: 100000,
    compareAtPrice: 150000,
    costPrice: 50000,
    stockQuantity: 100,
    minStockLevel: 10,
    trackInventory: true,
    isPublished: true,
    status: ProductStatus.ACTIVE,
    categoryId: 'cat-1',
    tags: ['electronics', 'gadgets'],
    featuredImage: 'image.jpg',
    images: ['image1.jpg', 'image2.jpg'],
    displayOrder: 1,
    tenantId: 'tenant-123',
    createdAt: new Date(),
  };

  const mockCreateProductDto = {
    sku: 'PROD-001',
    name: 'Test Product',
    description: 'Test description',
    price: 100000,
    compareAtPrice: 150000,
    costPrice: 50000,
    stockQuantity: 100,
    minStockLevel: 10,
    trackInventory: true,
    categoryId: 'cat-1',
    tags: ['electronics', 'gadgets'],
  };

  beforeAll(async () => {
    const mockProductService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findBySku: jest.fn(),
      findBySlug: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      publish: jest.fn(),
      unpublish: jest.fn(),
      updateStock: jest.fn(),
      findLowStock: jest.fn(),
      findOutOfStock: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader !== 'Bearer invalid-token') {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        
        // Allow admin and manager roles
        if (user && (user.role === 'admin' || user.role === 'manager')) {
          return true;
        }
        
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
    };

    const mockCacheInterceptor = {
      intercept: jest.fn().mockImplementation((context, next) => next.handle()),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductCatalogController],
      providers: [
        {
          provide: ProductCatalogService,
          useValue: mockProductService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideInterceptor(CacheInterceptor)
      .useValue(mockCacheInterceptor)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    productService = moduleFixture.get(ProductCatalogService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ecommerce/products', () => {
    it('should create product successfully', async () => {
      productService.create.mockResolvedValue(mockProduct as any);

      const response = await request(app.getHttpServer())
        .post('/ecommerce/products')
        .set('Authorization', 'Bearer valid-token')
        .send(mockCreateProductDto)
        .expect(201);

      expect(response.body).toEqual(mockProduct);
      expect(productService.create).toHaveBeenCalledWith(mockCreateProductDto, mockUser);
    });

    it('should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/ecommerce/products')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/ecommerce/products')
        .send(mockCreateProductDto)
        .expect(401);
    });

    it('should return 403 when user is not admin/manager', async () => {
      const customerUser = { ...mockUser, role: 'customer' };
      
      const mockJwtAuthGuardCustomer = {
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          request.user = customerUser;
          return true;
        }),
      };

      const testModule = await Test.createTestingModule({
        controllers: [ProductCatalogController],
        providers: [
          {
            provide: ProductCatalogService,
            useValue: productService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuardCustomer)
        .overrideGuard(TenantGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .overrideGuard(RolesGuard)
        .useValue({
          canActivate: jest.fn().mockImplementation(() => {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
          }),
        })
        .overrideInterceptor(CacheInterceptor)
        .useValue({ intercept: jest.fn().mockImplementation((context, next) => next.handle()) })
        .compile();

      const testApp = testModule.createNestApplication();
      testApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await testApp.init();

      await request(testApp.getHttpServer())
        .post('/ecommerce/products')
        .set('Authorization', 'Bearer valid-token')
        .send(mockCreateProductDto)
        .expect(403);

      await testApp.close();
    });
  });

  describe('GET /ecommerce/products', () => {
    it('should search products without filters', async () => {
      productService.search.mockResolvedValue([mockProduct] as any);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([mockProduct]);
      expect(productService.search).toHaveBeenCalledWith('', mockUser);
    });

    it('should search products with search query', async () => {
      productService.search.mockResolvedValue([mockProduct] as any);

      await request(app.getHttpServer())
        .get('/ecommerce/products?search=test')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(productService.search).toHaveBeenCalledWith('test', mockUser);
    });

    it('should return empty array when no products found', async () => {
      productService.search.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products?search=nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/ecommerce/products')
        .expect(401);
    });
  });

  describe('GET /ecommerce/products/:id', () => {
    it('should get product by ID', async () => {
      productService.findOne.mockResolvedValue(mockProduct as any);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(productService.findOne).toHaveBeenCalledWith('prod-123', mockUser);
    });

    it('should return 404 when product not found', async () => {
      productService.findOne.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/ecommerce/products/prod-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/ecommerce/products/prod-123')
        .expect(401);
    });
  });

  describe('GET /ecommerce/products/sku/:sku', () => {
    it('should get product by SKU', async () => {
      productService.findBySku.mockResolvedValue(mockProduct as any);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products/sku/PROD-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(productService.findBySku).toHaveBeenCalledWith('PROD-001', mockUser);
    });

    it('should return 404 when SKU not found', async () => {
      productService.findBySku.mockRejectedValue(
        new HttpException('Product with SKU PROD-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/ecommerce/products/sku/PROD-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/ecommerce/products/sku/PROD-001')
        .expect(401);
    });
  });

  describe('GET /ecommerce/products/slug/:slug', () => {
    it('should get product by slug', async () => {
      productService.findBySlug.mockResolvedValue(mockProduct as any);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products/slug/test-product')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(productService.findBySlug).toHaveBeenCalledWith('test-product', mockUser);
    });

    it('should return 404 when slug not found', async () => {
      productService.findBySlug.mockRejectedValue(
        new HttpException('Product with slug nonexistent not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/ecommerce/products/slug/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/ecommerce/products/slug/test-product')
        .expect(401);
    });
  });

  describe('PATCH /ecommerce/products/:id', () => {
    it('should update product successfully', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      productService.update.mockResolvedValue(updatedProduct as any);

      const response = await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated Product' })
        .expect(200);

      expect(response.body.name).toBe('Updated Product');
      expect(productService.update).toHaveBeenCalledWith(
        'prod-123',
        { name: 'Updated Product' },
        mockUser,
      );
    });

    it('should return 404 when product not found', async () => {
      productService.update.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-123')
        .send({ name: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /ecommerce/products/:id', () => {
    it('should delete product successfully', async () => {
      productService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/ecommerce/products/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(productService.remove).toHaveBeenCalledWith('prod-123', mockUser);
    });

    it('should return 404 when product not found', async () => {
      productService.remove.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/ecommerce/products/prod-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete('/ecommerce/products/prod-123')
        .expect(401);
    });
  });

  describe('PATCH /ecommerce/products/:id/publish', () => {
    it('should publish product successfully', async () => {
      const publishedProduct = { ...mockProduct, isPublished: true };
      productService.publish.mockResolvedValue(publishedProduct as any);

      const response = await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-123/publish')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.isPublished).toBe(true);
      expect(productService.publish).toHaveBeenCalledWith('prod-123', mockUser);
    });

    it('should return 404 when product not found', async () => {
      productService.publish.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-999/publish')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-123/publish')
        .expect(401);
    });
  });

  describe('PATCH /ecommerce/products/:id/unpublish', () => {
    it('should unpublish product successfully', async () => {
      const unpublishedProduct = { ...mockProduct, isPublished: false };
      productService.unpublish.mockResolvedValue(unpublishedProduct as any);

      const response = await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-123/unpublish')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.isPublished).toBe(false);
      expect(productService.unpublish).toHaveBeenCalledWith('prod-123', mockUser);
    });

    it('should return 404 when product not found', async () => {
      productService.unpublish.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-999/unpublish')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-123/unpublish')
        .expect(401);
    });
  });

  describe('PATCH /ecommerce/products/:id/stock', () => {
    it('should update stock successfully', async () => {
      const updatedProduct = { ...mockProduct, stockQuantity: 50 };
      productService.updateStock.mockResolvedValue(updatedProduct as any);

      const response = await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-123/stock')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 50 })
        .expect(200);

      expect(response.body.stockQuantity).toBe(50);
      expect(productService.updateStock).toHaveBeenCalledWith('prod-123', 50, mockUser);
    });

    it('should return 404 when product not found', async () => {
      productService.updateStock.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-999/stock')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 50 })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/products/prod-123/stock')
        .send({ quantity: 50 })
        .expect(401);
    });
  });

  describe('GET /ecommerce/products/inventory/low-stock', () => {
    it('should get low stock products', async () => {
      const lowStockProducts = [
        { ...mockProduct, stockQuantity: 5 },
        { ...mockProduct, id: 'prod-124', stockQuantity: 8 },
      ];
      productService.findLowStock.mockResolvedValue(lowStockProducts as any);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products/inventory/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(lowStockProducts);
      expect(productService.findLowStock).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no low stock products', async () => {
      productService.findLowStock.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products/inventory/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/ecommerce/products/inventory/low-stock')
        .expect(401);
    });
  });

  describe('GET /ecommerce/products/inventory/out-of-stock', () => {
    it('should get out of stock products', async () => {
      const outOfStockProducts = [
        { ...mockProduct, stockQuantity: 0, status: ProductStatus.OUT_OF_STOCK },
      ];
      productService.findOutOfStock.mockResolvedValue(outOfStockProducts as any);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products/inventory/out-of-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(outOfStockProducts);
      expect(productService.findOutOfStock).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no out of stock products', async () => {
      productService.findOutOfStock.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/products/inventory/out-of-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/ecommerce/products/inventory/out-of-stock')
        .expect(401);
    });
  });
});

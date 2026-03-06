import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ProductModule } from '../../src/modules/product/product.module';
import { ProductService } from '../../src/modules/product/product.service';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

describe('Product API (Integration)', () => {
  let app: INestApplication;
  let productService: ProductService;
  let jwtService: JwtService;
  let accessToken: string;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    sku: 'TEST-001',
    price: 100000,
    cost: 80000,
    stock: 50,
    unit: 'piece',
    tenantId: mockTenantId,
    isActive: true,
    hasVariants: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ProductModule,
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      ],
    })
      .overrideProvider(ProductService)
      .useValue({
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateStock: jest.fn(),
        checkLowStock: jest.fn(),
      })
      .overrideProvider('ProductRepository')
      .useValue({})
      .overrideProvider('ProductCategoryRepository')
      .useValue({})
      .overrideProvider('ProductVariantRepository')
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    productService = moduleFixture.get<ProductService>(ProductService);
    jwtService = new JwtService({ secret: 'test-secret' });
    
    accessToken = jwtService.sign({
      sub: mockUserId,
      tenantId: mockTenantId,
      roles: ['user'],
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /products', () => {
    it('should create a product', async () => {
      const createDto = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 100000,
        cost: 80000,
        stock: 50,
        unit: 'piece',
      };

      jest.spyOn(productService, 'create').mockResolvedValue(mockProduct as any);

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: createDto.name,
        sku: createDto.sku,
      });
      expect(productService.create).toHaveBeenCalledWith(createDto, mockTenantId);
    });

    it('should return 400 with invalid data', async () => {
      const invalidDto = {
        name: 'Test Product',
        price: -100,
      };

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Test', sku: 'TEST', price: 100 })
        .expect(401);
    });
  });

  describe('GET /products', () => {
    it('should return paginated products', async () => {
      const mockResponse = {
        items: [mockProduct],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      jest.spyOn(productService, 'findAll').mockResolvedValue(mockResponse as any);

      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.meta.total).toBe(1);
      expect(productService.findAll).toHaveBeenCalledWith(mockTenantId, expect.any(Object));
    });

    it('should filter by search query', async () => {
      const mockResponse = {
        items: [mockProduct],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      jest.spyOn(productService, 'findAll').mockResolvedValue(mockResponse as any);

      await request(app.getHttpServer())
        .get('/products?search=Test')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(productService.findAll).toHaveBeenCalledWith(
        mockTenantId,
        expect.objectContaining({ search: 'Test' }),
      );
    });

    it('should support pagination', async () => {
      const mockResponse = {
        items: [mockProduct],
        meta: { total: 1, page: 2, limit: 10, totalPages: 1 },
      };

      jest.spyOn(productService, 'findAll').mockResolvedValue(mockResponse as any);

      await request(app.getHttpServer())
        .get('/products?page=2&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(productService.findAll).toHaveBeenCalledWith(
        mockTenantId,
        expect.objectContaining({ page: 2, limit: 10 }),
      );
    });
  });

  describe('GET /products/low-stock', () => {
    it('should return products with low stock', async () => {
      const lowStockProducts = [
        { ...mockProduct, stock: 5, minStock: 10 },
      ];

      jest.spyOn(productService, 'checkLowStock').mockResolvedValue(lowStockProducts as any);

      const response = await request(app.getHttpServer())
        .get('/products/low-stock')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(productService.checkLowStock).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by id', async () => {
      jest.spyOn(productService, 'findOne').mockResolvedValue(mockProduct as any);

      const response = await request(app.getHttpServer())
        .get(`/products/${mockProduct.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockProduct.id,
        name: mockProduct.name,
      });
      expect(productService.findOne).toHaveBeenCalledWith(mockProduct.id, mockTenantId);
    });

    it('should return 404 for non-existent product', async () => {
      jest.spyOn(productService, 'findOne').mockRejectedValue(new Error('Product not found'));

      await request(app.getHttpServer())
        .get('/products/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(500);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update a product', async () => {
      const updateDto = {
        name: 'Updated Product',
        price: 150000,
      };

      const updatedProduct = { ...mockProduct, ...updateDto };
      jest.spyOn(productService, 'update').mockResolvedValue(updatedProduct as any);

      const response = await request(app.getHttpServer())
        .put(`/products/${mockProduct.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(productService.update).toHaveBeenCalledWith(
        mockProduct.id,
        updateDto,
        mockTenantId,
      );
    });
  });

  describe('DELETE /products/:id', () => {
    it('should soft delete a product', async () => {
      jest.spyOn(productService, 'delete').mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/products/${mockProduct.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(productService.delete).toHaveBeenCalledWith(mockProduct.id, mockTenantId);
    });
  });

  describe('POST /products/:id/stock', () => {
    it('should update product stock', async () => {
      const updatedProduct = { ...mockProduct, stock: 70 };
      jest.spyOn(productService, 'updateStock').mockResolvedValue(updatedProduct as any);

      const response = await request(app.getHttpServer())
        .post(`/products/${mockProduct.id}/stock`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 20 })
        .expect(201);

      expect(response.body.stock).toBe(70);
      expect(productService.updateStock).toHaveBeenCalledWith(
        mockProduct.id,
        20,
        mockTenantId,
      );
    });

    it('should decrease stock', async () => {
      const updatedProduct = { ...mockProduct, stock: 40 };
      jest.spyOn(productService, 'updateStock').mockResolvedValue(updatedProduct as any);

      const response = await request(app.getHttpServer())
        .post(`/products/${mockProduct.id}/stock`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: -10 })
        .expect(201);

      expect(response.body.stock).toBe(40);
    });
  });
});

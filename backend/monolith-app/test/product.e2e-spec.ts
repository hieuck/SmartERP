import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Register and login to get auth token
    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'product-test@example.com',
      password: 'password123',
      firstName: 'Product',
      lastName: 'Test',
      tenantId: 'tenant-product-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products (POST)', () => {
    it('should create a new product', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          sku: 'TEST-001',
          description: 'Test product description',
          price: 99.99,
          cost: 50.0,
          stock: 100,
          categoryId: 'category-123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Test Product');
          expect(res.body).toHaveProperty('sku', 'TEST-001');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Unauthorized Product',
          sku: 'UNAUTH-001',
          price: 99.99,
        })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Product',
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('/products (GET)', () => {
    beforeAll(async () => {
      // Create test products
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Product 1',
          sku: 'PROD-001',
          price: 10.0,
        });

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Product 2',
          sku: 'PROD-002',
          price: 20.0,
        });
    });

    it('should get all products for tenant', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body[0]).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer()).get('/products').expect(401);
    });
  });

  describe('/products/:id (GET)', () => {
    let productId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Single Product',
          sku: 'SINGLE-001',
          price: 15.0,
        });

      productId = response.body.id;
    });

    it('should get product by id', () => {
      return request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', productId);
          expect(res.body).toHaveProperty('name', 'Single Product');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/products/:id (PATCH)', () => {
    let productId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Update Product',
          sku: 'UPDATE-001',
          price: 25.0,
        });

      productId = response.body.id;
    });

    it('should update product', () => {
      return request(app.getHttpServer())
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Product Name',
          price: 30.0,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Updated Product Name');
          expect(res.body).toHaveProperty('price', 30.0);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .patch('/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Non-existent',
        })
        .expect(404);
    });
  });

  describe('/products/:id (DELETE)', () => {
    let productId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Delete Product',
          sku: 'DELETE-001',
          price: 35.0,
        });

      productId = response.body.id;
    });

    it('should delete product', () => {
      return request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1ProductId: string;

    beforeAll(async () => {
      // Create tenant 1 user
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1@example.com',
        password: 'password123',
        firstName: 'Tenant',
        lastName: 'One',
        tenantId: 'tenant-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      // Create tenant 2 user
      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2@example.com',
        password: 'password123',
        firstName: 'Tenant',
        lastName: 'Two',
        tenantId: 'tenant-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      // Create product for tenant 1
      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          name: 'Tenant 1 Product',
          sku: 'T1-001',
          price: 40.0,
        });
      tenant1ProductId = productResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Products = response.body.filter(
        (p: { tenantId: string; id: string; name: string }) => p.tenantId === 'tenant-1',
      );
      expect(tenant1Products.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 product by id', () => {
      return request(app.getHttpServer())
        .get(`/products/${tenant1ProductId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });

    it('tenant 2 should not update tenant 1 product', () => {
      return request(app.getHttpServer())
        .patch(`/products/${tenant1ProductId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'Hacked Product',
        })
        .expect(404);
    });

    it('tenant 2 should not delete tenant 1 product', () => {
      return request(app.getHttpServer())
        .delete(`/products/${tenant1ProductId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });
  });
});

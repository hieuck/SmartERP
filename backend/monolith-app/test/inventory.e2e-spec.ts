import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('InventoryController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Register and login
    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'inventory-test@example.com',
      password: 'password123',
      firstName: 'Inventory',
      lastName: 'Test',
      tenantId: 'tenant-inventory-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;

    // Create a product for inventory tests
    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Inventory Test Product',
        sku: 'INV-001',
        price: 100.0,
      });

    productId = productResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/inventory (POST)', () => {
    it('should create inventory record', () => {
      return request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 100,
          location: 'Warehouse A',
          warehouseId: 'warehouse-1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('productId', productId);
          expect(res.body).toHaveProperty('quantity', 100);
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/inventory')
        .send({
          productId,
          quantity: 50,
        })
        .expect(401);
    });

    it('should return 400 with invalid quantity', () => {
      return request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: -10, // Negative quantity
        })
        .expect(400);
    });
  });

  describe('/inventory (GET)', () => {
    beforeAll(async () => {
      // Create test inventory records
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 50,
          location: 'Warehouse B',
        });
    });

    it('should get all inventory records', () => {
      return request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
          expect(res.body[0]).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should filter by product', () => {
      return request(app.getHttpServer())
        .get(`/inventory?productId=${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(
            (item: {
              productId?: string;
              quantity: number;
              minQuantity?: number;
              id: string;
              location: string;
            }) => {
              expect(item.productId).toBe(productId);
            },
          );
        });
    });
  });

  describe('/inventory/:id (GET)', () => {
    let inventoryId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 75,
          location: 'Warehouse C',
        });

      inventoryId = response.body.id;
    });

    it('should get inventory by id', () => {
      return request(app.getHttpServer())
        .get(`/inventory/${inventoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', inventoryId);
          expect(res.body).toHaveProperty('quantity', 75);
        });
    });

    it('should return 404 for non-existent inventory', () => {
      return request(app.getHttpServer())
        .get('/inventory/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/inventory/:id/adjust (POST)', () => {
    let inventoryId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 100,
          location: 'Warehouse D',
        });

      inventoryId = response.body.id;
    });

    it('should adjust inventory quantity (increase)', () => {
      return request(app.getHttpServer())
        .post(`/inventory/${inventoryId}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          adjustment: 50,
          reason: 'Stock received',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('quantity', 150);
        });
    });

    it('should adjust inventory quantity (decrease)', () => {
      return request(app.getHttpServer())
        .post(`/inventory/${inventoryId}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          adjustment: -30,
          reason: 'Stock sold',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('quantity', 120);
        });
    });

    it('should not allow negative inventory', () => {
      return request(app.getHttpServer())
        .post(`/inventory/${inventoryId}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          adjustment: -200, // Would result in negative
          reason: 'Over-sold',
        })
        .expect(400);
    });
  });

  describe('/inventory/:id/transfer (POST)', () => {
    let inventoryId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 100,
          location: 'Warehouse E',
          warehouseId: 'warehouse-e',
        });

      inventoryId = response.body.id;
    });

    it('should transfer inventory between locations', () => {
      return request(app.getHttpServer())
        .post(`/inventory/${inventoryId}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          toWarehouseId: 'warehouse-f',
          toLocation: 'Warehouse F',
          quantity: 50,
          reason: 'Stock rebalancing',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('quantity', 50); // Remaining
        });
    });

    it('should not transfer more than available', () => {
      return request(app.getHttpServer())
        .post(`/inventory/${inventoryId}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          toWarehouseId: 'warehouse-g',
          quantity: 200, // More than available
        })
        .expect(400);
    });
  });

  describe('/inventory/low-stock (GET)', () => {
    beforeAll(async () => {
      // Create low stock item
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 5, // Low quantity
          location: 'Warehouse G',
          minQuantity: 10,
        });
    });

    it('should get low stock items', () => {
      return request(app.getHttpServer())
        .get('/inventory/low-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(
            (item: {
              productId?: string;
              quantity: number;
              minQuantity?: number;
              id: string;
              location: string;
            }) => {
              expect(item.quantity).toBeLessThan(item.minQuantity || 10);
            },
          );
        });
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1InventoryId: string;

    beforeAll(async () => {
      // Create tenant 1
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-inv@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'Inv',
        tenantId: 'tenant-inv-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      // Create tenant 2
      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-inv@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'Inv',
        tenantId: 'tenant-inv-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      // Create product for tenant 1
      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          name: 'Tenant 1 Product',
          sku: 'T1-INV-001',
          price: 50.0,
        });

      // Create inventory for tenant 1
      const inventoryResponse = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          productId: productResponse.body.id,
          quantity: 100,
          location: 'Tenant 1 Warehouse',
        });
      tenant1InventoryId = inventoryResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 inventory', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Inventory = response.body.filter(
        (i: { tenantId: string }) => i.tenantId === 'tenant-inv-1',
      );
      expect(tenant1Inventory.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 inventory by id', () => {
      return request(app.getHttpServer())
        .get(`/inventory/${tenant1InventoryId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });

    it('tenant 2 should not adjust tenant 1 inventory', () => {
      return request(app.getHttpServer())
        .post(`/inventory/${tenant1InventoryId}/adjust`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          adjustment: 50,
          reason: 'Unauthorized adjustment',
        })
        .expect(404);
    });
  });
});

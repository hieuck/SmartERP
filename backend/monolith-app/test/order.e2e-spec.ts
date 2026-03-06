import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let customerId: string;
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
      email: 'order-test@example.com',
      password: 'password123',
      firstName: 'Order',
      lastName: 'Test',
      tenantId: 'tenant-order-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;

    // Create customer
    const customerResponse = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '1234567890',
      });
    customerId = customerResponse.body.id;

    // Create product
    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Order Test Product',
        sku: 'ORD-001',
        price: 50.0,
      });
    productId = productResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/orders (POST)', () => {
    it('should create a new order', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          items: [
            {
              productId,
              quantity: 2,
              price: 50.0,
            },
          ],
          status: 'pending',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('customerId', customerId);
          expect(res.body).toHaveProperty('status', 'pending');
          expect(res.body).toHaveProperty('total', 100.0);
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          customerId,
          items: [],
        })
        .expect(401);
    });

    it('should return 400 with empty items', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          items: [], // Empty items
        })
        .expect(400);
    });
  });

  describe('/orders (GET)', () => {
    beforeAll(async () => {
      // Create test orders
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 1, price: 50.0 }],
        });

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 3, price: 50.0 }],
        });
    });

    it('should get all orders', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body[0]).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should filter by customer', () => {
      return request(app.getHttpServer())
        .get(`/orders?customerId=${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(
            (order: { customerId?: string; status: string; id: string; total: number }) => {
              expect(order.customerId).toBe(customerId);
            },
          );
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/orders?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(
            (order: { customerId?: string; status: string; id: string; total: number }) => {
              expect(order.status).toBe('pending');
            },
          );
        });
    });
  });

  describe('/orders/:id (GET)', () => {
    let orderId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 5, price: 50.0 }],
        });

      orderId = response.body.id;
    });

    it('should get order by id', () => {
      return request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', orderId);
          expect(res.body).toHaveProperty('customerId', customerId);
          expect(res.body).toHaveProperty('total', 250.0);
        });
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/orders/:id/status (PATCH)', () => {
    let orderId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 2, price: 50.0 }],
          status: 'pending',
        });

      orderId = response.body.id;
    });

    it('should update order status to confirmed', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'confirmed',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'confirmed');
        });
    });

    it('should update order status to shipped', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'shipped',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'shipped');
        });
    });

    it('should update order status to delivered', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'delivered',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'delivered');
        });
    });

    it('should not allow invalid status', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'invalid-status',
        })
        .expect(400);
    });
  });

  describe('/orders/:id/cancel (POST)', () => {
    let orderId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 1, price: 50.0 }],
        });

      orderId = response.body.id;
    });

    it('should cancel order', () => {
      return request(app.getHttpServer())
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Customer requested cancellation',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'cancelled');
        });
    });

    it('should not cancel already delivered order', async () => {
      // Create and deliver order
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 1, price: 50.0 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${response.body.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'delivered' });

      // Try to cancel
      return request(app.getHttpServer())
        .post(`/orders/${response.body.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Too late' })
        .expect(400);
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1OrderId: string;

    beforeAll(async () => {
      // Create tenant 1
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-order@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'Order',
        tenantId: 'tenant-ord-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      // Create tenant 2
      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-order@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'Order',
        tenantId: 'tenant-ord-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      // Create customer and product for tenant 1
      const customerResp = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({ name: 'T1 Customer', email: 't1@example.com' });

      const productResp = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({ name: 'T1 Product', sku: 'T1-001', price: 100 });

      // Create order for tenant 1
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          customerId: customerResp.body.id,
          items: [{ productId: productResp.body.id, quantity: 1, price: 100 }],
        });
      tenant1OrderId = orderResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Orders = response.body.filter(
        (o: { tenantId: string }) => o.tenantId === 'tenant-ord-1',
      );
      expect(tenant1Orders.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 order by id', () => {
      return request(app.getHttpServer())
        .get(`/orders/${tenant1OrderId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });

    it('tenant 2 should not update tenant 1 order status', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${tenant1OrderId}/status`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({ status: 'confirmed' })
        .expect(404);
    });
  });
});

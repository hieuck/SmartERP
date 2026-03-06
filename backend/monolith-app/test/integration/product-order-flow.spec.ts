import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Product and Order Flow (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let productId: string;
  let customerId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup: Create user and login
    const testUser = {
      email: `integration-${Date.now()}@example.com`,
      password: 'Test123!@#',
      firstName: 'Integration',
      lastName: 'Test',
      tenantId: 'integration-tenant',
    };

    await request(app.getHttpServer()).post('/api/auth/register').send(testUser);

    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginResponse.body.accessToken;
    tenantId = testUser.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Product Management Flow', () => {
    it('should create a new product', async () => {
      const product = {
        sku: `SKU-${Date.now()}`,
        name: 'Test Product',
        description: 'Test product description',
        price: 100,
        cost: 50,
        stockQuantity: 100,
        lowStockThreshold: 10,
        categoryId: null,
        tenantId: tenantId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(product)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.sku).toBe(product.sku);
      expect(response.body.name).toBe(product.name);

      productId = response.body.id;
    });

    it('should get product by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
    });

    it('should update product', async () => {
      const updates = {
        name: 'Updated Product Name',
        price: 150,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.price).toBe(updates.price);
    });

    it('should list products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should detect low stock', async () => {
      // Update stock to below threshold
      await request(app.getHttpServer())
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stockQuantity: 5 });

      const response = await request(app.getHttpServer())
        .get('/api/products/low-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const lowStockProduct = response.body.find(
        (p: { tenantId: string; id: string; name: string; stock: number }) => p.id === productId,
      );
      expect(lowStockProduct).toBeDefined();
    });
  });

  describe('Customer and Order Flow', () => {
    it('should create a customer', async () => {
      const customer = {
        name: 'Test Customer',
        email: `customer-${Date.now()}@example.com`,
        phone: '0123456789',
        address: '123 Test Street',
        tenantId: tenantId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customer)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(customer.name);

      customerId = response.body.id;
    });

    it('should create an order', async () => {
      const order = {
        customerId: customerId,
        orderNumber: `ORD-${Date.now()}`,
        items: [
          {
            productId: productId,
            quantity: 2,
            price: 150,
          },
        ],
        status: 'draft',
        tenantId: tenantId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(order)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.customerId).toBe(customerId);
      expect(response.body.items).toHaveLength(1);

      orderId = response.body.id;
    });

    it('should get order by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.customerId).toBe(customerId);
    });

    it('should update order status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
    });

    it('should list orders by customer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/orders?customerId=${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].customerId).toBe(customerId);
    });

    it('should calculate order total correctly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const expectedTotal = 150 * 2; // price * quantity
      expect(response.body.total).toBe(expectedTotal);
    });
  });

  describe('Complete Business Flow', () => {
    it('should complete full order lifecycle', async () => {
      // 1. Create product
      const product = {
        sku: `SKU-FLOW-${Date.now()}`,
        name: 'Flow Test Product',
        price: 200,
        cost: 100,
        stockQuantity: 50,
        tenantId: tenantId,
      };

      const productResponse = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(product)
        .expect(201);

      const newProductId = productResponse.body.id;

      // 2. Create customer
      const customer = {
        name: 'Flow Test Customer',
        email: `flow-${Date.now()}@example.com`,
        phone: '0987654321',
        tenantId: tenantId,
      };

      const customerResponse = await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customer)
        .expect(201);

      const newCustomerId = customerResponse.body.id;

      // 3. Create order
      const order = {
        customerId: newCustomerId,
        orderNumber: `ORD-FLOW-${Date.now()}`,
        items: [
          {
            productId: newProductId,
            quantity: 5,
            price: 200,
          },
        ],
        status: 'draft',
        tenantId: tenantId,
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(order)
        .expect(201);

      const newOrderId = orderResponse.body.id;

      // 4. Confirm order
      await request(app.getHttpServer())
        .patch(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      // 5. Ship order
      await request(app.getHttpServer())
        .patch(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'shipped' })
        .expect(200);

      // 6. Deliver order
      const finalResponse = await request(app.getHttpServer())
        .patch(`/api/orders/${newOrderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'delivered' })
        .expect(200);

      expect(finalResponse.body.status).toBe('delivered');

      // 7. Verify order total
      expect(finalResponse.body.total).toBe(1000); // 200 * 5
    });
  });
});

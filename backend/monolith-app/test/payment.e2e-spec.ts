import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'payment-test@example.com',
      password: 'password123',
      firstName: 'Payment',
      lastName: 'Test',
      tenantId: 'tenant-pay-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;

    // Create customer, product, and order for payment tests
    const customerResp = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Customer', email: 'customer@test.com' });

    const productResp = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Product', sku: 'PAY-001', price: 100 });

    const orderResp = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: customerResp.body.id,
        items: [{ productId: productResp.body.id, quantity: 2, price: 100 }],
      });
    orderId = orderResp.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/payments (POST)', () => {
    it('should create a payment', () => {
      return request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId,
          amount: 200.0,
          method: 'credit_card',
          status: 'pending',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('orderId', orderId);
          expect(res.body).toHaveProperty('amount', 200.0);
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/payments')
        .send({
          orderId,
          amount: 100,
        })
        .expect(401);
    });

    it('should validate payment amount', () => {
      return request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId,
          amount: -50, // Negative amount
          method: 'cash',
        })
        .expect(400);
    });
  });

  describe('/payments/:id/confirm (POST)', () => {
    let paymentId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId,
          amount: 150.0,
          method: 'bank_transfer',
          status: 'pending',
        });
      paymentId = response.body.id;
    });

    it('should confirm payment', () => {
      return request(app.getHttpServer())
        .post(`/payments/${paymentId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactionId: 'TXN123456',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'completed');
          expect(res.body).toHaveProperty('transactionId', 'TXN123456');
        });
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1PaymentId: string;

    beforeAll(async () => {
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-pay@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'Pay',
        tenantId: 'tenant-pay-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-pay@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'Pay',
        tenantId: 'tenant-pay-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      // Create order and payment for tenant 1
      const customerResp = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({ name: 'T1 Customer', email: 't1@test.com' });

      const productResp = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({ name: 'T1 Product', sku: 'T1-PAY', price: 50 });

      const orderResp = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          customerId: customerResp.body.id,
          items: [{ productId: productResp.body.id, quantity: 1, price: 50 }],
        });

      const paymentResp = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          orderId: orderResp.body.id,
          amount: 50,
          method: 'cash',
        });
      tenant1PaymentId = paymentResp.body.id;
    });

    it('tenant 2 should not see tenant 1 payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Payments = response.body.filter(
        (p: { tenantId: string; id: string; amount: number }) => p.tenantId === 'tenant-pay-1',
      );
      expect(tenant1Payments.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 payment', () => {
      return request(app.getHttpServer())
        .get(`/payments/${tenant1PaymentId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });
  });
});

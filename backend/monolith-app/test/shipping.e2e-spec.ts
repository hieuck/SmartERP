import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Shipping Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let orderId: string;
  let shipmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'shipping-test@test.com',
      password: 'password123',
      tenantName: 'Shipping Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;

    // Create order for shipping
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerName: 'Test Customer',
        items: [{ productId: 'test-product', quantity: 2 }],
        totalAmount: 100,
      });

    orderId = orderRes.body.id;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM shipments WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM orders WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /shipping/shipments', () => {
    it('should create a new shipment', async () => {
      const response = await request(app.getHttpServer())
        .post('/shipping/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId,
          carrier: 'GHN',
          recipientName: 'John Doe',
          recipientPhone: '0123456789',
          recipientAddress: '123 Test St, City',
          weight: 1.5,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.carrier).toBe('GHN');
      expect(response.body.tenantId).toBe(tenantId);
      shipmentId = response.body.id;
    });
  });

  describe('GET /shipping/shipments', () => {
    it('should get all shipments', async () => {
      const response = await request(app.getHttpServer())
        .get('/shipping/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /shipping/shipments/:id', () => {
    it('should get shipment by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/shipping/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(shipmentId);
      expect(response.body.carrier).toBe('GHN');
    });
  });

  describe('POST /shipping/shipments/:id/track', () => {
    it('should get tracking information', async () => {
      const response = await request(app.getHttpServer())
        .post(`/shipping/shipments/${shipmentId}/track`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('trackingNumber');
    });
  });

  describe('POST /shipping/calculate-fee', () => {
    it('should calculate shipping fee', async () => {
      const response = await request(app.getHttpServer())
        .post('/shipping/calculate-fee')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          carrier: 'GHN',
          fromAddress: '123 From St',
          toAddress: '456 To St',
          weight: 1.5,
        })
        .expect(200);

      expect(response.body).toHaveProperty('fee');
      expect(typeof response.body.fee).toBe('number');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant shipments', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'shipping-tenant2@test.com',
        password: 'password123',
        tenantName: 'Shipping Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      await request(app.getHttpServer())
        .get(`/shipping/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);

      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

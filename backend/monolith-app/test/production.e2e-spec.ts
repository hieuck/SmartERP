import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProductionController (e2e)', () => {
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

    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'production-test@example.com',
      password: 'password123',
      firstName: 'Production',
      lastName: 'Test',
      tenantId: 'tenant-prod-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;

    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Production Product',
        sku: 'PROD-001',
        price: 100.0,
      });
    productId = productResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/production/work-orders (POST)', () => {
    it('should create a work order', () => {
      return request(app.getHttpServer())
        .post('/production/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 100,
          startDate: new Date().toISOString(),
          status: 'pending',
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
        .post('/production/work-orders')
        .send({
          productId,
          quantity: 50,
        })
        .expect(401);
    });
  });

  describe('/production/work-orders (GET)', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/production/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 50,
          status: 'in_progress',
        });
    });

    it('should get all work orders', () => {
      return request(app.getHttpServer())
        .get('/production/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/production/work-orders?status=in_progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((wo: { tenantId: string; status: string; id: string }) => {
            expect(wo.status).toBe('in_progress');
          });
        });
    });
  });

  describe('/production/work-orders/:id/start (POST)', () => {
    let workOrderId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/production/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 75,
          status: 'pending',
        });
      workOrderId = response.body.id;
    });

    it('should start work order', () => {
      return request(app.getHttpServer())
        .post(`/production/work-orders/${workOrderId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'in_progress');
          expect(res.body).toHaveProperty('startedAt');
        });
    });
  });

  describe('/production/work-orders/:id/complete (POST)', () => {
    let workOrderId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/production/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 60,
          status: 'in_progress',
        });
      workOrderId = response.body.id;
    });

    it('should complete work order', () => {
      return request(app.getHttpServer())
        .post(`/production/work-orders/${workOrderId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          actualQuantity: 58,
          notes: 'Completed with minor defects',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'completed');
          expect(res.body).toHaveProperty('completedAt');
        });
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1WorkOrderId: string;

    beforeAll(async () => {
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-prod@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'Prod',
        tenantId: 'tenant-prod-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-prod@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'Prod',
        tenantId: 'tenant-prod-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      const productResp = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({ name: 'T1 Product', sku: 'T1-PROD', price: 100 });

      const woResponse = await request(app.getHttpServer())
        .post('/production/work-orders')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          productId: productResp.body.id,
          quantity: 100,
        });
      tenant1WorkOrderId = woResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 work orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/production/work-orders')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1WorkOrders = response.body.filter(
        (wo: { tenantId: string }) => wo.tenantId === 'tenant-prod-1',
      );
      expect(tenant1WorkOrders.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 work order', () => {
      return request(app.getHttpServer())
        .get(`/production/work-orders/${tenant1WorkOrderId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Integration Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let integrationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'integration-test@test.com',
      password: 'password123',
      tenantName: 'Integration Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM integrations WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /integrations', () => {
    it('should create payment gateway integration', async () => {
      const response = await request(app.getHttpServer())
        .post('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'payment',
          provider: 'vnpay',
          config: {
            merchantId: 'TEST123',
            apiKey: 'test-key',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('payment');
      expect(response.body.provider).toBe('vnpay');
      integrationId = response.body.id;
    });
  });

  describe('GET /integrations', () => {
    it('should get all integrations', async () => {
      const response = await request(app.getHttpServer())
        .get('/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/integrations?type=payment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((integration) => {
        expect(integration.type).toBe('payment');
      });
    });
  });

  describe('POST /integrations/:id/test', () => {
    it('should test integration connection', async () => {
      const response = await request(app.getHttpServer())
        .post(`/integrations/${integrationId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(['success', 'failed']).toContain(response.body.status);
    });
  });

  describe('PATCH /integrations/:id', () => {
    it('should update integration', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          enabled: false,
        })
        .expect(200);

      expect(response.body.enabled).toBe(false);
    });
  });

  describe('DELETE /integrations/:id', () => {
    it('should delete integration', async () => {
      await request(app.getHttpServer())
        .delete(`/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant integrations', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'integration-tenant2@test.com',
        password: 'password123',
        tenantName: 'Integration Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const int2Res = await request(app.getHttpServer())
        .post('/integrations')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          type: 'shipping',
          provider: 'ghn',
        });

      const int2Id = int2Res.body.id;

      await request(app.getHttpServer())
        .get(`/integrations/${int2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await dataSource.query('DELETE FROM integrations WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

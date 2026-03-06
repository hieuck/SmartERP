import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Audit Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'audit-test@test.com',
      password: 'password123',
      tenantName: 'Audit Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;

    // Create some actions to audit
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Product', sku: 'TEST-001', price: 100 });
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM audit_logs WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM products WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('GET /audit/logs', () => {
    it('should get all audit logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter by entity type', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/logs?entityType=product')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((log) => {
        expect(log.entityType).toBe('product');
      });
    });

    it('should filter by action', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/logs?action=create')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((log) => {
        expect(log.action).toBe('create');
      });
    });
  });

  describe('GET /audit/logs/:id', () => {
    it('should get audit log by id', async () => {
      const logsRes = await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', `Bearer ${authToken}`);

      const logId = logsRes.body[0].id;

      const response = await request(app.getHttpServer())
        .get(`/audit/logs/${logId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(logId);
      expect(response.body).toHaveProperty('action');
      expect(response.body).toHaveProperty('entityType');
    });
  });

  describe('GET /audit/stats', () => {
    it('should get audit statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalLogs');
      expect(response.body).toHaveProperty('byAction');
      expect(response.body).toHaveProperty('byEntityType');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant audit logs', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'audit-tenant2@test.com',
        password: 'password123',
        tenantName: 'Audit Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const logs1 = await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const logs2 = await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      expect(logs1.body.length).toBeGreaterThan(0);
      expect(logs2.body.length).toBe(0);

      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

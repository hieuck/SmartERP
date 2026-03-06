import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Workflow Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let workflowId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'workflow-test@test.com',
      password: 'password123',
      tenantName: 'Workflow Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM workflows WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /workflows', () => {
    it('should create a new workflow', async () => {
      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Order Approval',
          type: 'approval',
          steps: [
            { name: 'Submit', action: 'submit' },
            { name: 'Manager Approval', action: 'approve' },
            { name: 'Complete', action: 'complete' },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Order Approval');
      workflowId = response.body.id;
    });
  });

  describe('GET /workflows', () => {
    it('should get all workflows', async () => {
      const response = await request(app.getHttpServer())
        .get('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /workflows/:id/execute', () => {
    it('should execute workflow', async () => {
      const response = await request(app.getHttpServer())
        .post(`/workflows/${workflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityId: 'test-order-id',
          entityType: 'order',
        })
        .expect(201);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('in_progress');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant workflows', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'workflow-tenant2@test.com',
        password: 'password123',
        tenantName: 'Workflow Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      await request(app.getHttpServer())
        .get(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);

      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

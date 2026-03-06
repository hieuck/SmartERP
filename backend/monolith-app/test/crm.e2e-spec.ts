import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('CRM Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let leadId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'crm-test@test.com',
      password: 'password123',
      tenantName: 'CRM Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM leads WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /crm/leads', () => {
    it('should create a new lead', async () => {
      const response = await request(app.getHttpServer())
        .post('/crm/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          company: 'ABC Corp',
          status: 'new',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('John Doe');
      expect(response.body.tenantId).toBe(tenantId);
      leadId = response.body.id;
    });
  });

  describe('GET /crm/leads', () => {
    it('should get all leads', async () => {
      const response = await request(app.getHttpServer())
        .get('/crm/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /crm/leads/:id', () => {
    it('should get lead by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/crm/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(leadId);
      expect(response.body.name).toBe('John Doe');
    });
  });

  describe('PATCH /crm/leads/:id', () => {
    it('should update lead status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/crm/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'qualified',
        })
        .expect(200);

      expect(response.body.status).toBe('qualified');
    });
  });

  describe('POST /crm/leads/:id/convert', () => {
    it('should convert lead to customer', async () => {
      const response = await request(app.getHttpServer())
        .post(`/crm/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('customerId');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant leads', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'crm-tenant2@test.com',
        password: 'password123',
        tenantName: 'CRM Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const lead2Res = await request(app.getHttpServer())
        .post('/crm/leads')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
        });

      const lead2Id = lead2Res.body.id;

      await request(app.getHttpServer())
        .get(`/crm/leads/${lead2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await dataSource.query('DELETE FROM leads WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

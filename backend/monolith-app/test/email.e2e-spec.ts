import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Email Module (e2e)', () => {
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
      email: 'email-test@test.com',
      password: 'password123',
      tenantName: 'Email Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM email_logs WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /email/send', () => {
    it('should send email', async () => {
      const response = await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'recipient@example.com',
          subject: 'Test Email',
          body: 'This is a test email',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('sent');
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'invalid-email',
          subject: 'Test',
          body: 'Test',
        })
        .expect(400);
    });
  });

  describe('GET /email/logs', () => {
    it('should get email logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/email/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /email/templates', () => {
    it('should create email template', async () => {
      const response = await request(app.getHttpServer())
        .post('/email/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Welcome Email',
          subject: 'Welcome to {{companyName}}',
          body: 'Hello {{userName}}, welcome!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Welcome Email');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant emails', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'email-tenant2@test.com',
        password: 'password123',
        tenantName: 'Email Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const logs1 = await request(app.getHttpServer())
        .get('/email/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const logs2 = await request(app.getHttpServer())
        .get('/email/logs')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      expect(logs1.body).not.toEqual(logs2.body);

      await dataSource.query('DELETE FROM email_logs WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

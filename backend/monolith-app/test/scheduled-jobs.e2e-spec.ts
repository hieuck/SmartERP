import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Scheduled Jobs Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let jobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'scheduled-jobs-test@test.com',
      password: 'password123',
      tenantName: 'Scheduled Jobs Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM scheduled_jobs WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /scheduled-jobs', () => {
    it('should create a scheduled job', async () => {
      const response = await request(app.getHttpServer())
        .post('/scheduled-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Daily Backup',
          type: 'backup',
          schedule: '0 0 * * *', // Daily at midnight
          enabled: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Daily Backup');
      expect(response.body.schedule).toBe('0 0 * * *');
      jobId = response.body.id;
    });

    it('should fail with invalid cron expression', async () => {
      await request(app.getHttpServer())
        .post('/scheduled-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Job',
          type: 'backup',
          schedule: 'invalid-cron',
        })
        .expect(400);
    });
  });

  describe('GET /scheduled-jobs', () => {
    it('should get all scheduled jobs', async () => {
      const response = await request(app.getHttpServer())
        .get('/scheduled-jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/scheduled-jobs?type=backup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((job) => {
        expect(job.type).toBe('backup');
      });
    });
  });

  describe('GET /scheduled-jobs/:id', () => {
    it('should get job by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/scheduled-jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(jobId);
      expect(response.body.name).toBe('Daily Backup');
    });
  });

  describe('PATCH /scheduled-jobs/:id', () => {
    it('should update job', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/scheduled-jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          enabled: false,
        })
        .expect(200);

      expect(response.body.enabled).toBe(false);
    });
  });

  describe('POST /scheduled-jobs/:id/run', () => {
    it('should manually trigger job', async () => {
      const response = await request(app.getHttpServer())
        .post(`/scheduled-jobs/${jobId}/run`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('executionId');
      expect(response.body.status).toBe('running');
    });
  });

  describe('GET /scheduled-jobs/:id/history', () => {
    it('should get job execution history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/scheduled-jobs/${jobId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('DELETE /scheduled-jobs/:id', () => {
    it('should delete job', async () => {
      await request(app.getHttpServer())
        .delete(`/scheduled-jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant jobs', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'scheduled-jobs-tenant2@test.com',
        password: 'password123',
        tenantName: 'Scheduled Jobs Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const job2Res = await request(app.getHttpServer())
        .post('/scheduled-jobs')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'Tenant 2 Job',
          type: 'backup',
          schedule: '0 0 * * *',
        });

      const job2Id = job2Res.body.id;

      await request(app.getHttpServer())
        .get(`/scheduled-jobs/${job2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await dataSource.query('DELETE FROM scheduled_jobs WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

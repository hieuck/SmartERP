import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Import-Export Module (e2e)', () => {
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
      email: 'import-export-test@test.com',
      password: 'password123',
      tenantName: 'Import-Export Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM import_jobs WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM export_jobs WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /import/products', () => {
    it('should import products from CSV', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/products')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('name,sku,price\nProduct1,SKU1,100'), 'products.csv')
        .expect(201);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body.status).toBe('processing');
    });

    it('should fail with invalid CSV format', async () => {
      await request(app.getHttpServer())
        .post('/import/products')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('invalid,data'), 'invalid.csv')
        .expect(400);
    });
  });

  describe('GET /import/jobs', () => {
    it('should get all import jobs', async () => {
      const response = await request(app.getHttpServer())
        .get('/import/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /export/products', () => {
    it('should export products to CSV', async () => {
      const response = await request(app.getHttpServer())
        .post('/export/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          filters: {},
        })
        .expect(201);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body.status).toBe('processing');
    });

    it('should export products to Excel', async () => {
      const response = await request(app.getHttpServer())
        .post('/export/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'xlsx',
          filters: {},
        })
        .expect(201);

      expect(response.body).toHaveProperty('jobId');
    });
  });

  describe('GET /export/jobs/:id/download', () => {
    it('should download exported file', async () => {
      const exportRes = await request(app.getHttpServer())
        .post('/export/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'csv' });

      const jobId = exportRes.body.jobId;

      // Wait for job to complete (in real scenario)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app.getHttpServer())
        .get(`/export/jobs/${jobId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('url');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant import/export jobs', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'import-export-tenant2@test.com',
        password: 'password123',
        tenantName: 'Import-Export Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const jobs1 = await request(app.getHttpServer())
        .get('/import/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const jobs2 = await request(app.getHttpServer())
        .get('/import/jobs')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      expect(jobs1.body).not.toEqual(jobs2.body);

      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

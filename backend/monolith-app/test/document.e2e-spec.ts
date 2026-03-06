import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Document Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let documentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'document-test@test.com',
      password: 'password123',
      tenantName: 'Document Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM documents WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /documents', () => {
    it('should create a new document', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Document',
          type: 'pdf',
          size: 1024,
          path: '/uploads/test.pdf',
          category: 'invoice',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Document');
      expect(response.body.tenantId).toBe(tenantId);
      documentId = response.body.id;
    });

    it('should fail with invalid file type', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Document',
          type: 'exe',
          size: 1024,
          path: '/uploads/test.exe',
        })
        .expect(400);
    });
  });

  describe('GET /documents', () => {
    it('should get all documents', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents?category=invoice')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((doc) => {
        expect(doc.category).toBe('invoice');
      });
    });
  });

  describe('GET /documents/:id', () => {
    it('should get document by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(documentId);
      expect(response.body.name).toBe('Test Document');
    });
  });

  describe('GET /documents/:id/download', () => {
    it('should get download URL', async () => {
      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('url');
    });
  });

  describe('POST /documents/:id/version', () => {
    it('should create new version', async () => {
      const response = await request(app.getHttpServer())
        .post(`/documents/${documentId}/version`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          path: '/uploads/test-v2.pdf',
          size: 2048,
        })
        .expect(201);

      expect(response.body).toHaveProperty('version');
      expect(response.body.version).toBeGreaterThan(1);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete document', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant documents', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'document-tenant2@test.com',
        password: 'password123',
        tenantName: 'Document Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const doc2Res = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'Tenant 2 Document',
          type: 'pdf',
          size: 1024,
          path: '/uploads/tenant2.pdf',
        });

      const doc2Id = doc2Res.body.id;

      await request(app.getHttpServer())
        .get(`/documents/${doc2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await dataSource.query('DELETE FROM documents WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

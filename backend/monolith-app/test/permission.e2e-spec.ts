import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Permission Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let permissionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register and login
    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'permission-test@test.com',
      password: 'password123',
      tenantName: 'Permission Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM permissions WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /permissions', () => {
    it('should create a new permission', async () => {
      const response = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'create_product',
          resource: 'product',
          action: 'create',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('create_product');
      expect(response.body.tenantId).toBe(tenantId);
      permissionId = response.body.id;
    });
  });

  describe('GET /permissions', () => {
    it('should get all permissions for tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /permissions/:id', () => {
    it('should get permission by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(permissionId);
      expect(response.body.name).toBe('create_product');
    });
  });

  describe('DELETE /permissions/:id', () => {
    it('should delete permission', async () => {
      await request(app.getHttpServer())
        .delete(`/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant permissions', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'permission-tenant2@test.com',
        password: 'password123',
        tenantName: 'Permission Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const perm2Res = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'delete_product',
          resource: 'product',
          action: 'delete',
        });

      const perm2Id = perm2Res.body.id;

      await request(app.getHttpServer())
        .get(`/permissions/${perm2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await dataSource.query('DELETE FROM permissions WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

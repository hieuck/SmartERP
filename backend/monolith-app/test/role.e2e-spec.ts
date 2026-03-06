import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Role Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let roleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register and login
    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'role-test@test.com',
      password: 'password123',
      tenantName: 'Role Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM roles WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /roles', () => {
    it('should create a new role', async () => {
      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Manager',
          description: 'Manager role',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Manager');
      expect(response.body.tenantId).toBe(tenantId);
      roleId = response.body.id;
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/roles')
        .send({
          name: 'Test Role',
        })
        .expect(401);
    });
  });

  describe('GET /roles', () => {
    it('should get all roles for tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('tenantId', tenantId);
    });
  });

  describe('GET /roles/:id', () => {
    it('should get role by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(roleId);
      expect(response.body.name).toBe('Manager');
    });

    it('should return 404 for non-existent role', async () => {
      await request(app.getHttpServer())
        .get('/roles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /roles/:id', () => {
    it('should update role', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated manager role',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated manager role');
    });
  });

  describe('DELETE /roles/:id', () => {
    it('should delete role', async () => {
      await request(app.getHttpServer())
        .delete(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant roles', async () => {
      // Create second tenant
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'role-tenant2@test.com',
        password: 'password123',
        tenantName: 'Role Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      // Create role for tenant 2
      const role2Res = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'Tenant 2 Role',
        });

      const role2Id = role2Res.body.id;

      // Try to access tenant 2 role with tenant 1 token
      await request(app.getHttpServer())
        .get(`/roles/${role2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Cleanup
      await dataSource.query('DELETE FROM roles WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

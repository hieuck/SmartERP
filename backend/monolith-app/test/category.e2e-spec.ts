import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Category Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'category-test@test.com',
      password: 'password123',
      tenantName: 'Category Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM categories WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /categories', () => {
    it('should create a new category', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Electronics',
          description: 'Electronic products',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Electronics');
      expect(response.body.tenantId).toBe(tenantId);
      categoryId = response.body.id;
    });
  });

  describe('GET /categories', () => {
    it('should get all categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /categories/:id', () => {
    it('should get category by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(categoryId);
      expect(response.body.name).toBe('Electronics');
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should update category', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated electronics category',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated electronics category');
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant categories', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'category-tenant2@test.com',
        password: 'password123',
        tenantName: 'Category Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const cat2Res = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'Tenant 2 Category',
        });

      const cat2Id = cat2Res.body.id;

      await request(app.getHttpServer())
        .get(`/categories/${cat2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await dataSource.query('DELETE FROM categories WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

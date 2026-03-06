import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Search Module (e2e)', () => {
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
      email: 'search-test@test.com',
      password: 'password123',
      tenantName: 'Search Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;

    // Create test data
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Laptop Computer', sku: 'LAP-001', price: 1000 });

    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'John Doe', email: 'john@example.com' });
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM products WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM customers WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('GET /search', () => {
    it('should search across all entities', async () => {
      const response = await request(app.getHttpServer())
        .get('/search?q=laptop')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('orders');
    });
  });

  describe('GET /search/products', () => {
    it('should search products', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/products?q=laptop')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain('Laptop');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not search other tenant data', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'search-tenant2@test.com',
        password: 'password123',
        tenantName: 'Search Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const response = await request(app.getHttpServer())
        .get('/search/products?q=laptop')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      expect(response.body.length).toBe(0);

      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Report Module (e2e)', () => {
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
      email: 'report-test@test.com',
      password: 'password123',
      tenantName: 'Report Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;

    // Create test data for reports
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Product',
        sku: 'TEST-001',
        price: 100,
      });

    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerName: 'Test Customer',
        items: [{ productId: 'test', quantity: 2 }],
        totalAmount: 200,
      });
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM orders WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM products WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('GET /reports/sales', () => {
    it('should get sales report', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalSales');
      expect(response.body).toHaveProperty('orderCount');
      expect(response.body).toHaveProperty('averageOrderValue');
    });
  });

  describe('GET /reports/inventory', () => {
    it('should get inventory report', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalProducts');
      expect(response.body).toHaveProperty('totalValue');
      expect(response.body).toHaveProperty('lowStockItems');
    });
  });

  describe('GET /reports/customers', () => {
    it('should get customer report', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalCustomers');
      expect(response.body).toHaveProperty('activeCustomers');
      expect(response.body).toHaveProperty('topCustomers');
    });
  });

  describe('GET /reports/financial', () => {
    it('should get financial report', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/financial')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.body).toHaveProperty('revenue');
      expect(response.body).toHaveProperty('expenses');
      expect(response.body).toHaveProperty('profit');
    });
  });

  describe('GET /reports/dashboard', () => {
    it('should get dashboard summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sales');
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('inventory');
    });
  });

  describe('POST /reports/custom', () => {
    it('should generate custom report', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'sales',
          filters: {
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
          groupBy: 'month',
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant reports', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'report-tenant2@test.com',
        password: 'password123',
        tenantName: 'Report Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      const report1 = await request(app.getHttpServer())
        .get('/reports/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const report2 = await request(app.getHttpServer())
        .get('/reports/sales')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      expect(report1.body.totalSales).not.toBe(report2.body.totalSales);

      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});

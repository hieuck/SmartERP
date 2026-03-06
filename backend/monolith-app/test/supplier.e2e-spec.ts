import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SupplierController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'supplier-test@example.com',
      password: 'password123',
      firstName: 'Supplier',
      lastName: 'Test',
      tenantId: 'tenant-supplier-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/suppliers (POST)', () => {
    it('should create a new supplier', () => {
      return request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'ABC Supplies',
          email: 'contact@abcsupplies.com',
          phone: '1234567890',
          address: '456 Supplier St',
          taxId: 'TAX123456',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'ABC Supplies');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/suppliers')
        .send({
          name: 'Unauthorized Supplier',
        })
        .expect(401);
    });
  });

  describe('/suppliers (GET)', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Supplier One',
          email: 'supplier1@example.com',
        });
    });

    it('should get all suppliers', () => {
      return request(app.getHttpServer())
        .get('/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('tenantId', tenantId);
        });
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1SupplierId: string;

    beforeAll(async () => {
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-sup@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'Sup',
        tenantId: 'tenant-sup-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-sup@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'Sup',
        tenantId: 'tenant-sup-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      const supplierResponse = await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          name: 'Tenant 1 Supplier',
          email: 'tenant1-supplier@example.com',
        });
      tenant1SupplierId = supplierResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 suppliers', async () => {
      const response = await request(app.getHttpServer())
        .get('/suppliers')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Suppliers = response.body.filter(
        (s: { tenantId: string; id: string; name: string }) => s.tenantId === 'tenant-sup-1',
      );
      expect(tenant1Suppliers.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 supplier by id', () => {
      return request(app.getHttpServer())
        .get(`/suppliers/${tenant1SupplierId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });
  });
});

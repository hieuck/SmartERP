import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TenantController (e2e)', () => {
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

    // Register and login as admin
    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'tenant-admin@example.com',
      password: 'password123',
      firstName: 'Tenant',
      lastName: 'Admin',
      tenantId: 'tenant-admin-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tenants (POST)', () => {
    it('should create a new tenant', () => {
      return request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Company',
          code: 'NEW-COMP',
          email: 'contact@newcompany.com',
          phone: '1234567890',
          address: '123 Business St',
          status: 'active',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'New Company');
          expect(res.body).toHaveProperty('code', 'NEW-COMP');
          expect(res.body).toHaveProperty('status', 'active');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/tenants')
        .send({
          name: 'Unauthorized Tenant',
          code: 'UNAUTH',
        })
        .expect(401);
    });

    it('should return 400 with duplicate code', async () => {
      // Create first tenant
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'First Tenant',
          code: 'DUPLICATE',
        });

      // Try to create with same code
      return request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Second Tenant',
          code: 'DUPLICATE',
        })
        .expect(400);
    });
  });

  describe('/tenants (GET)', () => {
    beforeAll(async () => {
      // Create test tenants
      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Tenant One',
          code: 'TENANT-1',
        });

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Tenant Two',
          code: 'TENANT-2',
        });
    });

    it('should get all tenants', () => {
      return request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/tenants?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((tenant: { status: string; id: string; name: string }) => {
            expect(tenant.status).toBe('active');
          });
        });
    });
  });

  describe('/tenants/:id (GET)', () => {
    let testTenantId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Single Tenant',
          code: 'SINGLE',
        });

      testTenantId = response.body.id;
    });

    it('should get tenant by id', () => {
      return request(app.getHttpServer())
        .get(`/tenants/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testTenantId);
          expect(res.body).toHaveProperty('name', 'Single Tenant');
        });
    });

    it('should return 404 for non-existent tenant', () => {
      return request(app.getHttpServer())
        .get('/tenants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/tenants/:id (PATCH)', () => {
    let testTenantId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Update Tenant',
          code: 'UPDATE',
        });

      testTenantId = response.body.id;
    });

    it('should update tenant', () => {
      return request(app.getHttpServer())
        .patch(`/tenants/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Tenant Name',
          email: 'updated@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Updated Tenant Name');
          expect(res.body).toHaveProperty('email', 'updated@example.com');
        });
    });

    it('should not update code', () => {
      return request(app.getHttpServer())
        .patch(`/tenants/${testTenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'NEW-CODE', // Code should be immutable
        })
        .expect(400);
    });
  });

  describe('/tenants/:id/activate (PATCH)', () => {
    let testTenantId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Inactive Tenant',
          code: 'INACTIVE',
          status: 'inactive',
        });

      testTenantId = response.body.id;
    });

    it('should activate tenant', () => {
      return request(app.getHttpServer())
        .patch(`/tenants/${testTenantId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'active');
        });
    });
  });

  describe('/tenants/:id/deactivate (PATCH)', () => {
    let testTenantId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Active Tenant',
          code: 'ACTIVE',
        });

      testTenantId = response.body.id;
    });

    it('should deactivate tenant', () => {
      return request(app.getHttpServer())
        .patch(`/tenants/${testTenantId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'inactive');
        });
    });
  });

  describe('/tenants/:id/stats (GET)', () => {
    let testTenantId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Stats Tenant',
          code: 'STATS',
        });

      testTenantId = response.body.id;
    });

    it('should get tenant statistics', () => {
      return request(app.getHttpServer())
        .get(`/tenants/${testTenantId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userCount');
          expect(res.body).toHaveProperty('productCount');
          expect(res.body).toHaveProperty('orderCount');
          expect(res.body).toHaveProperty('customerCount');
        });
    });
  });

  describe('Tenant Isolation', () => {
    it('should only see own tenant data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(tenantId);
    });

    it('should not access other tenant data without permission', async () => {
      // Create another tenant
      const otherTenant = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Other Tenant',
          code: 'OTHER',
        });

      // Regular user should not access other tenant
      const userResponse = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'regular@example.com',
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
        tenantId: tenantId,
      });

      return request(app.getHttpServer())
        .get(`/tenants/${otherTenant.body.id}`)
        .set('Authorization', `Bearer ${userResponse.body.accessToken}`)
        .expect(403); // Forbidden
    });
  });
});

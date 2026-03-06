import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CustomerController (e2e)', () => {
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

    // Register and login
    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'customer-test@example.com',
      password: 'password123',
      firstName: 'Customer',
      lastName: 'Test',
      tenantId: 'tenant-customer-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/customers (POST)', () => {
    it('should create a new customer', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main St',
          city: 'New York',
          country: 'USA',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'John Doe');
          expect(res.body).toHaveProperty('email', 'john@example.com');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Unauthorized Customer',
          email: 'unauth@example.com',
        })
        .expect(401);
    });

    it('should return 400 with invalid email', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
        })
        .expect(400);
    });

    it('should return 400 with duplicate email', async () => {
      // Create first customer
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'First Customer',
          email: 'duplicate@example.com',
        });

      // Try to create with same email
      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Second Customer',
          email: 'duplicate@example.com',
        })
        .expect(400);
    });
  });

  describe('/customers (GET)', () => {
    beforeAll(async () => {
      // Create test customers
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Customer One',
          email: 'customer1@example.com',
          phone: '1111111111',
        });

      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Customer Two',
          email: 'customer2@example.com',
          phone: '2222222222',
        });
    });

    it('should get all customers', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body[0]).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should search customers by name', () => {
      return request(app.getHttpServer())
        .get('/customers?search=Customer One')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
          expect(res.body[0].name).toContain('Customer One');
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/customers?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(
            (customer: { status: string; id: string; name: string; email: string }) => {
              expect(customer.status).toBe('active');
            },
          );
        });
    });
  });

  describe('/customers/:id (GET)', () => {
    let customerId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Single Customer',
          email: 'single@example.com',
          phone: '3333333333',
        });

      customerId = response.body.id;
    });

    it('should get customer by id', () => {
      return request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', customerId);
          expect(res.body).toHaveProperty('name', 'Single Customer');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 404 for non-existent customer', () => {
      return request(app.getHttpServer())
        .get('/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/customers/:id (PATCH)', () => {
    let customerId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Update Customer',
          email: 'update@example.com',
          phone: '4444444444',
        });

      customerId = response.body.id;
    });

    it('should update customer', () => {
      return request(app.getHttpServer())
        .patch(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Customer Name',
          phone: '5555555555',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Updated Customer Name');
          expect(res.body).toHaveProperty('phone', '5555555555');
        });
    });

    it('should return 404 for non-existent customer', () => {
      return request(app.getHttpServer())
        .patch('/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Non-existent',
        })
        .expect(404);
    });
  });

  describe('/customers/:id (DELETE)', () => {
    let customerId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Delete Customer',
          email: 'delete@example.com',
          phone: '6666666666',
        });

      customerId = response.body.id;
    });

    it('should soft delete customer', () => {
      return request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should not return deleted customer', () => {
      return request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/customers/:id/activate (PATCH)', () => {
    let customerId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Status Customer',
          email: 'status@example.com',
          status: 'inactive',
        });

      customerId = response.body.id;
    });

    it('should activate customer', () => {
      return request(app.getHttpServer())
        .patch(`/customers/${customerId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'active');
        });
    });
  });

  describe('/customers/:id/deactivate (PATCH)', () => {
    let customerId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Deactivate Customer',
          email: 'deactivate@example.com',
        });

      customerId = response.body.id;
    });

    it('should deactivate customer', () => {
      return request(app.getHttpServer())
        .patch(`/customers/${customerId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'inactive');
        });
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1CustomerId: string;

    beforeAll(async () => {
      // Create tenant 1
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-cust@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'Cust',
        tenantId: 'tenant-cust-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      // Create tenant 2
      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-cust@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'Cust',
        tenantId: 'tenant-cust-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      // Create customer for tenant 1
      const customerResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          name: 'Tenant 1 Customer',
          email: 'tenant1-customer@example.com',
        });
      tenant1CustomerId = customerResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Customers = response.body.filter(
        (c: { tenantId: string; id: string; name: string; email: string }) =>
          c.tenantId === 'tenant-cust-1',
      );
      expect(tenant1Customers.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 customer by id', () => {
      return request(app.getHttpServer())
        .get(`/customers/${tenant1CustomerId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });

    it('tenant 2 should not update tenant 1 customer', () => {
      return request(app.getHttpServer())
        .patch(`/customers/${tenant1CustomerId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'Hacked Customer',
        })
        .expect(404);
    });

    it('tenant 2 should not delete tenant 1 customer', () => {
      return request(app.getHttpServer())
        .delete(`/customers/${tenant1CustomerId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });
  });
});

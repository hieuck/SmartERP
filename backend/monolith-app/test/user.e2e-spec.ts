import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UserController (e2e)', () => {
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

    // Register and login to get auth token
    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'user-admin@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'Admin',
      tenantId: 'tenant-user-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: 'user',
          status: 'active',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'newuser@example.com');
          expect(res.body).toHaveProperty('tenantId', tenantId);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'unauthorized@example.com',
          password: 'password123',
          firstName: 'Unauthorized',
          lastName: 'User',
        })
        .expect(401);
    });

    it('should return 400 with duplicate email', async () => {
      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          firstName: 'First',
          lastName: 'User',
        });

      // Try to create with same email
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@example.com',
          password: 'password456',
          firstName: 'Second',
          lastName: 'User',
        })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    beforeAll(async () => {
      // Create test users
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'user1@example.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'One',
        });

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'user2@example.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'Two',
        });
    });

    it('should get all users for tenant', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body[0]).toHaveProperty('tenantId', tenantId);
          expect(res.body[0]).not.toHaveProperty('password');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'singleuser@example.com',
          password: 'password123',
          firstName: 'Single',
          lastName: 'User',
        });

      userId = response.body.id;
    });

    it('should get user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('email', 'singleuser@example.com');
          expect(res.body).toHaveProperty('tenantId', tenantId);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'updateuser@example.com',
          password: 'password123',
          firstName: 'Update',
          lastName: 'User',
        });

      userId = response.body.id;
    });

    it('should update user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('firstName', 'Updated');
          expect(res.body).toHaveProperty('lastName', 'Name');
        });
    });

    it('should not update password directly', () => {
      return request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'newpassword',
        })
        .expect(400);
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'deleteuser@example.com',
          password: 'password123',
          firstName: 'Delete',
          lastName: 'User',
        });

      userId = response.body.id;
    });

    it('should soft delete user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should not return deleted user', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('User Status Management', () => {
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'statususer@example.com',
          password: 'password123',
          firstName: 'Status',
          lastName: 'User',
        });

      userId = response.body.id;
    });

    it('should activate user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${userId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'active');
        });
    });

    it('should deactivate user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${userId}/deactivate`)
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
    let tenant1UserId: string;

    beforeAll(async () => {
      // Create tenant 1 user
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-user@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'User',
        tenantId: 'tenant-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      // Create tenant 2 user
      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-user@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'User',
        tenantId: 'tenant-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      // Create user for tenant 1
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          email: 'tenant1-employee@example.com',
          password: 'password123',
          firstName: 'Tenant1',
          lastName: 'Employee',
        });
      tenant1UserId = userResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Users = response.body.filter(
        (u: { tenantId: string }) => u.tenantId === 'tenant-1',
      );
      expect(tenant1Users.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${tenant1UserId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });
  });
});

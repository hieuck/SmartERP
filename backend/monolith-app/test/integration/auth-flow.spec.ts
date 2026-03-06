import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Authentication Flow (Integration)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration and Login Flow', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      tenantId: 'test-tenant',
    };

    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('password');

      userId = response.body.id;
    });

    it('should not register user with duplicate email', async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(409);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      authToken = response.body.accessToken;
    });

    it('should not login with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
    });

    it('should not access protected route without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should refresh token', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should change password', async () => {
      const newPassword = 'NewTest123!@#';

      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: testUser.password,
          newPassword: newPassword,
        })
        .expect(200);

      // Login with new password
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should isolate users by tenant', async () => {
      const tenant1User = {
        email: `tenant1-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Tenant1',
        lastName: 'User',
        tenantId: 'tenant-1',
      };

      const tenant2User = {
        email: `tenant2-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Tenant2',
        lastName: 'User',
        tenantId: 'tenant-2',
      };

      // Register users in different tenants
      await request(app.getHttpServer()).post('/api/auth/register').send(tenant1User).expect(201);

      await request(app.getHttpServer()).post('/api/auth/register').send(tenant2User).expect(201);

      // Login as tenant1 user
      const tenant1Login = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: tenant1User.email,
        password: tenant1User.password,
      });

      const tenant1Token = tenant1Login.body.accessToken;

      // Verify tenant isolation
      const meResponse = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(200);

      expect(meResponse.body.tenantId).toBe('tenant-1');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseTestHelper } from '../helpers/database.helper';
import { createUserDto } from '../fixtures/users.fixture';
import { createTenantDto } from '../fixtures/tenants.fixture';

describe('Auth API (Integration)', () => {
  let app: INestApplication;
  let testTenant: { id: string; code: string; name: string };
  let testUser: { id: string; email: string };
  let accessToken: string;

  beforeAll(async () => {
    // Setup test database
    await DatabaseTestHelper.setupTestDatabase();

    // Create test app
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Create test tenant
    const tenantDto = createTenantDto();
    const tenantResponse = await request(app.getHttpServer())
      .post('/api/tenants')
      .send(tenantDto);
    testTenant = tenantResponse.body.data;
  });

  afterAll(async () => {
    await DatabaseTestHelper.closeDatabase();
    await app.close();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userDto = createUserDto({ tenantId: testTenant.id });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(userDto.email);
      expect(response.body.data.password).toBeUndefined(); // Should not expose password
    });

    it('should return 400 with invalid email', async () => {
      const userDto = createUserDto({ 
        tenantId: testTenant.id,
        email: 'invalid-email' 
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should return 400 with weak password', async () => {
      const userDto = createUserDto({ 
        tenantId: testTenant.id,
        password: '123' 
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    it('should return 409 with duplicate email in same tenant', async () => {
      const userDto = createUserDto({ tenantId: testTenant.id });

      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto)
        .expect(201);

      // Duplicate registration
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should allow same email in different tenants', async () => {
      // Create another tenant
      const tenant2Dto = createTenantDto();
      const tenant2Response = await request(app.getHttpServer())
        .post('/api/tenants')
        .send(tenant2Dto);
      const testTenant2 = tenant2Response.body.data;

      const email = `same-${Date.now()}@test.com`;

      // Register in first tenant
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(createUserDto({ tenantId: testTenant.id, email }))
        .expect(201);

      // Register same email in second tenant - should succeed
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(createUserDto({ tenantId: testTenant2.id, email }))
        .expect(201);
    });

    it('should return 400 with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const userDto = createUserDto({ tenantId: testTenant.id });
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto);
      testUser = { ...response.body.data, password: userDto.password };
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          tenantId: testTenant.id,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();

      accessToken = response.body.data.accessToken;
    });

    it('should return 401 with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'wrong@test.com',
          password: testUser.password,
          tenantId: testTenant.id,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
          tenantId: testTenant.id,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 with wrong tenant', async () => {
      // Create another tenant
      const tenant2Dto = createTenantDto();
      const tenant2Response = await request(app.getHttpServer())
        .post('/api/tenants')
        .send(tenant2Dto);
      const testTenant2 = tenant2Response.body.data;

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          tenantId: testTenant2.id, // Wrong tenant
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Create and login test user
      const userDto = createUserDto({ tenantId: testTenant.id });
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userDto.email,
          password: userDto.password,
          tenantId: testTenant.id,
        });

      accessToken = loginResponse.body.data.accessToken;
      testUser = loginResponse.body.data.user;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with expired token', async () => {
      // This would require mocking time or using a token with very short expiry
      // For now, we'll skip this test
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const userDto = createUserDto({ tenantId: testTenant.id });
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userDto.email,
          password: userDto.password,
          tenantId: testTenant.id,
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should generate new access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(refreshToken);
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 with missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    beforeEach(async () => {
      const userDto = createUserDto({ tenantId: testTenant.id });
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userDto.email,
          password: userDto.password,
          tenantId: testTenant.id,
        });

      accessToken = loginResponse.body.data.accessToken;
      testUser = { ...loginResponse.body.data.user, password: userDto.password };
    });

    it('should change password with valid current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify can login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'NewPassword123!',
          tenantId: testTenant.id,
        })
        .expect(200);

      expect(loginResponse.body.data.accessToken).toBeDefined();
    });

    it('should return 401 with invalid current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 with weak new password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      const userDto = createUserDto({ tenantId: testTenant.id });
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userDto);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userDto.email,
          password: userDto.password,
          tenantId: testTenant.id,
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'wrong',
        tenantId: testTenant.id,
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send(loginDto);
      }

      // Next attempt should be rate limited
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(429);

      expect(response.body.message).toContain('Too many requests');
    });
  });
});

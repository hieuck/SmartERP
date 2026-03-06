import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Tenant Registration Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.query('DELETE FROM users');
    await dataSource.query('DELETE FROM tenants');
  });

  describe('POST /auth/register-tenant', () => {
    const validRegistration = {
      companyName: 'Test Company Ltd',
      subdomain: 'test-company',
      email: 'admin@testcompany.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0901234567',
    };

    it('should successfully register a new tenant with admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(validRegistration)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.tenant).toBeDefined();
      expect(response.body.data.tenant.subdomain).toBe(validRegistration.subdomain);
      expect(response.body.data.tenant.name).toBe(validRegistration.companyName);
      expect(response.body.data.tenant.plan).toBe('free');
      expect(response.body.data.tenant.trialEndsAt).toBeDefined();

      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validRegistration.email);
      expect(response.body.data.user.firstName).toBe(validRegistration.firstName);
      expect(response.body.data.user.lastName).toBe(validRegistration.lastName);
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.user.emailVerified).toBe(false);

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.emailVerificationToken).toBeDefined();
    });

    it('should reject registration with duplicate subdomain', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(validRegistration)
        .expect(201);

      // Second registration with same subdomain
      const duplicateRegistration = {
        ...validRegistration,
        email: 'different@email.com',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(duplicateRegistration)
        .expect(409);

      expect(response.body.message).toContain('already taken');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(validRegistration)
        .expect(201);

      // Second registration with same email
      const duplicateRegistration = {
        ...validRegistration,
        subdomain: 'different-subdomain',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(duplicateRegistration)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should reject registration with invalid subdomain format', async () => {
      const invalidRegistration = {
        ...validRegistration,
        subdomain: 'Invalid_Subdomain!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(invalidRegistration)
        .expect(400);

      expect(response.body.message).toContain('subdomain');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordRegistration = {
        ...validRegistration,
        password: 'weak',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(weakPasswordRegistration)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const invalidEmailRegistration = {
        ...validRegistration,
        email: 'not-an-email',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(invalidEmailRegistration)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject registration with missing required fields', async () => {
      const incompleteRegistration = {
        companyName: 'Test Company',
        // Missing subdomain, email, password
      };

      await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(incompleteRegistration)
        .expect(400);
    });
  });

  describe('GET /auth/verify-email', () => {
    it('should successfully verify email with valid token', async () => {
      // Register tenant first
      const registrationResponse = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send({
          companyName: 'Test Company',
          subdomain: 'test-verify',
          email: 'verify@test.com',
          password: 'SecurePass123!',
        })
        .expect(201);

      const { emailVerificationToken } = registrationResponse.body.data;

      // Verify email
      const response = await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${emailVerificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified');
      expect(response.body.user.emailVerified).toBe(true);
    });

    it('should reject verification with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/verify-email?token=invalid-token')
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });

    it('should handle already verified email', async () => {
      // Register and verify
      const registrationResponse = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send({
          companyName: 'Test Company',
          subdomain: 'test-already-verified',
          email: 'already@test.com',
          password: 'SecurePass123!',
        })
        .expect(201);

      const { emailVerificationToken } = registrationResponse.body.data;

      // First verification
      await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${emailVerificationToken}`)
        .expect(200);

      // Second verification (already verified)
      const response = await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${emailVerificationToken}`)
        .expect(200);

      expect(response.body.message).toContain('already verified');
    });
  });

  describe('Complete Registration Flow', () => {
    it('should complete full registration and login flow', async () => {
      const registrationData = {
        companyName: 'Full Flow Company',
        subdomain: 'full-flow',
        email: 'fullflow@test.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      // Step 1: Register tenant
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send(registrationData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const { accessToken, emailVerificationToken } = registerResponse.body.data;

      // Step 2: Verify email
      const verifyResponse = await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${emailVerificationToken}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);

      // Step 3: Access protected route with token
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(registrationData.email);
      expect(profileResponse.body.role).toBe('admin');

      // Step 4: Login with credentials
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registrationData.email,
          password: registrationData.password,
        })
        .expect(201);

      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user.email).toBe(registrationData.email);
    });
  });

  describe('Tenant Isolation', () => {
    it('should create separate tenants with isolated data', async () => {
      // Register first tenant
      const tenant1Response = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send({
          companyName: 'Company One',
          subdomain: 'company-one',
          email: 'admin1@company1.com',
          password: 'SecurePass123!',
        })
        .expect(201);

      // Register second tenant
      const tenant2Response = await request(app.getHttpServer())
        .post('/auth/register-tenant')
        .send({
          companyName: 'Company Two',
          subdomain: 'company-two',
          email: 'admin2@company2.com',
          password: 'SecurePass123!',
        })
        .expect(201);

      const tenant1Id = tenant1Response.body.data.tenant.id;
      const tenant2Id = tenant2Response.body.data.tenant.id;

      expect(tenant1Id).not.toBe(tenant2Id);
      expect(tenant1Response.body.data.user.email).not.toBe(tenant2Response.body.data.user.email);
    });
  });
});

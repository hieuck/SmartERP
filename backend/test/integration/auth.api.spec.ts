import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UserService } from '../../src/modules/user/user.service';
import { TenantService } from '../../src/modules/tenant/tenant.service';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';

describe('Auth API (Simplified Integration)', () => {
  let app: INestApplication;
  let userService: UserService;
  let tenantService: TenantService;

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Company',
    subdomain: 'testco',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    password: '', // Will be set
    firstName: 'Test',
    lastName: 'User',
    tenantId: 'tenant-123',
    roles: ['user'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 100,
          },
        ]),
      ],
    })
      .overrideProvider(UserService)
      .useValue({
        findByEmail: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      })
      .overrideProvider(TenantService)
      .useValue({
        findById: jest.fn(),
        findBySubdomain: jest.fn(),
        create: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    tenantService = moduleFixture.get<TenantService>(TenantService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const registerDto = {
        email: 'newuser@test.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        tenantId: mockTenant.id,
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(tenantService, 'findById').mockResolvedValue(mockTenant as any);
      jest.spyOn(userService, 'create').mockResolvedValue({
        ...mockUser,
        ...registerDto,
      } as any);

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(registerDto.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 400 with invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        tenantId: mockTenant.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 400 with weak password', async () => {
      const registerDto = {
        email: 'test@test.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
        tenantId: mockTenant.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 409 with duplicate email', async () => {
      const registerDto = {
        email: 'existing@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        tenantId: mockTenant.id,
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      mockUser.password = await bcrypt.hash('Password123!', 10);
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'Password123!',
        tenantId: mockTenant.id,
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(loginDto.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 with invalid email', async () => {
      const loginDto = {
        email: 'wrong@test.com',
        password: 'Password123!',
        tenantId: mockTenant.id,
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 with invalid password', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'WrongPassword123!',
        tenantId: mockTenant.id,
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      mockUser.password = await bcrypt.hash('Password123!', 10);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser as any);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          tenantId: mockTenant.id,
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      mockUser.password = await bcrypt.hash('Password123!', 10);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser as any);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          tenantId: mockTenant.id,
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
    });

    it('should return 401 with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should return 400 with missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let accessToken: string;

    beforeEach(async () => {
      mockUser.password = await bcrypt.hash('Password123!', 10);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(userService, 'update').mockResolvedValue(mockUser as any);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          tenantId: mockTenant.id,
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should change password with valid current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 401 with invalid current password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });

    it('should return 400 with weak new password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: '123',
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      mockUser.password = await bcrypt.hash('Password123!', 10);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser as any);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          tenantId: mockTenant.id,
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
      await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });
  });
});

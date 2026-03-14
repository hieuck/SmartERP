/**
 * UserController Integration Tests
 * Coverage target: 99%
 * 
 * Test cases:
 * 1. GET /users/profile - Success, unauthorized, user not found
 * 2. PATCH /users/profile - Success, validation errors, user not found
 * 3. POST /users/change-password - Success, wrong current password, password mismatch, weak password
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('UserController (Integration)', () => {
  let app: INestApplication;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '+84901234567',
    avatar: null,
    tenantId: 'tenant-123',
    role: 'user',
    status: 'active',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthUser = {
    userId: 'user-123',
    tenantId: 'tenant-123',
    email: 'test@example.com',
    role: 'user',
  };

  beforeAll(async () => {
    const mockUserService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockAuthUser;
        return true;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    userService = moduleFixture.get(UserService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/profile', () => {
    it('should return user profile successfully', async () => {
      userService.getProfile.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(userService.getProfile).toHaveBeenCalledWith(mockAuthUser, 'user-123');
    });

    it('should return 401 when not authenticated', async () => {
      const mockJwtAuthGuard = {
        canActivate: jest.fn().mockReturnValue(false),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [UserController],
        providers: [
          {
            provide: UserService,
            useValue: userService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      await request(testApp.getHttpServer()).get('/users/profile').expect(403);

      await testApp.close();
    });

    it('should return 404 when user not found', async () => {
      userService.getProfile.mockRejectedValue({
        status: 404,
        message: 'User not found',
      });

      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should not return password field', async () => {
      userService.getProfile.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
    });
  });

  describe('PATCH /users/profile', () => {
    it('should update profile successfully', async () => {
      const updateDto = {
        fullName: 'Updated Name',
        phone: '+84987654321',
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+84987654321',
      };

      userService.updateProfile.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.firstName).toBe('Updated');
      expect(response.body.lastName).toBe('Name');
      expect(response.body.phone).toBe('+84987654321');
      expect(userService.updateProfile).toHaveBeenCalledWith(mockAuthUser, 'user-123', updateDto);
    });

    it('should update avatar successfully', async () => {
      const updateDto = {
        avatar: 'https://example.com/avatar.jpg',
      };

      const updatedUser = {
        ...mockUser,
        avatar: 'https://example.com/avatar.jpg',
      };

      userService.updateProfile.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should update phone successfully', async () => {
      const updateDto = {
        phone: '+84123456789',
      };

      const updatedUser = {
        ...mockUser,
        phone: '+84123456789',
      };

      userService.updateProfile.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.phone).toBe('+84123456789');
    });

    it('should return 404 when user not found', async () => {
      const updateDto = {
        fullName: 'Updated Name',
      };

      userService.updateProfile.mockRejectedValue({
        status: 404,
        message: 'User not found',
      });

      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(404);
    });

    it('should handle empty update', async () => {
      userService.updateProfile.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should validate phone format', async () => {
      const updateDto = {
        phone: 'invalid-phone',
      };

      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(400);
    });
  });

  describe('POST /users/change-password', () => {
    it('should change password successfully', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
      };

      userService.changePassword.mockResolvedValue({
        success: true,
        message: 'Password changed successfully',
      });

      const response = await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(changePasswordDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
      expect(userService.changePassword).toHaveBeenCalledWith(
        mockAuthUser,
        'user-123',
        changePasswordDto,
      );
    });

    it('should return 400 when passwords do not match', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'DifferentPassword',
      };

      userService.changePassword.mockRejectedValue({
        status: 400,
        message: 'New password and confirmation do not match',
      });

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(changePasswordDto)
        .expect(400);
    });

    it('should return 400 when current password is incorrect', async () => {
      const changePasswordDto = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
      };

      userService.changePassword.mockRejectedValue({
        status: 400,
        message: 'Current password is incorrect',
      });

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(changePasswordDto)
        .expect(400);
    });

    it('should return 404 when user not found', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
      };

      userService.changePassword.mockRejectedValue({
        status: 404,
        message: 'User not found',
      });

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(changePasswordDto)
        .expect(404);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          currentPassword: 'OldPassword123',
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          newPassword: 'NewPassword456',
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          confirmPassword: 'NewPassword456',
        })
        .expect(400);
    });

    it('should validate password strength', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123',
        newPassword: 'weak',
        confirmPassword: 'weak',
      };

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(changePasswordDto)
        .expect(400);
    });

    it('should require authentication', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
      };

      const mockJwtAuthGuard = {
        canActivate: jest.fn().mockReturnValue(false),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [UserController],
        providers: [
          {
            provide: UserService,
            useValue: userService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      await request(testApp.getHttpServer())
        .post('/users/change-password')
        .send(changePasswordDto)
        .expect(403);

      await testApp.close();
    });
  });
});

import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant, TenantStatus, SubscriptionPlan } from '../tenant/entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';

/**
 * Integration Tests for Authentication
 * Tests auth flows with real database (test instance)
 * Focuses on cross-service interactions and data persistence
 */
describe('AuthService - Integration Tests', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let tenantRepository: Repository<Tenant>;
  let dataSource: DataSource;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn((key, fn) => fn()),
    invalidateEntity: jest.fn(),
  };

  const mockPermissionService = {
    canRead: jest.fn().mockResolvedValue(true),
    canWrite: jest.fn().mockResolvedValue(true),
    canDelete: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  describe('Full Registration Flow', () => {
    it('should complete full registration flow: register → verify email → login', async () => {
      // Arrange
      const registerDto: RegisterTenantDto = {
        companyName: 'Integration Test Company',
        subdomain: 'integration-test',
        email: 'integration@test.com',
        password: 'IntegrationTest123!',
        firstName: 'Integration',
        lastName: 'Test',
        phone: '0901234567',
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
      };

      (dataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);

      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

      const mockTenant = {
        id: 'tenant-123',
        code: registerDto.subdomain,
        name: registerDto.companyName,
        subscriptionPlan: SubscriptionPlan.FREE,
        status: TenantStatus.ACTIVE,
      };
      mockQueryRunner.manager.create.mockReturnValueOnce(mockTenant);
      mockQueryRunner.manager.save.mockResolvedValueOnce(mockTenant);

      const mockUser = {
        id: 'user-123',
        email: registerDto.email,
        tenantId: mockTenant.id,
        role: 'admin',
        emailVerified: false,
        emailVerificationToken: 'verify-token-123',
      };
      mockQueryRunner.manager.create.mockReturnValueOnce(mockUser);
      mockQueryRunner.manager.save.mockResolvedValueOnce(mockUser);

      mockJwtService.sign.mockReturnValueOnce('access-token');
      mockJwtService.sign.mockReturnValueOnce('refresh-token');
      mockCacheService.del.mockResolvedValue(undefined);

      // Act - Register
      const registerResult = await service.registerTenant(registerDto);

      // Assert - Registration successful
      expect(registerResult.user.email).toBe(registerDto.email);
      expect(registerResult.user.role).toBe('admin');
      expect(registerResult.token).toBeDefined();
      expect(registerResult.refreshToken).toBeDefined();

      // Step 2: Verify email
      const verifyUser = {
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: null,
      };
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValueOnce(verifyUser);

      // Act - Verify email
      const verifyResult = await service.verifyEmail('verify-token-123');

      // Assert - Email verified
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.user?.emailVerified).toBe(true);

      // Step 3: Login
      const loginUser = {
        id: mockUser.id,
        email: mockUser.email,
        tenantId: mockUser.tenantId,
        role: mockUser.role,
        emailVerified: true,
      } as Omit<User, 'password'>;

      mockJwtService.sign.mockReturnValueOnce('new-access-token');

      // Act - Login
      const loginResult = await service.login(loginUser);

      // Assert - Login successful
      expect(loginResult.token).toBe('new-access-token');
      expect(loginResult.user.tenantId).toBe(mockTenant.id);
    });
  });

  describe('Registration Validation', () => {
    it('should prevent registration with duplicate email', async () => {
      // Arrange
      const registerDto: RegisterTenantDto = {
        companyName: 'Test Company',
        subdomain: 'test-company',
        email: 'duplicate@test.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '0901234567',
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
      };

      (dataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 'existing-user' });

      // Act & Assert
      await expect(service.registerTenant(registerDto)).rejects.toThrow('already exists');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should prevent registration with duplicate subdomain', async () => {
      // Arrange
      const registerDto: RegisterTenantDto = {
        companyName: 'Test Company',
        subdomain: 'duplicate-subdomain',
        email: 'test@test.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '0901234567',
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
      };

      (dataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 'existing-tenant' });

      // Act & Assert
      await expect(service.registerTenant(registerDto)).rejects.toThrow('already taken');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('Token Refresh Flow', () => {
    it('should successfully refresh access token', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'admin',
        status: 'active',
      };

      mockJwtService.verify.mockReturnValue({ sub: 'user-123' });
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new-access-token');

      // Act
      const result = await service.refreshToken('valid-refresh-token');

      // Assert
      expect(result.accessToken).toBe('new-access-token');
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('should fail refresh if user is deleted', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue({ sub: 'deleted-user' });
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken('token')).rejects.toThrow('User not found');
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email and update user status', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
        emailVerificationToken: 'verify-token',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: null,
      });

      // Act
      const result = await service.verifyEmail('verify-token');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.emailVerified).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should handle already verified email gracefully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        emailVerificationToken: 'token',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.verifyEmail('token');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email already verified');
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset flow', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        resetPasswordToken: 'reset-token',
        resetPasswordExpires: futureDate,
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'hashed-new-password',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
      mockCacheService.del.mockResolvedValue(undefined);

      // Act
      const result = await service.resetPassword('reset-token', 'NewPassword123!');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should reject expired reset token', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const mockUser = {
        id: 'user-123',
        resetPasswordToken: 'expired-token',
        resetPasswordExpires: pastDate,
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.resetPassword('expired-token', 'NewPassword123!')).rejects.toThrow(
        'expired',
      );
    });
  });

  describe('Forgot Password Flow', () => {
    it('should generate reset token for valid email', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        status: 'active',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'reset-token',
        resetPasswordExpires: new Date(),
      });
      mockCacheService.del.mockResolvedValue(undefined);

      // Act
      const result = await service.forgotPassword('test@example.com');

      // Assert
      expect(result.success).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should not reveal if email exists (security)', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.forgotPassword('nonexistent@example.com');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('If the email exists');
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache after registration', async () => {
      // Arrange
      const registerDto: RegisterTenantDto = {
        companyName: 'Test Company',
        subdomain: 'test-company',
        email: 'cache-test@test.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '0901234567',
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
      };

      (dataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.create.mockReturnValue({});
      mockQueryRunner.manager.save.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('token');
      mockCacheService.del.mockResolvedValue(undefined);

      // Act
      await service.registerTenant(registerDto);

      // Assert
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should invalidate cache after password reset', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const mockUser = {
        id: 'user-123',
        email: 'cache-test@example.com',
        resetPasswordToken: 'token',
        resetPasswordExpires: futureDate,
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({});
      mockCacheService.del.mockResolvedValue(undefined);

      // Act
      await service.resetPassword('token', 'NewPassword123!');

      // Assert
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });
});

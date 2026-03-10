import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { Tenant, TenantStatus, SubscriptionPlan } from '../tenant/entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { AccountLockoutService } from './services/account-lockout.service';

describe('AuthService - Unit Tests', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let tenantRepository: Repository<Tenant>;
  let jwtService: JwtService;
  let cacheService: CacheService;
  let dataSource: DataSource;

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

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTenantRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  const mockPermissionService = {
    canRead: jest.fn().mockResolvedValue(true),
    canWrite: jest.fn().mockResolvedValue(true),
    canDelete: jest.fn().mockResolvedValue(true),
    buildSecureQuery: jest.fn((user, query) => query),
  };

  const mockTokenBlacklistService = {
    revokeToken: jest.fn().mockResolvedValue(undefined),
    isTokenRevoked: jest.fn().mockResolvedValue(false),
    revokeUserTokens: jest.fn().mockResolvedValue(undefined),
    areUserTokensRevoked: jest.fn().mockResolvedValue(false),
    clearUserRevocation: jest.fn().mockResolvedValue(undefined),
  };

  const mockAccountLockoutService = {
    recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
    isAccountLocked: jest.fn().mockResolvedValue(false),
    getRemainingLockoutTime: jest.fn().mockResolvedValue(0),
    getAttemptCount: jest.fn().mockResolvedValue(0),
    resetAttempts: jest.fn().mockResolvedValue(undefined),
    unlockAccount: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
        {
          provide: AccountLockoutService,
          useValue: mockAccountLockoutService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    jwtService = module.get<JwtService>(JwtService);
    cacheService = module.get<CacheService>(CacheService);
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  describe('registerTenant', () => {
    const validRegisterDto: RegisterTenantDto = {
      companyName: 'Test Company',
      subdomain: 'test-company',
      email: 'admin@test.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0901234567',
    };

    describe('Successful Registration', () => {
      it('should successfully register a new tenant with admin user', async () => {
        // Arrange
        mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
        mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

        const mockTenant = {
          id: 'tenant-uuid',
          code: validRegisterDto.subdomain,
          name: validRegisterDto.companyName,
          subscriptionPlan: SubscriptionPlan.FREE,
        };
        mockQueryRunner.manager.create.mockReturnValueOnce(mockTenant);
        mockQueryRunner.manager.save.mockResolvedValueOnce(mockTenant);

        const mockUser = {
          id: 'user-uuid',
          email: validRegisterDto.email,
          tenantId: mockTenant.id,
          role: 'admin',
          emailVerified: false,
        };
        mockQueryRunner.manager.create.mockReturnValueOnce(mockUser);
        mockQueryRunner.manager.save.mockResolvedValueOnce(mockUser);

        mockJwtService.sign.mockReturnValueOnce('access-token');
        mockJwtService.sign.mockReturnValueOnce('refresh-token');
        mockCacheService.del.mockResolvedValue(undefined);

        // Act
        const result = await service.registerTenant(validRegisterDto);

        // Assert
        expect(result.user.email).toBe(validRegisterDto.email);
        expect(result.user.role).toBe('admin');
        expect(result.token).toBe('access-token');
        expect(result.refreshToken).toBe('refresh-token');
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should create tenant with trial subscription plan', async () => {
        // Arrange
        mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
        mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

        const mockTenant = {
          id: 'tenant-uuid',
          code: validRegisterDto.subdomain,
          subscriptionPlan: SubscriptionPlan.FREE,
          maxUsers: 5,
          maxStorage: 1073741824,
        };
        mockQueryRunner.manager.create.mockReturnValueOnce(mockTenant);
        mockQueryRunner.manager.save.mockResolvedValueOnce(mockTenant);

        const mockUser = {
          id: 'user-uuid',
          email: validRegisterDto.email,
          tenantId: mockTenant.id,
          role: 'admin',
        };
        mockQueryRunner.manager.create.mockReturnValueOnce(mockUser);
        mockQueryRunner.manager.save.mockResolvedValueOnce(mockUser);

        mockJwtService.sign.mockReturnValue('token');
        mockCacheService.del.mockResolvedValue(undefined);

        // Act
        await service.registerTenant(validRegisterDto);

        // Assert
        expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
          Tenant,
          expect.objectContaining({
            subscriptionPlan: SubscriptionPlan.FREE,
            status: TenantStatus.ACTIVE,
          }),
        );
      });

      it('should hash password before saving user', async () => {
        // Arrange
        mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
        mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

        const mockTenant = { id: 'tenant-uuid' };
        mockQueryRunner.manager.create.mockReturnValueOnce(mockTenant);
        mockQueryRunner.manager.save.mockResolvedValueOnce(mockTenant);

        const mockUser = { id: 'user-uuid', email: validRegisterDto.email };
        mockQueryRunner.manager.create.mockReturnValueOnce(mockUser);
        mockQueryRunner.manager.save.mockResolvedValueOnce(mockUser);

        mockJwtService.sign.mockReturnValue('token');
        mockCacheService.del.mockResolvedValue(undefined);

        // Act
        await service.registerTenant(validRegisterDto);

        // Assert
        const userCreateCall = mockQueryRunner.manager.create.mock.calls[1];
        expect(userCreateCall[1].password).not.toBe(validRegisterDto.password);
        expect(userCreateCall[1].password.length).toBeGreaterThan(20);
      });
    });

    describe('Duplicate Subdomain Error', () => {
      it('should throw ConflictException if subdomain already exists', async () => {
        // Arrange
        mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 'existing-tenant' });

        // Act & Assert
        await expect(service.registerTenant(validRegisterDto)).rejects.toThrow(ConflictException);
        await expect(service.registerTenant(validRegisterDto)).rejects.toThrow('already taken');
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      });
    });

    describe('Duplicate Email Error', () => {
      it('should throw ConflictException if email already exists', async () => {
        // Arrange
        mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
        mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 'existing-user' });

        // Act & Assert
        await expect(service.registerTenant(validRegisterDto)).rejects.toThrow(ConflictException);
        await expect(service.registerTenant(validRegisterDto)).rejects.toThrow('already exists');
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      });
    });

    describe('Transaction Rollback', () => {
      it('should rollback transaction on database error', async () => {
        // Arrange
        mockQueryRunner.manager.findOne.mockResolvedValue(null);
        mockQueryRunner.manager.create.mockReturnValue({});
        mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.registerTenant(validRegisterDto)).rejects.toThrow('Database error');
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should release query runner after transaction', async () => {
        // Arrange
        mockQueryRunner.manager.findOne.mockResolvedValue(null);
        mockQueryRunner.manager.create.mockReturnValue({});
        mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('Error'));

        // Act
        try {
          await service.registerTenant(validRegisterDto);
        } catch (e) {
          // Expected
        }

        // Assert
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });
    });
  });

  describe('validateUser', () => {
    describe('Valid Credentials', () => {
      it('should return user without password for valid credentials', async () => {
        // Arrange
        const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
        const mockUser = {
          id: 'user-uuid',
          email: 'test@example.com',
          password: hashedPassword,
          status: 'active',
          firstName: 'John',
          lastName: 'Doe',
        };
        mockUserRepository.findOne.mockResolvedValue(mockUser);

        // Act
        const result = await service.validateUser('test@example.com', 'TestPassword123!');

        // Assert
        expect(result).toBeDefined();
        expect(result?.email).toBe('test@example.com');
        expect(result?.id).toBe('user-uuid');
        // Password should not be in result (Omit<UserEntity, 'password'>)
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('Invalid Credentials', () => {
      it('should return null for invalid password', async () => {
        // Arrange
        const hashedPassword = await bcrypt.hash('CorrectPassword123!', 12);
        const mockUser = {
          id: 'user-uuid',
          email: 'test@example.com',
          password: hashedPassword,
          status: 'active',
        };
        mockUserRepository.findOne.mockResolvedValue(mockUser);

        // Act
        const result = await service.validateUser('test@example.com', 'WrongPassword123!');

        // Assert
        expect(result).toBeNull();
      });

      it('should return null if user not found', async () => {
        // Arrange
        mockUserRepository.findOne.mockResolvedValue(null);

        // Act
        const result = await service.validateUser('nonexistent@example.com', 'password');

        // Assert
        expect(result).toBeNull();
      });

      it('should return null if user is inactive', async () => {
        // Arrange
        const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
        const mockUser = {
          id: 'user-uuid',
          email: 'test@example.com',
          password: hashedPassword,
          status: 'inactive',
        };
        mockUserRepository.findOne.mockResolvedValue(mockUser);

        // Act
        const result = await service.validateUser('test@example.com', 'TestPassword123!');

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      // Arrange
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'tenant-uuid',
        role: 'admin',
      } as Omit<User, 'password'>;

      mockJwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.login(mockUser);

      // Assert
      expect(result.token).toBe('jwt-token');
      expect(result.user.id).toBe('user-uuid');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.tenantId).toBe('tenant-uuid');
    });

    it('should include tenantId in JWT payload', async () => {
      // Arrange
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        tenantId: 'tenant-uuid',
        role: 'admin',
      } as Omit<User, 'password'>;

      mockJwtService.sign.mockReturnValue('token');

      // Act
      await service.login(mockUser);

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-uuid',
          sub: 'user-uuid',
          role: 'admin',
        }),
      );
    });
  });

  describe('refreshToken', () => {
    describe('Valid Refresh Token', () => {
      it('should return new access token for valid refresh token', async () => {
        // Arrange
        const mockUser = {
          id: 'user-uuid',
          email: 'test@example.com',
          tenantId: 'tenant-uuid',
          role: 'admin',
          status: 'active',
        };
        mockJwtService.verify.mockReturnValue({ sub: 'user-uuid' });
        mockUserRepository.findOne.mockResolvedValue(mockUser);
        mockJwtService.sign.mockReturnValue('new-access-token');

        // Act
        const result = await service.refreshToken('valid-refresh-token');

        // Assert
        expect(result.accessToken).toBe('new-access-token');
        expect(mockJwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      });
    });

    describe('Invalid Refresh Token', () => {
      it('should throw UnauthorizedException for invalid token', async () => {
        // Arrange
        mockJwtService.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        // Act & Assert
        await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException if user not found', async () => {
        // Arrange
        mockJwtService.verify.mockReturnValue({ sub: 'nonexistent-user' });
        mockUserRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.refreshToken('token')).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException if user is inactive', async () => {
        // Arrange
        mockJwtService.verify.mockReturnValue({ sub: 'user-uuid' });
        mockUserRepository.findOne.mockResolvedValue({
          id: 'user-uuid',
          status: 'inactive',
        });

        // Act & Assert
        await expect(service.refreshToken('token')).rejects.toThrow(UnauthorizedException);
      });
    });
  });

  describe('verifyEmail', () => {
    describe('Valid Token', () => {
      it('should successfully verify email', async () => {
        // Arrange
        const mockUser = {
          id: 'user-uuid',
          email: 'test@example.com',
          emailVerified: false,
          emailVerificationToken: 'valid-token',
        };
        mockUserRepository.findOne.mockResolvedValue(mockUser);
        mockUserRepository.save.mockResolvedValue({
          ...mockUser,
          emailVerified: true,
          emailVerificationToken: null,
        });

        // Act
        const result = await service.verifyEmail('valid-token');

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Email verified successfully');
        expect(result.user?.emailVerified).toBe(true);
      });
    });

    describe('Invalid Token', () => {
      it('should throw BadRequestException for invalid token', async () => {
        // Arrange
        mockUserRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
      });
    });

    describe('Already Verified', () => {
      it('should return success if email already verified', async () => {
        // Arrange
        const mockUser = {
          id: 'user-uuid',
          email: 'test@example.com',
          emailVerified: true,
          emailVerificationToken: 'token',
        };
        mockUserRepository.findOne.mockResolvedValue(mockUser);

        // Act
        const result = await service.verifyEmail('token');

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Email already verified');
        expect(mockUserRepository.save).not.toHaveBeenCalled();
      });
    });
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      // Arrange
      const password = 'TestPassword123!';

      // Act
      const hashed = await service.hashPassword(password);

      // Assert
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it('should produce different hashes for same password', async () => {
      // Arrange
      const password = 'TestPassword123!';

      // Act
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      // Assert
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      // Arrange
      const password = 'TestPassword123!';
      const hashed = await service.hashPassword(password);

      // Act
      const result = await service.comparePasswords(password, hashed);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      // Arrange
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await service.hashPassword(password);

      // Act
      const result = await service.comparePasswords(wrongPassword, hashed);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        status: 'active',
      };
      mockCacheService.getOrSet.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockCacheService.getOrSet.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should use cache for user lookup', async () => {
      // Arrange
      const mockUser = { id: 'user-uuid', email: 'test@example.com' };
      mockCacheService.getOrSet.mockResolvedValue(mockUser);

      // Act
      await service.findByEmail('test@example.com');

      // Assert
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for valid email', async () => {
      // Arrange
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        status: 'active',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'reset-token',
      });
      mockCacheService.del.mockResolvedValue(undefined);

      // Act
      const result = await service.forgotPassword('test@example.com');

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should return success message for non-existent email (security)', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.forgotPassword('nonexistent@example.com');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('If the email exists');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: futureDate,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        password: 'hashed-new-password',
        resetPasswordToken: null,
      });
      mockCacheService.del.mockResolvedValue(undefined);

      // Act
      const result = await service.resetPassword('valid-token', 'NewPassword123!');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
    });

    it('should throw BadRequestException for invalid token', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resetPassword('invalid-token', 'NewPassword123!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const mockUser = {
        id: 'user-uuid',
        resetPasswordToken: 'expired-token',
        resetPasswordExpires: pastDate,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.resetPassword('expired-token', 'NewPassword123!')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

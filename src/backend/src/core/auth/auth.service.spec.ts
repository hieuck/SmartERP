/**
 * AuthService Unit Tests
 * Coverage target: >90%
 * 
 * Test cases:
 * 1. validateUser - Happy path, account lockout, inactive tenant, wrong password
 * 2. login - Generate JWT with tenantId
 * 3. register - Create user, duplicate email
 * 4. refreshToken - Valid token, expired token, revoked token
 * 5. registerTenant - Create tenant + admin, duplicate subdomain
 * 6. verifyEmail - Valid token, invalid token, already verified
 * 7. forgotPassword - Existing email, non-existing email, timing attack prevention
 * 8. resetPassword - Valid token, expired token, weak password, tenant mismatch
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { CacheService } from '@common/cache/cache.service';
import { PermissionService } from '@common/security/permission.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { TenantStatus } from '../tenant/enums/tenant-status.enum';
import { SubscriptionPlan } from '../tenant/enums/subscription-plan.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;
  let jwtService: jest.Mocked<JwtService>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;
  let accountLockoutService: jest.Mocked<AccountLockoutService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    tenantId: 'tenant-123',
    role: 'admin',
    status: 'active',
    emailVerified: true,
    tenant: {
      id: 'tenant-123',
      status: TenantStatus.ACTIVE,
    },
  } as User;

  const mockTenant = {
    id: 'tenant-123',
    code: 'testcompany',
    name: 'Test Company',
    status: TenantStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
  } as Tenant;

  beforeEach(async () => {
    // Create mock repositories
    const mockUserRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockTenantRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getOrSet: jest.fn(),
    };

    const mockPermissionService = {
      checkPermission: jest.fn(),
    };

    const mockTokenBlacklistService = {
      isTokenRevoked: jest.fn(),
      revokeUserTokens: jest.fn(),
    };

    const mockAccountLockoutService = {
      isAccountLocked: jest.fn(),
      recordFailedAttempt: jest.fn(),
      resetAttempts: jest.fn(),
      getRemainingLockoutTime: jest.fn(),
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

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
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
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    tenantRepository = module.get(getRepositoryToken(Tenant));
    jwtService = module.get(JwtService);
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
    tokenBlacklistService = module.get(TokenBlacklistService);
    accountLockoutService = module.get(AccountLockoutService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      // Arrange
      accountLockoutService.isAccountLocked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      accountLockoutService.resetAttempts.mockResolvedValue(undefined);

      // Act
      const result = await service.validateUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('password');
      expect(accountLockoutService.isAccountLocked).toHaveBeenCalledWith('test@example.com');
      expect(accountLockoutService.resetAttempts).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when account is locked', async () => {
      // Arrange
      accountLockoutService.isAccountLocked.mockResolvedValue(true);
      accountLockoutService.getRemainingLockoutTime.mockResolvedValue(300);

      // Act
      const result = await service.validateUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null and record failed attempt when user not found', async () => {
      // Arrange
      accountLockoutService.isAccountLocked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('nonexistent@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
      expect(accountLockoutService.recordFailedAttempt).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });

    it('should return null when tenant is inactive', async () => {
      // Arrange
      const inactiveUser = {
        ...mockUser,
        tenant: { ...mockUser.tenant, status: TenantStatus.SUSPENDED },
      };
      accountLockoutService.isAccountLocked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(inactiveUser as User);

      // Act
      const result = await service.validateUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
      expect(accountLockoutService.recordFailedAttempt).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null and record failed attempt when password is wrong', async () => {
      // Arrange
      accountLockoutService.isAccountLocked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act
      const result = await service.validateUser('test@example.com', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
      expect(accountLockoutService.recordFailedAttempt).toHaveBeenCalledWith('test@example.com');
    });

    it('should sanitize email (trim and lowercase)', async () => {
      // Arrange
      accountLockoutService.isAccountLocked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      // Act
      await service.validateUser('  TEST@EXAMPLE.COM  ', 'password123');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', status: 'active' },
        relations: ['tenant'],
      });
    });
  });

  describe('login', () => {
    it('should generate JWT token with tenantId and return user info', async () => {
      // Arrange
      const { password, ...userWithoutPassword } = mockUser;
      jwtService.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await service.login(userWithoutPassword);

      // Assert
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          tenantId: mockUser.tenantId,
          role: mockUser.role,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        userId: mockUser.id,
        tenantId: mockUser.tenantId,
        role: mockUser.role,
      });
    });
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      // Arrange
      const password = 'password123';
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      // Act
      const result = await service.hashPassword(password);

      // Assert
      expect(result).toBe('hashed-password');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'salt');
    });
  });

  describe('comparePasswords', () => {
    it('should return true when passwords match', async () => {
      // Arrange
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      // Act
      const result = await service.comparePasswords('password123', 'hashed-password');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      // Arrange
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act
      const result = await service.comparePasswords('wrongpassword', 'hashed-password');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should generate new access token when refresh token is valid', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: mockUser.id,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
      jwtService.verify.mockReturnValue(payload);
      tokenBlacklistService.isTokenRevoked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-access-token');

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(tokenBlacklistService.isTokenRevoked).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      // Arrange
      const refreshToken = 'expired-refresh-token';
      const payload = {
        sub: mockUser.id,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      jwtService.verify.mockReturnValue(payload);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'Refresh token has expired',
      );
    });

    it('should throw UnauthorizedException when token is revoked', async () => {
      // Arrange
      const refreshToken = 'revoked-refresh-token';
      const payload = {
        sub: mockUser.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      jwtService.verify.mockReturnValue(payload);
      tokenBlacklistService.isTokenRevoked.mockResolvedValue(true);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'Refresh token has been revoked',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: 'non-existent-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      jwtService.verify.mockReturnValue(payload);
      tokenBlacklistService.isTokenRevoked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow('User not found');
    });

    it('should throw UnauthorizedException when tenant is inactive', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: mockUser.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const inactiveUser = {
        ...mockUser,
        tenant: { ...mockUser.tenant, status: TenantStatus.SUSPENDED },
      };
      jwtService.verify.mockReturnValue(payload);
      tokenBlacklistService.isTokenRevoked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(inactiveUser as User);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'Tenant is no longer active',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user from cache if available', async () => {
      // Arrange
      cacheService.getOrSet.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should return null when user not found', async () => {
      // Arrange
      cacheService.getOrSet.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      // Arrange
      const unverifiedUser = {
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: 'valid-token',
      };
      userRepository.findOne.mockResolvedValue(unverifiedUser as User);
      userRepository.save.mockResolvedValue({ ...unverifiedUser, emailVerified: true } as User);

      // Act
      const result = await service.verifyEmail('valid-token');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(result.user?.emailVerified).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when token is invalid', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });

    it('should return success when email already verified', async () => {
      // Arrange
      const verifiedUser = {
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: 'valid-token',
      };
      userRepository.findOne.mockResolvedValue(verifiedUser as User);

      // Act
      const result = await service.verifyEmail('valid-token');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email already verified');
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      cacheService.del.mockResolvedValue(undefined);

      // Act
      const result = await service.forgotPassword('test@example.com');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a password reset link has been sent');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should return generic message for non-existing user (prevent enumeration)', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.forgotPassword('nonexistent@example.com');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a password reset link has been sent');
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should take constant time regardless of email existence (timing attack prevention)', async () => {
      // Arrange
      const CONSTANT_TIME_MS = 500;
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const startTime = Date.now();
      await service.forgotPassword('nonexistent@example.com');
      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(elapsedTime).toBeGreaterThanOrEqual(CONSTANT_TIME_MS);
    });

    it('should sanitize email (trim and lowercase)', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      await service.forgotPassword('  TEST@EXAMPLE.COM  ');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', status: 'active' },
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      // Arrange
      const resetUser = {
        ...mockUser,
        resetPasswordToken: 'valid-reset-token-123456789012345678901234',
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour from now
      };
      userRepository.findOne.mockResolvedValue(resetUser as User);
      userRepository.save.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-password' as never);
      cacheService.del.mockResolvedValue(undefined);
      tokenBlacklistService.revokeUserTokens.mockResolvedValue(undefined);

      // Act
      const result = await service.resetPassword(
        'valid-reset-token-123456789012345678901234',
        'NewPassword123',
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
      expect(userRepository.save).toHaveBeenCalled();
      expect(tokenBlacklistService.revokeUserTokens).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw BadRequestException when token format is invalid', async () => {
      // Act & Assert
      await expect(service.resetPassword('short', 'NewPassword123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword('short', 'NewPassword123')).rejects.toThrow(
        'Invalid reset token format',
      );
    });

    it('should throw BadRequestException when password is weak', async () => {
      // Arrange
      const validToken = 'valid-reset-token-123456789012345678901234';

      // Act & Assert
      await expect(service.resetPassword(validToken, 'weak')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(validToken, 'weak')).rejects.toThrow(
        'Password must be at least 8 characters',
      );
    });

    it('should throw BadRequestException when password lacks uppercase', async () => {
      // Arrange
      const validToken = 'valid-reset-token-123456789012345678901234';

      // Act & Assert
      await expect(service.resetPassword(validToken, 'password123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(validToken, 'password123')).rejects.toThrow(
        'Password must contain uppercase, lowercase, and numeric characters',
      );
    });

    it('should throw BadRequestException when token is invalid', async () => {
      // Arrange
      const validToken = 'valid-reset-token-123456789012345678901234';
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resetPassword(validToken, 'NewPassword123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(validToken, 'NewPassword123')).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw BadRequestException when token is expired', async () => {
      // Arrange
      const validToken = 'valid-reset-token-123456789012345678901234';
      const resetUser = {
        ...mockUser,
        resetPasswordToken: validToken,
        resetPasswordExpires: new Date(Date.now() - 3600000), // 1 hour ago
      };
      userRepository.findOne.mockResolvedValue(resetUser as User);

      // Act & Assert
      await expect(service.resetPassword(validToken, 'NewPassword123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(validToken, 'NewPassword123')).rejects.toThrow(
        'Reset token has expired',
      );
    });

    it('should throw UnauthorizedException when tenant mismatch', async () => {
      // Arrange
      const validToken = 'valid-reset-token-123456789012345678901234';
      const resetUser = {
        ...mockUser,
        resetPasswordToken: validToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
      };
      userRepository.findOne.mockResolvedValue(resetUser as User);

      // Act & Assert
      await expect(
        service.resetPassword(validToken, 'NewPassword123', 'different-tenant-id'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.resetPassword(validToken, 'NewPassword123', 'different-tenant-id'),
      ).rejects.toThrow('Tenant mismatch');
    });

    it('should throw UnauthorizedException when tenant is inactive', async () => {
      // Arrange
      const validToken = 'valid-reset-token-123456789012345678901234';
      const resetUser = {
        ...mockUser,
        resetPasswordToken: validToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
        tenant: { ...mockUser.tenant, status: TenantStatus.SUSPENDED },
      };
      userRepository.findOne.mockResolvedValue(resetUser as User);

      // Act & Assert
      await expect(service.resetPassword(validToken, 'NewPassword123')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resetPassword(validToken, 'NewPassword123')).rejects.toThrow(
        'Tenant is no longer active',
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode valid JWT token', () => {
      // Arrange
      const token = 'valid-jwt-token';
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        tenantId: mockUser.tenantId,
      };
      jwtService.decode.mockReturnValue(payload);

      // Act
      const result = service.decodeToken(token);

      // Assert
      expect(result).toEqual(payload);
    });

    it('should return null when token is invalid', () => {
      // Arrange
      const token = 'invalid-jwt-token';
      jwtService.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = service.decodeToken(token);

      // Assert
      expect(result).toBeNull();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { CacheService } from '@common/cache/cache.service';
import { PermissionService } from '@common/security/permission.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { TenantStatus } from '../tenant/enums/tenant-status.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let tenantRepository: any;
  let jwtService: any;
  let cacheService: any;
  let tokenBlacklistService: any;
  let accountLockoutService: any;

  beforeEach(async () => {
    jest.clearAllMocks(); // Clear all mocks before each test
    
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockTenantRepository = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn() },
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: {},
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
    userRepository = module.get(getRepositoryToken(User));
    tenantRepository = module.get(getRepositoryToken(Tenant));
    jwtService = module.get(JwtService);
    cacheService = module.get(CacheService);
    tokenBlacklistService = module.get(TokenBlacklistService);
    accountLockoutService = module.get(AccountLockoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: '$2b$12$hashedpassword',
        tenantId: 'tenant1',
        tenant: { id: 'tenant1', status: TenantStatus.ACTIVE },
        status: 'active',
      };

      (accountLockoutService.isAccountLocked as jest.Mock).mockResolvedValue(false);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare instead of non-existent comparePasswords method
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('password');
      expect(accountLockoutService.resetAttempts).toHaveBeenCalled();
    });

    it('should return null when account is locked', async () => {
      (accountLockoutService.isAccountLocked as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null and record failed attempt when user not found', async () => {
      (accountLockoutService.isAccountLocked as jest.Mock).mockResolvedValue(false);
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
      expect(accountLockoutService.recordFailedAttempt).toHaveBeenCalled();
    });

    it('should return null when tenant is inactive', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: '$2b$12$hashedpassword',
        tenant: { status: TenantStatus.SUSPENDED },
      };

      (accountLockoutService.isAccountLocked as jest.Mock).mockResolvedValue(false);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const mockUser: any = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'tenant1',
        role: 'user',
        roles: ['user'],
        status: 'active',
        emailVerified: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        syncStatus: 'synced',
      };

      (jwtService.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await service.login(mockUser);

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.tenantId).toBe('tenant1');
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when refresh token is valid', async () => {
      const mockPayload = {
        sub: '1',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        tenantId: 'tenant1',
        role: 'user',
        status: 'active',
        tenant: { status: TenantStatus.ACTIVE },
      };

      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      (tokenBlacklistService.isTokenRevoked as jest.Mock).mockResolvedValue(false);
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when token is revoked', async () => {
      const mockPayload = {
        sub: '1',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      (tokenBlacklistService.isTokenRevoked as jest.Mock).mockResolvedValue(true);

      await expect(service.refreshToken('revoked-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'Password123';
      const hashed = await service.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(50);
    });
  });

  describe('comparePasswords', () => {
    beforeEach(() => {
      // Reset bcrypt mock from validateUser tests
      jest.restoreAllMocks();
    });

    it('should return true when passwords match', async () => {
      const password = 'Password123';
      const hashed = await service.hashPassword(password);

      const result = await service.comparePasswords(password, hashed);

      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      const password = 'Password123';
      const wrongPassword = 'WrongPassword456';
      const hashed = await service.hashPassword(password);

      const result = await service.comparePasswords(wrongPassword, hashed);

      expect(result).toBe(false);
    });
  });

  describe('decodeToken', () => {
    it('should decode valid token', () => {
      const mockPayload = { sub: '1', email: 'test@example.com' };
      (jwtService.decode as jest.Mock).mockReturnValue(mockPayload);

      const result = service.decodeToken('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', () => {
      (jwtService.decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.decodeToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user from cache if available', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        status: 'active',
      };

      (cacheService.getOrSet as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from database if not in cache', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        status: 'active',
      };

      (cacheService.getOrSet as jest.Mock).mockImplementation(async (key, fn) => {
        return fn();
      });
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        status: 'active',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If the email exists');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should return generic message for non-existent email', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If the email exists');
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should use constant-time response to prevent timing attacks', async () => {
      const startTime = Date.now();
      
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await service.forgotPassword('test@example.com');

      const elapsedTime = Date.now() - startTime;
      
      // Should take at least 500ms (constant time)
      expect(elapsedTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        emailVerified: false,
        emailVerificationToken: 'valid-token',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: null,
      });

      const result = await service.verifyEmail('valid-token');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(result.user.emailVerified).toBe(true);
    });

    it('should return message if email already verified', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        emailVerified: true,
        emailVerificationToken: 'valid-token',
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.verifyEmail('valid-token');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email already verified');
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });
  });

  describe('registerTenant', () => {
    let mockQueryRunner: any;

    beforeEach(() => {
      mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
      };

      const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      };

      (service as any).dataSource = mockDataSource;
    });

    it('should register tenant with admin user successfully', async () => {
      const registerData = {
        email: 'admin@newcompany.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        subdomain: 'newcompany',
        companyName: 'New Company Inc',
      };

      // Mock no existing tenant
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // Tenant check
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // User check

      // Mock tenant creation
      mockQueryRunner.manager.create.mockImplementationOnce((entity, data) => ({
        ...data,
        id: 'tenant-1',
      }));
      mockQueryRunner.manager.save.mockResolvedValueOnce({
        id: 'tenant-1',
        code: registerData.subdomain,
        name: registerData.companyName,
      });

      // Mock user creation
      mockQueryRunner.manager.create.mockImplementationOnce((entity, data) => ({
        ...data,
        id: 'user-1',
      }));
      mockQueryRunner.manager.save.mockResolvedValueOnce({
        id: 'user-1',
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        tenantId: 'tenant-1',
        role: 'admin',
      });

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.registerTenant(registerData);

      expect(result.token).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.role).toBe('admin');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw error when subdomain already exists', async () => {
      const registerData = {
        email: 'admin@newcompany.com',
        password: 'Password123!',
        subdomain: 'existing',
        companyName: 'New Company',
      };

      // Mock existing tenant
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        id: 'existing-tenant',
        code: registerData.subdomain,
      });

      await expect(service.registerTenant(registerData)).rejects.toThrow(
        `Subdomain "${registerData.subdomain}" is already taken`,
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw error when email already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123!',
        subdomain: 'newcompany',
        companyName: 'New Company',
      };

      // Mock no existing tenant
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      // Mock existing user
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({
        id: 'existing-user',
        email: registerData.email,
      });

      await expect(service.registerTenant(registerData)).rejects.toThrow(
        'User with this email already exists',
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const registerData = {
        email: 'admin@newcompany.com',
        password: 'Password123!',
        subdomain: 'newcompany',
        companyName: 'New Company',
      };

      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);
      mockQueryRunner.manager.create.mockImplementationOnce(() => ({
        id: 'tenant-1',
      }));

      // Simulate error during save
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.registerTenant(registerData)).rejects.toThrow('Database error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should create tenant with trial subscription', async () => {
      const registerData = {
        email: 'admin@newcompany.com',
        password: 'Password123!',
        subdomain: 'newcompany',
        companyName: 'New Company',
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      let createdTenant: any;
      mockQueryRunner.manager.create.mockImplementationOnce((entity, data) => {
        createdTenant = data;
        return { ...data, id: 'tenant-1' };
      });

      mockQueryRunner.manager.save.mockResolvedValueOnce({
        id: 'tenant-1',
        ...createdTenant,
      });

      mockQueryRunner.manager.create.mockImplementationOnce((entity, data) => ({
        ...data,
        id: 'user-1',
      }));

      mockQueryRunner.manager.save.mockResolvedValueOnce({
        id: 'user-1',
        email: registerData.email,
        tenantId: 'tenant-1',
        role: 'admin',
      });

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      await service.registerTenant(registerData);

      expect(createdTenant.subscriptionPlan).toBe('free');
      expect(createdTenant.status).toBe('active');
      expect(createdTenant.maxUsers).toBe(5);
      expect(createdTenant.maxStorage).toBe(1073741824); // 1GB
    });

    it('should hash password and generate email verification token', async () => {
      const registerData = {
        email: 'admin@newcompany.com',
        password: 'PlainPassword123!',
        subdomain: 'newcompany',
        companyName: 'New Company',
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      mockQueryRunner.manager.create.mockImplementationOnce((entity, data) => ({
        ...data,
        id: 'tenant-1',
      }));

      mockQueryRunner.manager.save.mockResolvedValueOnce({
        id: 'tenant-1',
      });

      let createdUser: any;
      mockQueryRunner.manager.create.mockImplementationOnce((entity, data) => {
        createdUser = data;
        return { ...data, id: 'user-1' };
      });

      mockQueryRunner.manager.save.mockResolvedValueOnce({
        id: 'user-1',
        ...createdUser,
      });

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      await service.registerTenant(registerData);

      expect(createdUser.password).toBeDefined();
      expect(createdUser.password).not.toBe(registerData.password);
      expect(createdUser.password.length).toBeGreaterThan(50);
      expect(createdUser.emailVerificationToken).toBeDefined();
      expect(createdUser.emailVerified).toBe(false);
      expect(createdUser.role).toBe('admin');
    });
  });

  describe('register', () => {
    const mockCurrentUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      tenantId: 'tenant1',
      role: 'admin',
    } as any;

    it('should register new user successfully', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'tenant1',
      };

      // Mock SecureRepository methods
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null), // No existing user
        save: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          tenantId: registerData.tenantId,
          role: 'user',
        }),
      };

      // Replace secureUserRepo with mock
      (service as any).secureUserRepo = mockSecureRepo;

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register(registerData, mockCurrentUser);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.role).toBe('user');
      expect(mockSecureRepo.findOne).toHaveBeenCalled();
      expect(mockSecureRepo.save).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw error when user already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123!',
        tenantId: 'tenant1',
      };

      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue({
          id: 'existing-user',
          email: registerData.email,
        }),
      };

      (service as any).secureUserRepo = mockSecureRepo;

      await expect(service.register(registerData, mockCurrentUser)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should hash password before saving', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'PlainPassword123!',
        tenantId: 'tenant1',
      };

      let savedPassword: string | undefined;

      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockImplementation((user, data) => {
          savedPassword = data.password;
          return Promise.resolve({
            id: 'user-1',
            email: data.email,
            password: data.password,
            tenantId: data.tenantId,
            role: 'user',
          });
        }),
      };

      (service as any).secureUserRepo = mockSecureRepo;

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      await service.register(registerData, mockCurrentUser);

      expect(savedPassword).toBeDefined();
      expect(savedPassword).not.toBe(registerData.password);
      expect(savedPassword!.length).toBeGreaterThan(50); // Bcrypt hash length
    });

    it('should generate JWT tokens with correct payload', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'tenant1',
      };

      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          tenantId: registerData.tenantId,
          role: 'user',
        }),
      };

      (service as any).secureUserRepo = mockSecureRepo;

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      await service.register(registerData, mockCurrentUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerData.email,
          sub: 'user-1',
          userId: 'user-1',
          tenantId: registerData.tenantId,
          role: 'user',
        }),
        { expiresIn: '15m' },
      );

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1' },
        { expiresIn: '7d' },
      );
    });

    it('should invalidate email cache after registration', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        tenantId: 'tenant1',
      };

      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: registerData.email,
          tenantId: registerData.tenantId,
          role: 'user',
        }),
      };

      (service as any).secureUserRepo = mockSecureRepo;

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      await service.register(registerData, mockCurrentUser);

      expect(cacheService.del).toHaveBeenCalledWith(
        expect.stringContaining(registerData.email),
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const validToken = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // 36 chars UUID format
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        tenantId: 'tenant1',
        resetPasswordToken: validToken,
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour from now
        tenant: { status: TenantStatus.ACTIVE },
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);
      (tokenBlacklistService.revokeUserTokens as jest.Mock).mockResolvedValue(undefined);

      const result = await service.resetPassword(validToken, 'NewPassword123!');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
      expect(userRepository.save).toHaveBeenCalled();
      expect(tokenBlacklistService.revokeUserTokens).toHaveBeenCalledWith('1');
    });

    it('should throw error for invalid token format', async () => {
      await expect(service.resetPassword('short', 'NewPassword123!')).rejects.toThrow(
        'Invalid reset token format',
      );
    });

    it('should throw error for weak password', async () => {
      const validToken = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockUser = {
        id: '1',
        resetPasswordToken: validToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
        tenant: { status: TenantStatus.ACTIVE },
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.resetPassword(validToken, 'weak')).rejects.toThrow(
        'Password must be at least 8 characters',
      );
    });

    it('should throw error for expired token', async () => {
      const validToken = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockUser = {
        id: '1',
        resetPasswordToken: validToken,
        resetPasswordExpires: new Date(Date.now() - 3600000), // 1 hour ago
        tenant: { status: TenantStatus.ACTIVE },
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.resetPassword(validToken, 'NewPassword123!')).rejects.toThrow(
        'Reset token has expired',
      );
    });

    it('should throw error for tenant mismatch', async () => {
      const validToken = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockUser = {
        id: '1',
        tenantId: 'tenant1',
        resetPasswordToken: validToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
        tenant: { status: TenantStatus.ACTIVE },
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.resetPassword(validToken, 'NewPassword123!', 'tenant2')).rejects.toThrow(
        'Tenant mismatch',
      );
    });

    it('should throw error for inactive tenant', async () => {
      const validToken = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockUser = {
        id: '1',
        tenantId: 'tenant1',
        resetPasswordToken: validToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
        tenant: { status: TenantStatus.SUSPENDED },
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.resetPassword(validToken, 'NewPassword123!')).rejects.toThrow(
        'Tenant is no longer active',
      );
    });
  });
});

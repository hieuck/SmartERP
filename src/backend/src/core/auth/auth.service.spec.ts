import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
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
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: 'DataSource',
          useValue: { createQueryRunner: jest.fn() },
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

      accountLockoutService.isAccountLocked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(service as any, 'comparePasswords').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('password');
      expect(accountLockoutService.resetAttempts).toHaveBeenCalled();
    });

    it('should return null when account is locked', async () => {
      accountLockoutService.isAccountLocked.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null and record failed attempt when user not found', async () => {
      accountLockoutService.isAccountLocked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(null);

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

      accountLockoutService.isAccountLocked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const mockUser = {
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
        syncStatus: 'synced' as const,
      };

      jwtService.sign.mockReturnValue('mock-jwt-token');

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

      jwtService.verify.mockReturnValue(mockPayload);
      tokenBlacklistService.isTokenRevoked.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when token is revoked', async () => {
      const mockPayload = {
        sub: '1',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jwtService.verify.mockReturnValue(mockPayload);
      tokenBlacklistService.isTokenRevoked.mockResolvedValue(true);

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
});

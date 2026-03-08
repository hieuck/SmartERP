import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';

describe('AuthService', () => {
  let service: AuthService;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

    it('should successfully register a new tenant with admin user', async () => {
      // Mock: No existing tenant or user
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // No tenant
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // No user

      // Mock: Create tenant
      const mockTenant = {
        id: 'tenant-uuid',
        code: validRegisterDto.subdomain,
        name: validRegisterDto.companyName,
        subscriptionPlan: 'free',
      };
      mockQueryRunner.manager.create.mockReturnValueOnce(mockTenant);
      mockQueryRunner.manager.save.mockResolvedValueOnce(mockTenant);

      // Mock: Create user
      const mockUser = {
        id: 'user-uuid',
        email: validRegisterDto.email,
        tenantId: mockTenant.id,
        role: 'admin',
        emailVerified: false,
      };
      mockQueryRunner.manager.create.mockReturnValueOnce(mockUser);
      mockQueryRunner.manager.save.mockResolvedValueOnce(mockUser);

      // Mock: JWT tokens
      mockJwtService.sign.mockReturnValueOnce('access-token');
      mockJwtService.sign.mockReturnValueOnce('refresh-token');

      // Mock: Cache invalidation
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.registerTenant(validRegisterDto);

      expect(result.success).toBe(true);
      expect(result.data.tenant.subdomain).toBe(validRegisterDto.subdomain);
      expect(result.data.user.email).toBe(validRegisterDto.email);
      expect(result.data.user.role).toBe('admin');
      expect(result.data.accessToken).toBe('access-token');
      expect(result.data.refreshToken).toBe('refresh-token');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw ConflictException if subdomain already exists', async () => {
      // Mock: Existing tenant
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 'existing-tenant' });

      try {
        await service.registerTenant(validRegisterDto);
        fail('Should have thrown ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toContain('already taken');
      }

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock: No tenant, but existing user
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // No tenant
      mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 'existing-user' }); // Existing user

      try {
        await service.registerTenant(validRegisterDto);
        fail('Should have thrown ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toContain('already exists');
      }

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Mock: No existing tenant or user
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      // Mock: Error during save
      mockQueryRunner.manager.create.mockReturnValue({});
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.registerTenant(validRegisterDto)).rejects.toThrow('Database error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
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

      const result = await service.verifyEmail('valid-token');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(result.user.emailVerified).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });

    it('should return success if email already verified', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        emailVerified: true,
        emailVerificationToken: 'token',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.verifyEmail('token');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email already verified');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'TestPassword123!';
      const hashed = await service.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'TestPassword123!';
      const hashed = await service.hashPassword(password);

      const result = await service.comparePasswords(password, hashed);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await service.hashPassword(password);

      const result = await service.comparePasswords(wrongPassword, hashed);
      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'tenant-uuid',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Omit<User, 'password'>;

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(mockUser);

      expect(result.token).toBe('jwt-token');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.tenantId).toBe(mockUser.tenantId);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockUser.email,
          sub: mockUser.id,
          userId: mockUser.id,
          tenantId: mockUser.tenantId,
          role: mockUser.role,
        }),
      );
    });
  });
});

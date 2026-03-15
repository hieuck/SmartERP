import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { TenantStatus } from '@/core/tenant/enums/tenant-status.enum';
import { User as UserEntity } from '../user/entities/user.entity';
import { TenantService } from './tenant.service';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { createMockTenant } from '@/test/factories/tenant.factory';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let cacheService: jest.Mocked<CacheService>;
  let _permissionService: jest.Mocked<PermissionService>;
  let secureTenantRepo: jest.Mocked<SecureRepository<Tenant>>;

  const mockCurrentUser: User = {
    id: 'current-user-id',
    tenantId: 'test-tenant-id',
    roles: ['admin'],
  };

  beforeEach(async () => {
    const mockTenantRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    const mockUserRepository = {
      find: jest.fn(),
      count: jest.fn(),
    };

    const mockCacheService = {
      getOrSet: jest.fn(),
      del: jest.fn(),
    };

    const mockPermissionService = {
      hasPermission: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
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

    service = module.get<TenantService>(TenantService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
    userRepository = module.get(getRepositoryToken(UserEntity));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);

    // Mock SecureRepository methods
    secureTenantRepo = (service as any).secureTenantRepo;
    secureTenantRepo.findOne = jest.fn();
    secureTenantRepo.save = jest.fn();
    secureTenantRepo.remove = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create tenant successfully with provided code', async () => {
      const createDto: CreateTenantDto = {
        code: 'TEST-001',
        name: 'Test Company',
        companyName: 'Test Company Ltd',
      };

      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(createDto as any);
      tenantRepository.save.mockResolvedValue({ id: 'tenant-1', ...createDto } as any);

      const result = await service.create(createDto, 'user-123');

      expect(result.code).toBe('TEST-001');
      expect(tenantRepository.findOne).toHaveBeenCalledWith({ where: { code: 'TEST-001' } });
      expect(tenantRepository.save).toHaveBeenCalled();
    });

    it('should generate code if not provided', async () => {
      const createDto: CreateTenantDto = {
        name: 'Test Company',
        companyName: 'Test Company Ltd',
      };

      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(createDto as any);
      tenantRepository.save.mockResolvedValue({ id: 'tenant-1', ...createDto } as any);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(tenantRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.stringMatching(/^TNT-\d+-[A-Z0-9]{8}$/),
        }),
      );
    });

    it('should throw ConflictException when code already exists', async () => {
      const createDto: CreateTenantDto = {
        code: 'EXISTING-001',
        name: 'Test Company',
        companyName: 'Test Company Ltd',
      };

      tenantRepository.findOne.mockResolvedValue({ id: 'existing-tenant' } as any);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Tenant with code EXISTING-001 already exists',
      );
    });

    it('should set createdBy and updatedBy to system when userId not provided', async () => {
      const createDto: CreateTenantDto = {
        code: 'TEST-001',
        name: 'Test Company',
        companyName: 'Test Company Ltd',
      };

      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(createDto as any);
      tenantRepository.save.mockResolvedValue({ id: 'tenant-1', ...createDto } as any);

      await service.create(createDto);

      expect(tenantRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: 'system',
          updatedBy: 'system',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      const mockTenants = [
        createMockTenant({ id: 'tenant-1' }),
        createMockTenant({ id: 'tenant-2' }),
      ];

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTenants),
      };
      tenantRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('tenant.createdAt', 'DESC');
    });

    it('should return empty array when no tenants exist', async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      tenantRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return tenant from cache if available', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id' });
      cacheService.getOrSet.mockResolvedValue(mockTenant);

      const result = await service.findOne(mockCurrentUser);

      expect(result).toEqual(mockTenant);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('test-tenant-id'),
        expect.any(Function),
        expect.any(Number),
      );
    });

    it('should fetch from database when cache miss', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        return await fn();
      });
      secureTenantRepo.findOne.mockResolvedValue(mockTenant);

      const result = await service.findOne(mockCurrentUser);

      expect(result).toEqual(mockTenant);
      expect(secureTenantRepo.findOne).toHaveBeenCalledWith(mockCurrentUser, {
        where: { id: 'test-tenant-id' },
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        return await fn();
      });
      secureTenantRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockCurrentUser)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockCurrentUser)).rejects.toThrow(
        'Tenant with ID test-tenant-id not found',
      );
    });
  });

  describe('findByCode', () => {
    it('should return tenant by code from cache', async () => {
      const mockTenant = createMockTenant({ code: 'TEST-001' });
      cacheService.getOrSet.mockResolvedValue(mockTenant);

      const result = await service.findByCode('TEST-001');

      expect(result).toEqual(mockTenant);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('TEST-001'),
        expect.any(Function),
        expect.any(Number),
      );
    });

    it('should fetch from database when cache miss', async () => {
      const mockTenant = createMockTenant({ code: 'TEST-001' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        return await fn();
      });
      tenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.findByCode('TEST-001');

      expect(result).toEqual(mockTenant);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({ where: { code: 'TEST-001' } });
    });

    it('should throw NotFoundException when tenant code not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        return await fn();
      });
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('NON-EXISTENT')).rejects.toThrow(NotFoundException);
      await expect(service.findByCode('NON-EXISTENT')).rejects.toThrow(
        'Tenant with code NON-EXISTENT not found',
      );
    });
  });

  describe('update', () => {
    it('should update tenant successfully', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id', code: 'OLD-CODE' });
      const updateDto: UpdateTenantDto = {
        name: 'Updated Company',
      };

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      secureTenantRepo.save.mockResolvedValue({ ...mockTenant, ...updateDto });

      const result = await service.update(mockCurrentUser, updateDto);

      expect(result.name).toBe('Updated Company');
      expect(secureTenantRepo.save).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should check for code conflicts when updating code', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id', code: 'OLD-CODE' });
      const updateDto: UpdateTenantDto = {
        code: 'NEW-CODE',
      };

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      tenantRepository.findOne.mockResolvedValue(null);
      secureTenantRepo.save.mockResolvedValue({ ...mockTenant, ...updateDto });

      await service.update(mockCurrentUser, updateDto);

      expect(tenantRepository.findOne).toHaveBeenCalledWith({ where: { code: 'NEW-CODE' } });
    });

    it('should throw ConflictException when new code already exists', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id', code: 'OLD-CODE' });
      const updateDto: UpdateTenantDto = {
        code: 'EXISTING-CODE',
      };

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      tenantRepository.findOne.mockResolvedValue({ id: 'other-tenant' } as any);

      await expect(service.update(mockCurrentUser, updateDto)).rejects.toThrow(ConflictException);
      await expect(service.update(mockCurrentUser, updateDto)).rejects.toThrow(
        'Tenant with code EXISTING-CODE already exists',
      );
    });

    it('should invalidate cache after update', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id', code: 'TEST-CODE' });
      const updateDto: UpdateTenantDto = {
        name: 'Updated Company',
      };

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      secureTenantRepo.save.mockResolvedValue({ ...mockTenant, ...updateDto });

      await service.update(mockCurrentUser, updateDto);

      expect(cacheService.del).toHaveBeenCalledWith(expect.stringContaining('test-tenant-id'));
      expect(cacheService.del).toHaveBeenCalledWith(expect.stringContaining('TEST-CODE'));
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException when tenant has users', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id' });

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(5);

      await expect(service.remove(mockCurrentUser)).rejects.toThrow(BadRequestException);
      await expect(service.remove(mockCurrentUser)).rejects.toThrow(
        'Cannot delete tenant with 5 users',
      );
    });

    it('should remove tenant when no users exist', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id' });

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(0);
      secureTenantRepo.remove.mockResolvedValue(undefined);

      await service.remove(mockCurrentUser);

      expect(secureTenantRepo.remove).toHaveBeenCalledWith(mockCurrentUser, mockTenant);
    });
  });

  describe('suspend', () => {
    it('should suspend tenant successfully', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id', status: TenantStatus.ACTIVE });

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      secureTenantRepo.save.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.SUSPENDED,
      });

      const result = await service.suspend(mockCurrentUser);

      expect(result.status).toBe(TenantStatus.SUSPENDED);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('should activate tenant successfully', async () => {
      const mockTenant = createMockTenant({
        id: 'test-tenant-id',
        status: TenantStatus.SUSPENDED,
      });

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      secureTenantRepo.save.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.ACTIVE,
      });

      const result = await service.activate(mockCurrentUser);

      expect(result.status).toBe(TenantStatus.ACTIVE);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel tenant successfully', async () => {
      const mockTenant = createMockTenant({ id: 'test-tenant-id', status: TenantStatus.ACTIVE });

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      secureTenantRepo.save.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.CANCELLED,
      });

      const result = await service.cancel(mockCurrentUser);

      expect(result.status).toBe(TenantStatus.CANCELLED);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('getUsersByTenant', () => {
    it('should return users for tenant', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      tenantRepository.findOne.mockResolvedValue({ id: 'tenant-1' } as any);
      userRepository.find.mockResolvedValue(mockUsers as any);

      const result = await service.getUsersByTenant('tenant-1');

      expect(result).toHaveLength(2);
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        select: expect.any(Array),
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getUsersByTenant('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsageReport', () => {
    it('should return usage report with correct calculations', async () => {
      const mockTenant = createMockTenant({
        id: 'test-tenant-id',
        maxUsers: 10,
        maxStorage: 1000,
        currentStorage: 500,
      });

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(5);

      const result = await service.getUsageReport(mockCurrentUser);

      expect(result.users.current).toBe(5);
      expect(result.users.max).toBe(10);
      expect(result.users.percentage).toBe(50);
      expect(result.storage.current).toBe(500);
      expect(result.storage.max).toBe(1000);
      expect(result.storage.percentage).toBe(50);
    });

    it('should handle zero max values', async () => {
      const mockTenant = createMockTenant({
        id: 'test-tenant-id',
        maxUsers: 0,
        maxStorage: 0,
      });

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(0);

      const result = await service.getUsageReport(mockCurrentUser);

      expect(result.users.percentage).toBe(0);
      expect(result.storage.percentage).toBe(0);
    });
  });

  describe('count', () => {
    it('should return tenant count', async () => {
      tenantRepository.count.mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
    });
  });

  describe('findByStatus', () => {
    it('should return tenants by status', async () => {
      const mockTenants = [
        createMockTenant({ status: TenantStatus.ACTIVE }),
        createMockTenant({ status: TenantStatus.ACTIVE }),
      ];

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTenants),
      };
      tenantRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findByStatus(TenantStatus.ACTIVE);

      expect(result).toHaveLength(2);
      expect(queryBuilder.where).toHaveBeenCalledWith('tenant.status = :status', {
        status: TenantStatus.ACTIVE,
      });
    });
  });

  describe('updateStorage', () => {
    it('should update storage successfully', async () => {
      const mockTenant = createMockTenant({
        id: 'test-tenant-id',
        maxStorage: 1000,
        currentStorage: 500,
      });

      cacheService.getOrSet.mockResolvedValue(mockTenant);
      secureTenantRepo.save.mockResolvedValue({ ...mockTenant, currentStorage: 750 });

      const result = await service.updateStorage(mockCurrentUser, 750);

      expect(result.currentStorage).toBe(750);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when storage limit exceeded', async () => {
      const mockTenant = createMockTenant({
        id: 'test-tenant-id',
        maxStorage: 1000,
      });

      cacheService.getOrSet.mockResolvedValue(mockTenant);

      await expect(service.updateStorage(mockCurrentUser, 1500)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateStorage(mockCurrentUser, 1500)).rejects.toThrow(
        'Storage limit exceeded',
      );
    });
  });
});

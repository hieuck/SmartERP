import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { CacheService } from '@/common/cache/cache.service';

describe('TenantService', () => {
  let service: TenantService;

  const mockTenant: Partial<Tenant> = {
    id: 'tenant-uuid',
    code: 'TNT-001',
    name: 'Test Tenant',
    status: TenantStatus.ACTIVE,
    maxUsers: 10,
    maxStorage: 1073741824,
    currentStorage: 0,
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockTenantRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockUserRepository = {
    find: jest.fn(),
    count: jest.fn(),
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
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createDto = {
        name: 'New Tenant',
        code: 'TNT-002',
        companyName: 'New Company',
      };

      mockTenantRepository.findOne.mockResolvedValue(null);
      mockTenantRepository.create.mockReturnValue(mockTenant as Tenant);
      mockTenantRepository.save.mockResolvedValue(mockTenant as Tenant);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTenant);
      expect(mockTenantRepository.findOne).toHaveBeenCalledWith({
        where: { code: createDto.code },
      });
      expect(mockTenantRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if code already exists', async () => {
      const createDto = {
        name: 'New Tenant',
        code: 'TNT-001',
        companyName: 'New Company',
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return tenant from cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);

      const result = await service.findOne('tenant-uuid');

      expect(result).toEqual(mockTenant);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tenant not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (_key, factory) => {
        return factory();
      });
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return tenant by code from cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);

      const result = await service.findByCode('TNT-001');

      expect(result).toEqual(mockTenant);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tenant not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (_key, factory) => {
        return factory();
      });
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update tenant and invalidate cache', async () => {
      const updateDto = { name: 'Updated Tenant' };

      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        ...updateDto,
      } as Tenant);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('tenant-uuid', updateDto);

      expect(result.name).toBe('Updated Tenant');
      expect(mockCacheService.del).toHaveBeenCalledTimes(2); // ID and code keys
    });

    it('should throw ConflictException if new code already exists', async () => {
      const updateDto = { code: 'TNT-002' };

      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);
      mockTenantRepository.findOne.mockResolvedValue({ id: 'other-tenant' } as Tenant);

      await expect(service.update('tenant-uuid', updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete tenant when no users exist', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);
      mockUserRepository.count.mockResolvedValue(0);
      mockTenantRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove('tenant-uuid');

      expect(mockTenantRepository.softDelete).toHaveBeenCalledWith('tenant-uuid');
    });

    it('should throw BadRequestException if tenant has users', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);
      mockUserRepository.count.mockResolvedValue(5);

      await expect(service.remove('tenant-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('suspend', () => {
    it('should suspend tenant and invalidate cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.SUSPENDED,
      } as Tenant);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.suspend('tenant-uuid');

      expect(result.status).toBe(TenantStatus.SUSPENDED);
      expect(mockCacheService.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('activate', () => {
    it('should activate tenant and invalidate cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.SUSPENDED,
      } as Tenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.ACTIVE,
      } as Tenant);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.activate('tenant-uuid');

      expect(result.status).toBe(TenantStatus.ACTIVE);
      expect(mockCacheService.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancel', () => {
    it('should cancel tenant and invalidate cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.CANCELLED,
      } as Tenant);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.cancel('tenant-uuid');

      expect(result.status).toBe(TenantStatus.CANCELLED);
      expect(mockCacheService.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUsersByTenant', () => {
    it('should return users for tenant', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@test.com', tenantId: 'tenant-uuid' },
        { id: 'user-2', email: 'user2@test.com', tenantId: 'tenant-uuid' },
      ];

      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);
      mockUserRepository.find.mockResolvedValue(mockUsers as User[]);

      const result = await service.getUsersByTenant('tenant-uuid');

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-uuid' },
        select: expect.any(Array),
      });
    });
  });

  describe('getUsageReport', () => {
    it('should return usage report', async () => {
      const freshMockTenant = {
        id: 'tenant-uuid',
        code: 'TNT-001',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        maxUsers: 10,
        maxStorage: 1073741824,
        currentStorage: 0,
      };

      mockCacheService.getOrSet.mockResolvedValue(freshMockTenant as Tenant);
      mockUserRepository.count.mockResolvedValue(5);

      const result = await service.getUsageReport('tenant-uuid');

      expect(result).toMatchObject({
        tenantId: 'tenant-uuid',
        tenantName: 'Test Tenant',
        tenantCode: 'TNT-001',
        users: {
          current: 5,
          max: 10,
          percentage: 50,
        },
      });
    });
  });

  describe('updateStorage', () => {
    it('should update storage and invalidate cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        currentStorage: 500000000,
      } as Tenant);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateStorage('tenant-uuid', 500000000);

      expect(result.currentStorage).toBe(500000000);
      expect(mockCacheService.del).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if storage limit exceeded', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockTenant as Tenant);

      await expect(service.updateStorage('tenant-uuid', 2000000000)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      const mockTenants = [mockTenant, { ...mockTenant, id: 'tenant-2' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockTenants as Tenant[]);

      const result = await service.findAll();

      expect(result).toEqual(mockTenants);
      expect(mockTenantRepository.createQueryBuilder).toHaveBeenCalledWith('tenant');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'tenant.id',
        'tenant.code',
        'tenant.name',
        'tenant.companyName',
        'tenant.status',
        'tenant.maxUsers',
        'tenant.maxStorage',
        'tenant.currentStorage',
        'tenant.subscriptionPlan',
        'tenant.subscriptionEndDate',
        'tenant.createdAt',
      ]);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('tenant.createdAt', 'DESC');
    });
  });

  describe('count', () => {
    it('should return tenant count', async () => {
      mockTenantRepository.count.mockResolvedValue(10);

      const result = await service.count();

      expect(result).toBe(10);
    });
  });

  describe('findByStatus', () => {
    it('should return tenants by status', async () => {
      const mockTenants = [mockTenant];
      mockQueryBuilder.getMany.mockResolvedValue(mockTenants as Tenant[]);

      const result = await service.findByStatus(TenantStatus.ACTIVE);

      expect(result).toEqual(mockTenants);
      expect(mockTenantRepository.createQueryBuilder).toHaveBeenCalledWith('tenant');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'tenant.id',
        'tenant.code',
        'tenant.name',
        'tenant.companyName',
        'tenant.status',
        'tenant.maxUsers',
        'tenant.currentStorage',
        'tenant.subscriptionPlan',
        'tenant.createdAt',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('tenant.status = :status', {
        status: TenantStatus.ACTIVE,
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('tenant.createdAt', 'DESC');
    });
  });
});

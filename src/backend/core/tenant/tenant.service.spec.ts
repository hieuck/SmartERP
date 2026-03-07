import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { Tenant, TenantStatus, SubscriptionPlan, BillingCycle } from './entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepository: Repository<Tenant>;
  let userRepository: Repository<User>;
  let cacheService: CacheService;

  const mockTenant: Partial<Tenant> = {
    id: 'tenant-1',
    code: 'TNT-001',
    name: 'Test Tenant',
    companyName: 'Test Company',
    status: TenantStatus.ACTIVE,
    maxUsers: 10,
    maxStorage: 1000,
    currentStorage: 100,
    subscriptionPlan: SubscriptionPlan.BASIC,
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(),
    subscriptionAmount: 99,
    billingCycle: BillingCycle.MONTHLY,
    features: ['feature1', 'feature2'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockTenant]),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    cacheService = module.get<CacheService>(CacheService);
  });

  describe('create', () => {
    it('should create tenant successfully', async () => {
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(tenantRepository, 'create').mockReturnValue(mockTenant as Tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(mockTenant as Tenant);

      const result = await service.create({
        name: 'Test Tenant',
        companyName: 'Test Company',
        code: 'TNT-001',
      });

      expect(result).toEqual(mockTenant);
    });

    it('should throw ConflictException when code already exists', async () => {
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(mockTenant as Tenant);

      await expect(
        service.create({
          name: 'Test Tenant',
          companyName: 'Test Company',
          code: 'TNT-001',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return tenant from cache or database', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);

      const result = await service.findOne(mockUser);

      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (key, fn) => {
        return fn();
      });
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update tenant successfully', async () => {
      const updatedTenant = { ...mockTenant, name: 'Updated Tenant' };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(updatedTenant as Tenant);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.update(mockUser, { name: 'Updated Tenant' });

      expect(result.name).toBe('Updated Tenant');
    });

    it('should throw ConflictException when updating to existing code', async () => {
      const existingTenant = { ...mockTenant, id: 'tenant-2', code: 'TNT-002' };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(tenantRepository, 'findOne').mockResolvedValue(existingTenant as Tenant);

      await expect(service.update(mockUser, { code: 'TNT-002' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException when tenant has users', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(userRepository, 'count').mockResolvedValue(5);

      await expect(service.remove(mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should soft delete tenant when no users exist', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(userRepository, 'count').mockResolvedValue(0);
      jest.spyOn(tenantRepository, 'softDelete').mockResolvedValue(undefined);

      await service.remove(mockUser);

      expect(tenantRepository.softDelete).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('status management', () => {
    it('should suspend tenant', async () => {
      const suspendedTenant = { ...mockTenant, status: TenantStatus.SUSPENDED };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(suspendedTenant as Tenant);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.suspend(mockUser);

      expect(result.status).toBe(TenantStatus.SUSPENDED);
    });

    it('should activate tenant', async () => {
      const activeTenant = { ...mockTenant, status: TenantStatus.ACTIVE };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(activeTenant as Tenant);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.activate(mockUser);

      expect(result.status).toBe(TenantStatus.ACTIVE);
    });

    it('should cancel tenant', async () => {
      const cancelledTenant = { ...mockTenant, status: TenantStatus.CANCELLED };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(cancelledTenant as Tenant);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.cancel(mockUser);

      expect(result.status).toBe(TenantStatus.CANCELLED);
    });
  });

  describe('updateStorage', () => {
    it('should update storage successfully', async () => {
      const updatedTenant = { ...mockTenant, currentStorage: 500 };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(tenantRepository, 'save').mockResolvedValue(updatedTenant as Tenant);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.updateStorage(mockUser, 500);

      expect(result.currentStorage).toBe(500);
    });

    it('should throw BadRequestException when storage exceeds limit', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);

      await expect(service.updateStorage(mockUser, 2000)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUsageReport', () => {
    it('should return usage report', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(userRepository, 'count').mockResolvedValue(5);

      const result = await service.getUsageReport(mockUser);

      expect(result).toHaveProperty('tenantId', 'tenant-1');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('subscription');
      expect(result.users.current).toBe(5);
    });
  });
});

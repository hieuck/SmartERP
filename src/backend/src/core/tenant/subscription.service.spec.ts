import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { Tenant } from '@core/tenant/entities/tenant.entity';
import { TenantStatus } from '@core/tenant/enums/tenant-status.enum';
import { SubscriptionPlan } from '@core/tenant/enums/subscription-plan.enum';
import { BillingCycle } from '@core/tenant/enums/billing-cycle.enum';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let secureTenantRepo: SecureRepository<Tenant>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockTenantRepository = {
    find: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    metadata: {
      tableName: 'tenants',
      name: 'Tenant',
      columns: [],
      relations: [],
    },
  };

  const mockPermissionService = {
    canRead: jest.fn().mockResolvedValue(true),
    canWrite: jest.fn().mockResolvedValue(true),
    canDelete: jest.fn().mockResolvedValue(true),
    buildSecureQuery: jest.fn((user, qb) => qb),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    secureTenantRepo = (service as any).secureTenantRepo;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPricing', () => {
    it('should return pricing for all plans', () => {
      const pricing = service.getPricing();

      expect(pricing.plans).toBeDefined();
      expect(pricing.plans.length).toBe(4); // FREE, BASIC, PROFESSIONAL, ENTERPRISE
      expect(pricing.plans[0].plan).toBe(SubscriptionPlan.FREE);
      expect(pricing.plans[1].plan).toBe(SubscriptionPlan.BASIC);
      expect(pricing.plans[2].plan).toBe(SubscriptionPlan.PROFESSIONAL);
      expect(pricing.plans[3].plan).toBe(SubscriptionPlan.ENTERPRISE);
    });

    it('should include savings calculation for yearly plans', () => {
      const pricing = service.getPricing();
      const professionalPlan = pricing.plans.find((p) => p.plan === SubscriptionPlan.PROFESSIONAL);

      expect(professionalPlan.savings).toBeGreaterThan(0);
      expect(professionalPlan.savings).toBeLessThanOrEqual(100);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription details for a tenant', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-123',
        name: 'Test Company',
        code: 'test-company',
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.MONTHLY,
        subscriptionStartDate: new Date('2026-01-01'),
        subscriptionEndDate: new Date('2026-02-01'),
        status: TenantStatus.ACTIVE,
        maxUsers: 20,
        maxStorage: 53687091200,
        currentStorage: 1073741824,
        features: ['basic', 'reports', 'api'],
      };

      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(mockTenant as Tenant);

      const result = await service.getSubscription(mockUser);

      expect(result.tenant.id).toBe('tenant-123');
      expect(result.subscription.plan).toBe(SubscriptionPlan.PROFESSIONAL);
      expect(result.subscription.amount).toBe(990000);
      expect(result.usage.storage.percentage).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getSubscription(mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('upgradeSubscription', () => {
    const upgradeDto: UpgradeSubscriptionDto = {
      plan: SubscriptionPlan.PROFESSIONAL,
      billingCycle: BillingCycle.YEARLY,
    };

    it('should successfully upgrade subscription', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-123',
        subscriptionPlan: SubscriptionPlan.BASIC,
        billingCycle: BillingCycle.MONTHLY,
        status: TenantStatus.ACTIVE,
      };

      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(secureTenantRepo, 'save').mockResolvedValue({
        ...mockTenant,
        subscriptionPlan: upgradeDto.plan,
        billingCycle: upgradeDto.billingCycle,
      } as Tenant);

      const result = await service.upgradeSubscription(mockUser, upgradeDto);

      expect(result.success).toBe(true);
      expect(result.subscription.plan).toBe(SubscriptionPlan.PROFESSIONAL);
      expect(result.subscription.billingCycle).toBe(BillingCycle.YEARLY);
      expect(result.subscription.amount).toBe(9900000);
      expect(secureTenantRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(null);

      await expect(service.upgradeSubscription(mockUser, upgradeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if already on same plan', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-123',
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.YEARLY,
      };

      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(mockTenant as Tenant);

      await expect(service.upgradeSubscription(mockUser, upgradeDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update subscription dates correctly for monthly billing', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-123',
        subscriptionPlan: SubscriptionPlan.FREE,
        billingCycle: BillingCycle.MONTHLY,
      };

      const monthlyDto: UpgradeSubscriptionDto = {
        plan: SubscriptionPlan.BASIC,
        billingCycle: BillingCycle.MONTHLY,
      };

      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(mockTenant as Tenant);
      jest
        .spyOn(secureTenantRepo, 'save')
        .mockImplementation((user, tenant) => Promise.resolve(tenant as Tenant));

      await service.upgradeSubscription(mockUser, monthlyDto);

      const savedTenant = (secureTenantRepo.save as jest.Mock).mock.calls[0][1];
      const startDate = new Date(savedTenant.subscriptionStartDate);
      const endDate = new Date(savedTenant.subscriptionEndDate);

      const monthDiff =
        endDate.getMonth() -
        startDate.getMonth() +
        12 * (endDate.getFullYear() - startDate.getFullYear());

      expect(monthDiff).toBe(1);
    });

    it('should update subscription dates correctly for yearly billing', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-123',
        subscriptionPlan: SubscriptionPlan.FREE,
        billingCycle: BillingCycle.MONTHLY,
      };

      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(mockTenant as Tenant);
      jest
        .spyOn(secureTenantRepo, 'save')
        .mockImplementation((user, tenant) => Promise.resolve(tenant as Tenant));

      await service.upgradeSubscription(mockUser, upgradeDto);

      const savedTenant = (secureTenantRepo.save as jest.Mock).mock.calls[0][1];
      const startDate = new Date(savedTenant.subscriptionStartDate);
      const endDate = new Date(savedTenant.subscriptionEndDate);

      const yearDiff = endDate.getFullYear() - startDate.getFullYear();

      expect(yearDiff).toBe(1);
    });
  });

  describe('cancelSubscription', () => {
    it('should successfully cancel subscription and downgrade to free', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-123',
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.MONTHLY,
      };

      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(secureTenantRepo, 'save').mockResolvedValue({
        ...mockTenant,
        subscriptionPlan: SubscriptionPlan.FREE,
      } as Tenant);

      const result = await service.cancelSubscription(mockUser);

      expect(result.success).toBe(true);
      expect(result.subscription.plan).toBe(SubscriptionPlan.FREE);
      expect(secureTenantRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(null);

      await expect(service.cancelSubscription(mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already on free plan', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-123',
        subscriptionPlan: SubscriptionPlan.FREE,
      };

      jest.spyOn(secureTenantRepo, 'findOne').mockResolvedValue(mockTenant as Tenant);

      await expect(service.cancelSubscription(mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkExpiredSubscriptions', () => {
    it('should suspend expired tenants', async () => {
      const expiredTenant: Partial<Tenant> = {
        id: 'tenant-123',
        code: 'expired-tenant',
        subscriptionEndDate: new Date('2026-01-01'),
        status: TenantStatus.ACTIVE,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([expiredTenant]),
      };

      mockTenantRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockTenantRepository.save.mockResolvedValue({
        ...expiredTenant,
        status: TenantStatus.SUSPENDED,
      });

      const result = await service.checkExpiredSubscriptions();

      expect(result.checked).toBe(1);
      expect(result.suspended).toContain('expired-tenant');
      expect(mockTenantRepository.save).toHaveBeenCalled();
    });

    it('should return zero if no expired subscriptions', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockTenantRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.checkExpiredSubscriptions();

      expect(result.checked).toBe(0);
      expect(result.suspended).toEqual([]);
    });
  });

  describe('getSubscriptionHistory', () => {
    it('should return placeholder for subscription history', async () => {
      const result = await service.getSubscriptionHistory(mockUser);

      expect(result.tenantId).toBe('tenant-123');
      expect(result.history).toEqual([]);
      expect(result.message).toContain('to be implemented');
    });
  });
});

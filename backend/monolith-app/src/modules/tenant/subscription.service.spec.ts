import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Tenant, SubscriptionPlan, BillingCycle, TenantStatus } from './entities/tenant.entity';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  const mockTenantRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);

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
        id: 'tenant-uuid',
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

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.getSubscription('tenant-uuid');

      expect(result.tenant.id).toBe('tenant-uuid');
      expect(result.subscription.plan).toBe(SubscriptionPlan.PROFESSIONAL);
      expect(result.subscription.amount).toBe(990000);
      expect(result.usage.storage.percentage).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getSubscription('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upgradeSubscription', () => {
    const upgradeDto: UpgradeSubscriptionDto = {
      plan: SubscriptionPlan.PROFESSIONAL,
      billingCycle: BillingCycle.YEARLY,
    };

    it('should successfully upgrade subscription', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        subscriptionPlan: SubscriptionPlan.BASIC,
        billingCycle: BillingCycle.MONTHLY,
        status: TenantStatus.ACTIVE,
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        subscriptionPlan: upgradeDto.plan,
        billingCycle: upgradeDto.billingCycle,
      });

      const result = await service.upgradeSubscription('tenant-uuid', upgradeDto);

      expect(result.success).toBe(true);
      expect(result.subscription.plan).toBe(SubscriptionPlan.PROFESSIONAL);
      expect(result.subscription.billingCycle).toBe(BillingCycle.YEARLY);
      expect(result.subscription.amount).toBe(9900000);
      expect(mockTenantRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.upgradeSubscription('invalid-id', upgradeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if already on same plan', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.YEARLY,
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);

      await expect(service.upgradeSubscription('tenant-uuid', upgradeDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update subscription dates correctly for monthly billing', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        subscriptionPlan: SubscriptionPlan.FREE,
        billingCycle: BillingCycle.MONTHLY,
      };

      const monthlyDto: UpgradeSubscriptionDto = {
        plan: SubscriptionPlan.BASIC,
        billingCycle: BillingCycle.MONTHLY,
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.save.mockImplementation((tenant) => Promise.resolve(tenant));

      await service.upgradeSubscription('tenant-uuid', monthlyDto);

      const savedTenant = mockTenantRepository.save.mock.calls[0][0];
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
        id: 'tenant-uuid',
        subscriptionPlan: SubscriptionPlan.FREE,
        billingCycle: BillingCycle.MONTHLY,
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.save.mockImplementation((tenant) => Promise.resolve(tenant));

      await service.upgradeSubscription('tenant-uuid', upgradeDto);

      const savedTenant = mockTenantRepository.save.mock.calls[0][0];
      const startDate = new Date(savedTenant.subscriptionStartDate);
      const endDate = new Date(savedTenant.subscriptionEndDate);

      const yearDiff = endDate.getFullYear() - startDate.getFullYear();

      expect(yearDiff).toBe(1);
    });
  });

  describe('cancelSubscription', () => {
    it('should successfully cancel subscription and downgrade to free', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.MONTHLY,
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        subscriptionPlan: SubscriptionPlan.FREE,
      });

      const result = await service.cancelSubscription('tenant-uuid');

      expect(result.success).toBe(true);
      expect(result.subscription.plan).toBe(SubscriptionPlan.FREE);
      expect(mockTenantRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelSubscription('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already on free plan', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        subscriptionPlan: SubscriptionPlan.FREE,
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);

      await expect(service.cancelSubscription('tenant-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkExpiredSubscriptions', () => {
    it('should suspend expired tenants', async () => {
      const expiredTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
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
      const result = await service.getSubscriptionHistory('tenant-uuid');

      expect(result.tenantId).toBe('tenant-uuid');
      expect(result.history).toEqual([]);
      expect(result.message).toContain('to be implemented');
    });
  });
});

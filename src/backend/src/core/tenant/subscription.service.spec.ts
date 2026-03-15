import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionService } from './subscription.service';
import { Tenant } from './entities/tenant.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { SubscriptionPlan } from './enums/subscription-plan.enum';
import { BillingCycle } from './enums/billing-cycle.enum';
import { TenantStatus } from './enums/tenant-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockTenant = {
    id: 'tenant-123',
    subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
    billingCycle: BillingCycle.YEARLY,
    subscriptionAmount: 9900000,
    subscriptionStartDate: new Date('2024-01-01'),
    subscriptionEndDate: new Date('2024-12-31'),
    maxUsers: 20,
    maxStorage: 53687091200,
    currentStorage: 5368709120,
    status: TenantStatus.ACTIVE,
    name: 'Test Company',
    code: 'testcompany',
    features: ['basic', 'reports'],
  } as Tenant;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            checkPermission: jest.fn(),
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, where) => where),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPricing', () => {
    it('should return pricing for all plans', () => {
      const pricing = service.getPricing();
      expect(pricing.plans).toHaveLength(4);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription details', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      const result = await service.getSubscription(mockUser);
      expect(result.tenant.id).toBe('tenant-123');
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      await expect(service.getSubscription(mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade successfully', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      const result = await service.upgradeSubscription(mockUser, {
        plan: SubscriptionPlan.ENTERPRISE,
        billingCycle: BillingCycle.MONTHLY,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel successfully', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      const result = await service.cancelSubscription(mockUser);
      expect(result.success).toBe(true);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { SubscriptionService } from './subscription.service';
import { OnboardingService } from './onboarding.service';
import { TenantStatus } from './entities/tenant.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('TenantController (Unit)', () => {
  let controller: TenantController;
  let tenantService: TenantService;
  let subscriptionService: SubscriptionService;
  let onboardingService: OnboardingService;

  const mockTenantService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByStatus: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    findByCode: jest.fn(),
    getUsersByTenant: jest.fn(),
    getUsageReport: jest.fn(),
    update: jest.fn(),
    suspend: jest.fn(),
    activate: jest.fn(),
    cancel: jest.fn(),
    updateStorage: jest.fn(),
    remove: jest.fn(),
  };

  const mockSubscriptionService = {
    getPricing: jest.fn(),
    getSubscription: jest.fn(),
    upgradeSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    getSubscriptionHistory: jest.fn(),
  };

  const mockOnboardingService = {
    getOnboardingStatus: jest.fn(),
    completeOnboarding: jest.fn(),
    skipOnboarding: jest.fn(),
    inviteTeamMember: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockRequest = {
    user: { id: 'user-123' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
        {
          provide: OnboardingService,
          useValue: mockOnboardingService,
        },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    tenantService = module.get<TenantService>(TenantService);
    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    onboardingService = module.get<OnboardingService>(OnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create new tenant', async () => {
      const createDto = {
        name: 'Test Tenant',
        code: 'TEST',
        email: 'test@example.com',
      };
      const mockTenant = { id: 'tenant-1', ...createDto };
      mockTenantService.create.mockResolvedValue(mockTenant);

      const result = await controller.create(createDto as any, mockRequest as any);

      expect(result).toEqual(mockTenant);
      expect(tenantService.create).toHaveBeenCalledWith(createDto, 'user-123');
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      const mockTenants = [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
      ];
      mockTenantService.findAll.mockResolvedValue(mockTenants);

      const result = await controller.findAll();

      expect(result).toEqual(mockTenants);
      expect(tenantService.findAll).toHaveBeenCalled();
    });

    it('should filter tenants by status', async () => {
      const status = TenantStatus.ACTIVE;
      const mockTenants = [{ id: 'tenant-1', status }];
      mockTenantService.findByStatus.mockResolvedValue(mockTenants);

      const result = await controller.findAll(status);

      expect(result).toEqual(mockTenants);
      expect(tenantService.findByStatus).toHaveBeenCalledWith(status);
    });
  });

  describe('count', () => {
    it('should return tenant count', async () => {
      mockTenantService.count.mockResolvedValue(10);

      const result = await controller.count();

      expect(result).toBe(10);
      expect(tenantService.count).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return tenant by id', async () => {
      const tenantId = 'tenant-1';
      const mockTenant = { id: tenantId, name: 'Test' };
      mockTenantService.findOne.mockResolvedValue(mockTenant);

      const result = await controller.findOne(tenantId);

      expect(result).toEqual(mockTenant);
      expect(tenantService.findOne).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('findByCode', () => {
    it('should return tenant by code', async () => {
      const code = 'TEST';
      const mockTenant = { id: 'tenant-1', code };
      mockTenantService.findByCode.mockResolvedValue(mockTenant);

      const result = await controller.findByCode(code);

      expect(result).toEqual(mockTenant);
      expect(tenantService.findByCode).toHaveBeenCalledWith(code);
    });
  });

  describe('getUsersByTenant', () => {
    it('should return users by tenant', async () => {
      const tenantId = 'tenant-1';
      const mockUsers = [{ id: 'user-1', tenantId }];
      mockTenantService.getUsersByTenant.mockResolvedValue(mockUsers);

      const result = await controller.getUsersByTenant(tenantId);

      expect(result).toEqual(mockUsers);
      expect(tenantService.getUsersByTenant).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getUsageReport', () => {
    it('should return usage report', async () => {
      const tenantId = 'tenant-1';
      const mockReport = { users: 5, storage: 1000 };
      mockTenantService.getUsageReport.mockResolvedValue(mockReport);

      const result = await controller.getUsageReport(tenantId);

      expect(result).toEqual(mockReport);
      expect(tenantService.getUsageReport).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('Onboarding', () => {
    describe('getOnboardingStatus', () => {
      it('should return onboarding status', async () => {
        const tenantId = 'tenant-1';
        const mockStatus = { completed: false, step: 1 };
        mockOnboardingService.getOnboardingStatus.mockResolvedValue(mockStatus);

        const result = await controller.getOnboardingStatus(tenantId);

        expect(result).toEqual(mockStatus);
        expect(onboardingService.getOnboardingStatus).toHaveBeenCalledWith(tenantId);
      });
    });

    describe('completeOnboarding', () => {
      it('should complete onboarding', async () => {
        const tenantId = 'tenant-1';
        const dto = { step: 3 };
        const mockResult = { completed: true };
        mockOnboardingService.completeOnboarding.mockResolvedValue(mockResult);

        const result = await controller.completeOnboarding(tenantId, dto as any, mockRequest as any);

        expect(result).toEqual(mockResult);
        expect(onboardingService.completeOnboarding).toHaveBeenCalledWith(tenantId, dto, 'user-123');
      });
    });

    describe('skipOnboarding', () => {
      it('should skip onboarding', async () => {
        const tenantId = 'tenant-1';
        const mockResult = { skipped: true };
        mockOnboardingService.skipOnboarding.mockResolvedValue(mockResult);

        const result = await controller.skipOnboarding(tenantId, mockRequest as any);

        expect(result).toEqual(mockResult);
        expect(onboardingService.skipOnboarding).toHaveBeenCalledWith(tenantId, 'user-123');
      });
    });

    describe('inviteTeamMember', () => {
      it('should invite team member', async () => {
        const tenantId = 'tenant-1';
        const email = 'member@example.com';
        const mockResult = { invited: true };
        mockOnboardingService.inviteTeamMember.mockResolvedValue(mockResult);

        const result = await controller.inviteTeamMember(tenantId, { email }, mockRequest as any);

        expect(result).toEqual(mockResult);
        expect(onboardingService.inviteTeamMember).toHaveBeenCalledWith(tenantId, email, 'user-123');
      });
    });
  });

  describe('Subscription', () => {
    describe('getPricing', () => {
      it('should return pricing information', async () => {
        const mockPricing = [{ plan: 'basic', price: 10 }];
        mockSubscriptionService.getPricing.mockResolvedValue(mockPricing);

        const result = await controller.getPricing();

        expect(result).toEqual(mockPricing);
        expect(subscriptionService.getPricing).toHaveBeenCalled();
      });
    });

    describe('getSubscription', () => {
      it('should return subscription details', async () => {
        const tenantId = 'tenant-1';
        const mockSubscription = { plan: 'basic', status: 'active' };
        mockSubscriptionService.getSubscription.mockResolvedValue(mockSubscription);

        const result = await controller.getSubscription(tenantId);

        expect(result).toEqual(mockSubscription);
        expect(subscriptionService.getSubscription).toHaveBeenCalledWith(tenantId);
      });
    });

    describe('upgradeSubscription', () => {
      it('should upgrade subscription', async () => {
        const tenantId = 'tenant-1';
        const upgradeDto = { plan: 'premium' };
        const mockResult = { upgraded: true };
        mockSubscriptionService.upgradeSubscription.mockResolvedValue(mockResult);

        const result = await controller.upgradeSubscription(tenantId, upgradeDto as any, mockRequest as any);

        expect(result).toEqual(mockResult);
        expect(subscriptionService.upgradeSubscription).toHaveBeenCalledWith(tenantId, upgradeDto, 'user-123');
      });
    });

    describe('cancelSubscription', () => {
      it('should cancel subscription', async () => {
        const tenantId = 'tenant-1';
        const mockResult = { cancelled: true };
        mockSubscriptionService.cancelSubscription.mockResolvedValue(mockResult);

        const result = await controller.cancelSubscription(tenantId, mockRequest as any);

        expect(result).toEqual(mockResult);
        expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(tenantId, 'user-123');
      });
    });

    describe('getSubscriptionHistory', () => {
      it('should return subscription history', async () => {
        const tenantId = 'tenant-1';
        const mockHistory = [{ date: '2026-01-01', plan: 'basic' }];
        mockSubscriptionService.getSubscriptionHistory.mockResolvedValue(mockHistory);

        const result = await controller.getSubscriptionHistory(tenantId);

        expect(result).toEqual(mockHistory);
        expect(subscriptionService.getSubscriptionHistory).toHaveBeenCalledWith(tenantId);
      });
    });
  });

  describe('update', () => {
    it('should update tenant', async () => {
      const tenantId = 'tenant-1';
      const updateDto = { name: 'Updated Name' };
      const mockTenant = { id: tenantId, ...updateDto };
      mockTenantService.update.mockResolvedValue(mockTenant);

      const result = await controller.update(tenantId, updateDto as any, mockRequest as any);

      expect(result).toEqual(mockTenant);
      expect(tenantService.update).toHaveBeenCalledWith(tenantId, updateDto, 'user-123');
    });
  });

  describe('suspend', () => {
    it('should suspend tenant', async () => {
      const tenantId = 'tenant-1';
      const mockTenant = { id: tenantId, status: TenantStatus.SUSPENDED };
      mockTenantService.suspend.mockResolvedValue(mockTenant);

      const result = await controller.suspend(tenantId, mockRequest as any);

      expect(result).toEqual(mockTenant);
      expect(tenantService.suspend).toHaveBeenCalledWith(tenantId, 'user-123');
    });
  });

  describe('activate', () => {
    it('should activate tenant', async () => {
      const tenantId = 'tenant-1';
      const mockTenant = { id: tenantId, status: TenantStatus.ACTIVE };
      mockTenantService.activate.mockResolvedValue(mockTenant);

      const result = await controller.activate(tenantId, mockRequest as any);

      expect(result).toEqual(mockTenant);
      expect(tenantService.activate).toHaveBeenCalledWith(tenantId, 'user-123');
    });
  });

  describe('cancel', () => {
    it('should cancel tenant', async () => {
      const tenantId = 'tenant-1';
      const mockTenant = { id: tenantId, status: TenantStatus.CANCELLED };
      mockTenantService.cancel.mockResolvedValue(mockTenant);

      const result = await controller.cancel(tenantId, mockRequest as any);

      expect(result).toEqual(mockTenant);
      expect(tenantService.cancel).toHaveBeenCalledWith(tenantId, 'user-123');
    });
  });

  describe('updateStorage', () => {
    it('should update storage usage', async () => {
      const tenantId = 'tenant-1';
      const storageUsed = 5000;
      const mockTenant = { id: tenantId, storageUsed };
      mockTenantService.updateStorage.mockResolvedValue(mockTenant);

      const result = await controller.updateStorage(tenantId, { storageUsed });

      expect(result).toEqual(mockTenant);
      expect(tenantService.updateStorage).toHaveBeenCalledWith(tenantId, storageUsed);
    });
  });

  describe('remove', () => {
    it('should delete tenant', async () => {
      const tenantId = 'tenant-1';
      mockTenantService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(tenantId);

      expect(result).toEqual({ message: 'Tenant deleted successfully' });
      expect(tenantService.remove).toHaveBeenCalledWith(tenantId);
    });
  });
});

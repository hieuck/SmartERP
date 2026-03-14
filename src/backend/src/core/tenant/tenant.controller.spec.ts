/**
 * TenantController Integration Tests
 * Coverage target: 99%
 * 
 * Test cases:
 * 1. POST /tenants - Create tenant
 * 2. GET /tenants - Get all tenants, filter by status
 * 3. GET /tenants/count - Get tenant count
 * 4. GET /tenants/:id - Get tenant by ID
 * 5. GET /tenants/code/:code - Get tenant by code
 * 6. GET /tenants/:id/users - Get users by tenant
 * 7. GET /tenants/:id/usage - Get usage report
 * 8. GET /tenants/:id/onboarding/status - Get onboarding status
 * 9. POST /tenants/:id/onboarding/complete - Complete onboarding
 * 10. POST /tenants/:id/onboarding/skip - Skip onboarding
 * 11. POST /tenants/:id/onboarding/invite - Invite team member
 * 12. GET /tenants/subscription/pricing - Get pricing (public)
 * 13. GET /tenants/:id/subscription - Get subscription
 * 14. POST /tenants/:id/subscription/upgrade - Upgrade subscription
 * 15. POST /tenants/:id/subscription/cancel - Cancel subscription
 * 16. GET /tenants/:id/subscription/history - Get subscription history
 * 17. PUT /tenants/:id - Update tenant
 * 18. PATCH /tenants/:id/suspend - Suspend tenant
 * 19. PATCH /tenants/:id/activate - Activate tenant
 * 20. PATCH /tenants/:id/cancel - Cancel tenant
 * 21. PATCH /tenants/:id/storage - Update storage
 * 22. DELETE /tenants/:id - Delete tenant
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { SubscriptionService } from './subscription.service';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantStatus } from './enums/tenant-status.enum';
import { SubscriptionPlan } from './enums/subscription-plan.enum';

describe('TenantController (Integration)', () => {
  let app: INestApplication;
  let tenantService: jest.Mocked<TenantService>;
  let subscriptionService: jest.Mocked<SubscriptionService>;
  let onboardingService: jest.Mocked<OnboardingService>;

  const mockAuthUser = {
    id: 'user-123',
    userId: 'user-123',
    tenantId: 'tenant-123',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockTenant = {
    id: 'tenant-123',
    code: 'testcompany',
    name: 'Test Company',
    companyName: 'Test Company Ltd',
    companyPhone: '+84901234567',
    status: TenantStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    maxUsers: 50,
    maxStorage: 10737418240,
    currentStorage: 1073741824,
    features: ['basic', 'advanced'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockTenantService = {
      create: jest.fn(),
      findAll: jest.fn(),
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
      count: jest.fn(),
      findByStatus: jest.fn(),
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

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockAuthUser;
        return true;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    tenantService = moduleFixture.get(TenantService);
    subscriptionService = moduleFixture.get(SubscriptionService);
    onboardingService = moduleFixture.get(OnboardingService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /tenants', () => {
    it('should create tenant successfully', async () => {
      const createDto = {
        code: 'newcompany',
        name: 'New Company',
        companyName: 'New Company Ltd',
        companyPhone: '+84901234567',
      };

      tenantService.create.mockResolvedValue(mockTenant);

      const response = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockTenant);
      expect(tenantService.create).toHaveBeenCalledWith(createDto, 'user-123');
    });

    it('should return 409 when code already exists', async () => {
      const createDto = {
        code: 'existing',
        name: 'Existing Company',
      };

      tenantService.create.mockRejectedValue({
        status: 409,
        message: 'Tenant with code existing already exists',
      });

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });
  });

  describe('GET /tenants', () => {
    it('should return all tenants', async () => {
      const tenants = [mockTenant, { ...mockTenant, id: 'tenant-456', code: 'company2' }];
      tenantService.findAll.mockResolvedValue(tenants);

      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(tenants);
      expect(tenantService.findAll).toHaveBeenCalled();
    });

    it('should filter tenants by status', async () => {
      const activeTenants = [mockTenant];
      tenantService.findByStatus.mockResolvedValue(activeTenants);

      const response = await request(app.getHttpServer())
        .get('/tenants?status=active')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(activeTenants);
      expect(tenantService.findByStatus).toHaveBeenCalledWith(TenantStatus.ACTIVE);
    });
  });

  describe('GET /tenants/count', () => {
    it('should return tenant count', async () => {
      tenantService.count.mockResolvedValue(42);

      const response = await request(app.getHttpServer())
        .get('/tenants/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(42);
      expect(tenantService.count).toHaveBeenCalled();
    });
  });

  describe('GET /tenants/:id', () => {
    it('should return tenant by ID', async () => {
      tenantService.findOne.mockResolvedValue(mockTenant);

      const response = await request(app.getHttpServer())
        .get('/tenants/tenant-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTenant);
      expect(tenantService.findOne).toHaveBeenCalledWith(mockAuthUser);
    });

    it('should return 404 when tenant not found', async () => {
      tenantService.findOne.mockRejectedValue({
        status: 404,
        message: 'Tenant not found',
      });

      await request(app.getHttpServer())
        .get('/tenants/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /tenants/code/:code', () => {
    it('should return tenant by code', async () => {
      tenantService.findByCode.mockResolvedValue(mockTenant);

      const response = await request(app.getHttpServer())
        .get('/tenants/code/testcompany')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTenant);
      expect(tenantService.findByCode).toHaveBeenCalledWith('testcompany');
    });

    it('should return 404 when code not found', async () => {
      tenantService.findByCode.mockRejectedValue({
        status: 404,
        message: 'Tenant not found',
      });

      await request(app.getHttpServer())
        .get('/tenants/code/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /tenants/:id/users', () => {
    it('should return users by tenant', async () => {
      const users = [
        { id: 'user-1', email: 'user1@example.com', role: 'admin' },
        { id: 'user-2', email: 'user2@example.com', role: 'user' },
      ];
      tenantService.getUsersByTenant.mockResolvedValue(users);

      const response = await request(app.getHttpServer())
        .get('/tenants/tenant-123/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(users);
      expect(tenantService.getUsersByTenant).toHaveBeenCalledWith('tenant-123');
    });
  });

  describe('GET /tenants/:id/usage', () => {
    it('should return usage report', async () => {
      const usageReport = {
        tenantId: 'tenant-123',
        tenantName: 'Test Company',
        tenantCode: 'testcompany',
        users: { current: 10, max: 50, percentage: 20 },
        storage: { current: 1073741824, max: 10737418240, percentage: 10 },
        subscription: {
          plan: 'professional',
          startDate: new Date(),
          endDate: new Date(),
          amount: 99,
          billingCycle: 'monthly',
          status: TenantStatus.ACTIVE,
        },
        features: ['basic', 'advanced'],
      };
      tenantService.getUsageReport.mockResolvedValue(usageReport);

      const response = await request(app.getHttpServer())
        .get('/tenants/tenant-123/usage')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(usageReport);
      expect(tenantService.getUsageReport).toHaveBeenCalledWith(mockAuthUser);
    });
  });

  describe('Onboarding Endpoints', () => {
    describe('GET /tenants/:id/onboarding/status', () => {
      it('should return onboarding status', async () => {
        const status = {
          completed: false,
          steps: {
            profile: true,
            team: false,
            settings: false,
          },
        };
        onboardingService.getOnboardingStatus.mockResolvedValue(status);

        const response = await request(app.getHttpServer())
          .get('/tenants/tenant-123/onboarding/status')
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(response.body).toEqual(status);
        expect(onboardingService.getOnboardingStatus).toHaveBeenCalledWith(mockAuthUser);
      });
    });

    describe('POST /tenants/:id/onboarding/complete', () => {
      it('should complete onboarding', async () => {
        const completeDto = {
          steps: ['profile', 'team', 'settings'],
        };
        onboardingService.completeOnboarding.mockResolvedValue({
          success: true,
          message: 'Onboarding completed',
        });

        const response = await request(app.getHttpServer())
          .post('/tenants/tenant-123/onboarding/complete')
          .set('Authorization', 'Bearer valid-token')
          .send(completeDto)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(onboardingService.completeOnboarding).toHaveBeenCalledWith(
          mockAuthUser,
          completeDto,
        );
      });
    });

    describe('POST /tenants/:id/onboarding/skip', () => {
      it('should skip onboarding', async () => {
        onboardingService.skipOnboarding.mockResolvedValue({
          success: true,
          message: 'Onboarding skipped',
        });

        const response = await request(app.getHttpServer())
          .post('/tenants/tenant-123/onboarding/skip')
          .set('Authorization', 'Bearer valid-token')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(onboardingService.skipOnboarding).toHaveBeenCalledWith(mockAuthUser);
      });
    });

    describe('POST /tenants/:id/onboarding/invite', () => {
      it('should invite team member', async () => {
        const inviteDto = { email: 'newmember@example.com' };
        onboardingService.inviteTeamMember.mockResolvedValue({
          success: true,
          message: 'Invitation sent',
        });

        const response = await request(app.getHttpServer())
          .post('/tenants/tenant-123/onboarding/invite')
          .set('Authorization', 'Bearer valid-token')
          .send(inviteDto)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(onboardingService.inviteTeamMember).toHaveBeenCalledWith(
          mockAuthUser,
          'newmember@example.com',
        );
      });
    });
  });

  describe('Subscription Endpoints', () => {
    describe('GET /tenants/subscription/pricing', () => {
      it('should return pricing for all plans (public)', async () => {
        const pricing = [
          { plan: 'free', price: 0, features: ['basic'] },
          { plan: 'professional', price: 99, features: ['basic', 'advanced'] },
          { plan: 'enterprise', price: 299, features: ['basic', 'advanced', 'premium'] },
        ];
        subscriptionService.getPricing.mockResolvedValue(pricing);

        const response = await request(app.getHttpServer())
          .get('/tenants/subscription/pricing')
          .expect(200);

        expect(response.body).toEqual(pricing);
        expect(subscriptionService.getPricing).toHaveBeenCalled();
      });
    });

    describe('GET /tenants/:id/subscription', () => {
      it('should return current subscription', async () => {
        const subscription = {
          plan: 'professional',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(),
        };
        subscriptionService.getSubscription.mockResolvedValue(subscription);

        const response = await request(app.getHttpServer())
          .get('/tenants/tenant-123/subscription')
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(response.body).toEqual(subscription);
        expect(subscriptionService.getSubscription).toHaveBeenCalledWith(mockAuthUser);
      });
    });

    describe('POST /tenants/:id/subscription/upgrade', () => {
      it('should upgrade subscription', async () => {
        const upgradeDto = {
          plan: 'enterprise',
          billingCycle: 'yearly',
        };
        subscriptionService.upgradeSubscription.mockResolvedValue({
          success: true,
          message: 'Subscription upgraded',
        });

        const response = await request(app.getHttpServer())
          .post('/tenants/tenant-123/subscription/upgrade')
          .set('Authorization', 'Bearer valid-token')
          .send(upgradeDto)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(subscriptionService.upgradeSubscription).toHaveBeenCalledWith(
          mockAuthUser,
          upgradeDto,
        );
      });
    });

    describe('POST /tenants/:id/subscription/cancel', () => {
      it('should cancel subscription', async () => {
        subscriptionService.cancelSubscription.mockResolvedValue({
          success: true,
          message: 'Subscription cancelled',
        });

        const response = await request(app.getHttpServer())
          .post('/tenants/tenant-123/subscription/cancel')
          .set('Authorization', 'Bearer valid-token')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(mockAuthUser);
      });
    });

    describe('GET /tenants/:id/subscription/history', () => {
      it('should return subscription history', async () => {
        const history = [
          { plan: 'free', startDate: new Date('2024-01-01'), endDate: new Date('2024-02-01') },
          {
            plan: 'professional',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-03-01'),
          },
        ];
        subscriptionService.getSubscriptionHistory.mockResolvedValue(history);

        const response = await request(app.getHttpServer())
          .get('/tenants/tenant-123/subscription/history')
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(response.body).toEqual(history);
        expect(subscriptionService.getSubscriptionHistory).toHaveBeenCalledWith(mockAuthUser);
      });
    });
  });

  describe('PUT /tenants/:id', () => {
    it('should update tenant successfully', async () => {
      const updateDto = {
        name: 'Updated Company',
        companyPhone: '+84987654321',
      };
      const updatedTenant = { ...mockTenant, ...updateDto };
      tenantService.update.mockResolvedValue(updatedTenant);

      const response = await request(app.getHttpServer())
        .put('/tenants/tenant-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Company');
      expect(tenantService.update).toHaveBeenCalledWith(mockAuthUser, updateDto);
    });

    it('should return 409 when code already exists', async () => {
      const updateDto = { code: 'existing-code' };
      tenantService.update.mockRejectedValue({
        status: 409,
        message: 'Tenant with code existing-code already exists',
      });

      await request(app.getHttpServer())
        .put('/tenants/tenant-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(409);
    });
  });

  describe('PATCH /tenants/:id/suspend', () => {
    it('should suspend tenant successfully', async () => {
      const suspendedTenant = { ...mockTenant, status: TenantStatus.SUSPENDED };
      tenantService.suspend.mockResolvedValue(suspendedTenant);

      const response = await request(app.getHttpServer())
        .patch('/tenants/tenant-123/suspend')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe(TenantStatus.SUSPENDED);
      expect(tenantService.suspend).toHaveBeenCalledWith(mockAuthUser);
    });
  });

  describe('PATCH /tenants/:id/activate', () => {
    it('should activate tenant successfully', async () => {
      const activatedTenant = { ...mockTenant, status: TenantStatus.ACTIVE };
      tenantService.activate.mockResolvedValue(activatedTenant);

      const response = await request(app.getHttpServer())
        .patch('/tenants/tenant-123/activate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe(TenantStatus.ACTIVE);
      expect(tenantService.activate).toHaveBeenCalledWith(mockAuthUser);
    });
  });

  describe('PATCH /tenants/:id/cancel', () => {
    it('should cancel tenant successfully', async () => {
      const cancelledTenant = { ...mockTenant, status: TenantStatus.CANCELLED };
      tenantService.cancel.mockResolvedValue(cancelledTenant);

      const response = await request(app.getHttpServer())
        .patch('/tenants/tenant-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe(TenantStatus.CANCELLED);
      expect(tenantService.cancel).toHaveBeenCalledWith(mockAuthUser);
    });
  });

  describe('PATCH /tenants/:id/storage', () => {
    it('should update storage successfully', async () => {
      const storageDto = { storageUsed: 2147483648 };
      const updatedTenant = { ...mockTenant, currentStorage: 2147483648 };
      tenantService.updateStorage.mockResolvedValue(updatedTenant);

      const response = await request(app.getHttpServer())
        .patch('/tenants/tenant-123/storage')
        .set('Authorization', 'Bearer valid-token')
        .send(storageDto)
        .expect(200);

      expect(response.body.currentStorage).toBe(2147483648);
      expect(tenantService.updateStorage).toHaveBeenCalledWith(mockAuthUser, 2147483648);
    });

    it('should return 400 when storage exceeds limit', async () => {
      const storageDto = { storageUsed: 99999999999 };
      tenantService.updateStorage.mockRejectedValue({
        status: 400,
        message: 'Storage limit exceeded',
      });

      await request(app.getHttpServer())
        .patch('/tenants/tenant-123/storage')
        .set('Authorization', 'Bearer valid-token')
        .send(storageDto)
        .expect(400);
    });
  });

  describe('DELETE /tenants/:id', () => {
    it('should delete tenant successfully', async () => {
      tenantService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/tenants/tenant-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Tenant deleted successfully');
      expect(tenantService.remove).toHaveBeenCalledWith(mockAuthUser);
    });

    it('should return 400 when tenant has users', async () => {
      tenantService.remove.mockRejectedValue({
        status: 400,
        message: 'Cannot delete tenant with 5 users. Please remove all users first.',
      });

      await request(app.getHttpServer())
        .delete('/tenants/tenant-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 404 when tenant not found', async () => {
      tenantService.remove.mockRejectedValue({
        status: 404,
        message: 'Tenant not found',
      });

      await request(app.getHttpServer())
        .delete('/tenants/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });
});

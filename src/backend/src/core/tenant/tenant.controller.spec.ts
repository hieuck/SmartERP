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
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockTenant = {
    id: 'tenant-123',
    code: 'testcompany',
    name: 'Test Company',
    domain: null,
    logo: null,
    companyName: 'Test Company Ltd',
    companyAddress: null,
    companyPhone: '+84901234567',
    companyEmail: null,
    companyTaxCode: null,
    companyWebsite: null,
    status: TenantStatus.ACTIVE,
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    language: 'vi',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '#,##0.00',
    taxRate: 10,
    subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    billingCycle: 'monthly' as any,
    subscriptionAmount: 990000,
    maxUsers: 50,
    maxStorage: 10737418240,
    currentStorage: 1073741824,
    features: ['basic', 'advanced'],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'user-123',
    updatedBy: 'user-123',
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

      expect(response.body.id).toBe(mockTenant.id);
      expect(response.body.code).toBe(mockTenant.code);
      expect(response.body.name).toBe(mockTenant.name);
      expect(tenantService.create).toHaveBeenCalledWith(createDto, 'user-123');
    });

    it('should return 409 when code already exists', async () => {
      const createDto = {
        code: 'existing',
        name: 'Existing Company',
      };

      const ConflictException = require('@nestjs/common').ConflictException;
      tenantService.create.mockRejectedValue(
        new ConflictException('Tenant with code existing already exists'),
      );

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

      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('tenant-123');
      expect(response.body[1].id).toBe('tenant-456');
      expect(tenantService.findAll).toHaveBeenCalled();
    });

    it('should filter tenants by status', async () => {
      const activeTenants = [mockTenant];
      tenantService.findByStatus.mockResolvedValue(activeTenants);

      const response = await request(app.getHttpServer())
        .get('/tenants?status=active')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('tenant-123');
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

      expect(response.body.count).toBe(42);
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

      expect(response.body.id).toBe(mockTenant.id);
      expect(response.body.code).toBe(mockTenant.code);
      expect(tenantService.findOne).toHaveBeenCalledWith(mockAuthUser);
    });

    it('should return 404 when tenant not found', async () => {
      const NotFoundException = require('@nestjs/common').NotFoundException;
      tenantService.findOne.mockRejectedValue(new NotFoundException('Tenant not found'));

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

      expect(response.body.id).toBe(mockTenant.id);
      expect(response.body.code).toBe(mockTenant.code);
      expect(tenantService.findByCode).toHaveBeenCalledWith('testcompany');
    });

    it('should return 404 when code not found', async () => {
      const NotFoundException = require('@nestjs/common').NotFoundException;
      tenantService.findByCode.mockRejectedValue(new NotFoundException('Tenant not found'));

      await request(app.getHttpServer())
        .get('/tenants/code/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /tenants/:id/users', () => {
    it('should return users by tenant', async () => {
      const users = [
        { id: 'user-1', tenantId: 'tenant-123', roles: ['admin'] },
        { id: 'user-2', tenantId: 'tenant-123', roles: ['user'] },
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

      expect(response.body.tenantId).toBe('tenant-123');
      expect(response.body.users.current).toBe(10);
      expect(tenantService.getUsageReport).toHaveBeenCalledWith(mockAuthUser);
    });
  });

  describe('Onboarding Endpoints', () => {
    describe('GET /tenants/:id/onboarding/status', () => {
      it('should return onboarding status', async () => {
        const status = {
          tenantId: 'tenant-123',
          tenantName: 'Test Company',
          steps: {
            accountCreated: true,
            emailVerified: true,
            businessInfoCompleted: false,
            teamInvited: false,
            dataImported: false,
          },
          progress: 40,
          isComplete: false,
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
          businessType: 'trading' as any,
          companySize: '1-10' as any,
          teamMembers: [],
        };
        const onboardingStatus = {
          tenantId: 'tenant-123',
          tenantName: 'Test Company',
          steps: {
            accountCreated: true,
            emailVerified: true,
            businessInfoCompleted: true,
            teamInvited: false,
            dataImported: false,
          },
          progress: 60,
          isComplete: false,
        };
        onboardingService.completeOnboarding.mockResolvedValue({
          success: true,
          message: 'Onboarding completed',
          tenant: {
            id: 'tenant-123',
            name: 'Test Company',
            businessType: 'trading' as any,
            companySize: '1-10' as any,
          },
          invitations: {
            sent: 0,
            emails: [],
          },
          onboardingStatus,
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
          tenant: {
            id: 'tenant-123',
            name: 'Test Company',
          },
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
          email: 'newmember@example.com',
          tenantId: 'tenant-123',
          invitedBy: 'user-123',
          status: 'pending',
          message: 'Invitation sent',
        });

        const response = await request(app.getHttpServer())
          .post('/tenants/tenant-123/onboarding/invite')
          .set('Authorization', 'Bearer valid-token')
          .send(inviteDto)
          .expect(201);

        expect(response.body.email).toBe('newmember@example.com');
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
        const pricing = {
          plans: [
            {
              plan: 'free',
              monthly: 0,
              yearly: 0,
              maxUsers: 1,
              maxStorage: 1073741824,
              features: ['basic'],
              savings: 0,
            },
            {
              plan: 'professional',
              monthly: 990000,
              yearly: 9900000,
              maxUsers: 20,
              maxStorage: 53687091200,
              features: ['basic', 'advanced'],
              savings: 17,
            },
            {
              plan: 'enterprise',
              monthly: 2990000,
              yearly: 29900000,
              maxUsers: -1,
              maxStorage: -1,
              features: ['basic', 'advanced', 'premium'],
              savings: 17,
            },
          ],
        };
        subscriptionService.getPricing.mockReturnValue(pricing);

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
          tenant: {
            id: 'tenant-123',
            name: 'Test Company',
            code: 'testcompany',
          },
          subscription: {
            plan: SubscriptionPlan.PROFESSIONAL,
            billingCycle: 'monthly' as any,
            amount: 990000,
            startDate: new Date(),
            endDate: new Date(),
            status: TenantStatus.ACTIVE,
          },
          usage: {
            users: { max: 50 },
            storage: { current: 1073741824, max: 10737418240, percentage: 10 },
          },
          features: ['basic', 'advanced'],
          isTrialActive: false,
          daysUntilExpiry: 30,
        };
        subscriptionService.getSubscription.mockResolvedValue(subscription);

        const response = await request(app.getHttpServer())
          .get('/tenants/tenant-123/subscription')
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(response.body.tenant.id).toBe('tenant-123');
        expect(response.body.subscription.plan).toBe('professional');
        expect(subscriptionService.getSubscription).toHaveBeenCalledWith(mockAuthUser);
      });
    });

    describe('POST /tenants/:id/subscription/upgrade', () => {
      it('should upgrade subscription', async () => {
        const upgradeDto = {
          plan: SubscriptionPlan.ENTERPRISE,
          billingCycle: 'yearly' as any,
        };
        subscriptionService.upgradeSubscription.mockResolvedValue({
          success: true,
          message: 'Subscription upgraded',
          subscription: {
            plan: SubscriptionPlan.ENTERPRISE,
            billingCycle: 'yearly' as any,
            amount: 29900000,
            startDate: new Date(),
            endDate: new Date(),
            features: ['basic', 'advanced', 'premium'],
          },
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
          subscription: {
            plan: SubscriptionPlan.FREE,
            features: ['basic'],
          },
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
        const history = {
          tenantId: 'tenant-123',
          history: [],
          message: 'Subscription history tracking to be implemented',
        };
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
      const ConflictException = require('@nestjs/common').ConflictException;
      tenantService.update.mockRejectedValue(
        new ConflictException('Tenant with code existing-code already exists'),
      );

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
      const BadRequestException = require('@nestjs/common').BadRequestException;
      tenantService.updateStorage.mockRejectedValue(
        new BadRequestException('Storage limit exceeded'),
      );

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
      const BadRequestException = require('@nestjs/common').BadRequestException;
      tenantService.remove.mockRejectedValue(
        new BadRequestException(
          'Cannot delete tenant with 5 users. Please remove all users first.',
        ),
      );

      await request(app.getHttpServer())
        .delete('/tenants/tenant-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 404 when tenant not found', async () => {
      const NotFoundException = require('@nestjs/common').NotFoundException;
      tenantService.remove.mockRejectedValue(new NotFoundException('Tenant not found'));

      await request(app.getHttpServer())
        .delete('/tenants/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });
});

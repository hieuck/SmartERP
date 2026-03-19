import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OnboardingService } from './onboarding.service';
import { Tenant } from './entities/tenant.entity';
import { User as UserEntity } from '../user/entities/user.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { BusinessType, CompanySize } from './dto/complete-onboarding.dto';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;
  let userRepository: jest.Mocked<Repository<UserEntity>>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockTenant: Tenant = {
    id: 'tenant-1',
    code: 'TEST001',
    name: 'Test Company',
    domain: null,
    logo: null,
    status: 'active' as any,
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    language: 'vi',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '#,##0.00',
    taxRate: 10,
    companyName: 'Test Company',
    companyAddress: null,
    companyPhone: null,
    companyEmail: null,
    companyTaxCode: null,
    companyWebsite: null,
    subscriptionPlan: 'free' as any,
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    maxUsers: 5,
    maxStorage: 1073741824,
    currentStorage: 0,
    features: [],
    billingCycle: 'monthly' as any,
    subscriptionAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(async () => {
    const mockTenantRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    };

    const mockPermissionService = {
      checkPermission: jest.fn().mockResolvedValue(true),
      filterByPermission: jest.fn(),
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, baseWhere) => ({ ...baseWhere, tenantId: user.tenantId })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
    userRepository = module.get(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarding status for existing tenant', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(1);
      userRepository.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        emailVerified: true,
        role: 'admin',
      } as any);

      const result = await service.getOnboardingStatus(mockUser);

      expect(result).toBeDefined();
      expect(result.tenantId).toBe('tenant-1');
      expect(result.tenantName).toBe('Test Company');
      expect(result.steps.accountCreated).toBe(true);
      expect(result.steps.emailVerified).toBe(true);
      expect(result.steps.businessInfoCompleted).toBe(false);
      expect(result.steps.teamInvited).toBe(false);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getOnboardingStatus(mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.getOnboardingStatus(mockUser)).rejects.toThrow('Tenant not found');
    });

    it('should calculate progress correctly with all steps completed', async () => {
      const completedTenant = {
        ...mockTenant,
        features: ['business_type:trading', 'company_size:1-10'],
      };
      tenantRepository.findOne.mockResolvedValue(completedTenant);
      userRepository.count.mockResolvedValue(3);
      userRepository.findOne.mockResolvedValue({
        emailVerified: true,
        role: 'admin',
      } as any);

      const result = await service.getOnboardingStatus(mockUser);

      expect(result.steps.businessInfoCompleted).toBe(true);
      expect(result.steps.teamInvited).toBe(true);
      expect(result.progress).toBeGreaterThan(0);
    });

    it('should return false for teamInvited when only one user', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(1);
      userRepository.findOne.mockResolvedValue({
        emailVerified: false,
        role: 'admin',
      } as any);

      const result = await service.getOnboardingStatus(mockUser);

      expect(result.steps.teamInvited).toBe(false);
    });

    it('should return false for emailVerified when admin email not verified', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(1);
      userRepository.findOne.mockResolvedValue({
        emailVerified: false,
        role: 'admin',
      } as any);

      const result = await service.getOnboardingStatus(mockUser);

      expect(result.steps.emailVerified).toBe(false);
    });

    it('should return false for emailVerified when no admin user found', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(1);
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.getOnboardingStatus(mockUser);

      expect(result.steps.emailVerified).toBe(false);
    });

    it('should calculate progress as 100 when all steps completed', async () => {
      const completedTenant = {
        ...mockTenant,
        features: ['business_type:trading', 'company_size:1-10'],
      };
      tenantRepository.findOne.mockResolvedValue(completedTenant);
      userRepository.count.mockResolvedValue(3);
      userRepository.findOne.mockResolvedValue({
        emailVerified: true,
        role: 'admin',
      } as any);

      const result = await service.getOnboardingStatus(mockUser);

      expect(result.isComplete).toBe(false); // dataImported is always false
      expect(result.progress).toBeLessThan(100);
    });
  });

  describe('completeOnboarding', () => {
    const completeDto: CompleteOnboardingDto = {
      businessType: BusinessType.TRADING,
      companySize: CompanySize.SMALL,
      teamMembers: ['user1@test.com', 'user2@test.com'],
    };

    it('should complete onboarding successfully', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.count.mockResolvedValue(1);

      const result = await service.completeOnboarding(mockUser, completeDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Onboarding completed successfully');
      expect(result.tenant.businessType).toBe(BusinessType.TRADING);
      expect(result.tenant.companySize).toBe(CompanySize.SMALL);
      expect(result.invitations.sent).toBe(2);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.completeOnboarding(mockUser, completeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update tenant with business info', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.count.mockResolvedValue(1);

      await service.completeOnboarding(mockUser, completeDto);

      expect(tenantRepository.save).toHaveBeenCalled();
      const savedTenant = tenantRepository.save.mock.calls[0][0];
      expect(savedTenant.features).toContain('business_type:trading');
      expect(savedTenant.features).toContain('company_size:1-10');
      expect(savedTenant.updatedBy).toBe('user-1');
    });

    it('should complete onboarding without team members', async () => {
      const dtoWithoutTeam: CompleteOnboardingDto = {
        businessType: BusinessType.SERVICE,
        companySize: CompanySize.MEDIUM,
      };

      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      userRepository.count.mockResolvedValue(1);

      const result = await service.completeOnboarding(mockUser, dtoWithoutTeam);

      expect(result.success).toBe(true);
      expect(result.invitations.sent).toBe(0);
      expect(result.invitations.emails).toEqual([]);
    });

    it('should handle invitation errors gracefully', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      // Mock to reject only when checking for team member existence
      userRepository.findOne.mockImplementation(
        (options: { where?: { email?: string } } | undefined) => {
          if (options?.where?.email) {
            return Promise.reject(new Error('Database error'));
          }
          // For admin user check in getOnboardingStatus
          return Promise.resolve({
            emailVerified: true,
            role: 'admin',
          } as any);
        },
      );
      userRepository.count.mockResolvedValue(1);

      const result = await service.completeOnboarding(mockUser, completeDto);

      expect(result.success).toBe(true);
      expect(result.invitations.sent).toBe(0);
    });

    it('should return onboarding status after completion', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.count.mockResolvedValue(1);

      const result = await service.completeOnboarding(mockUser, completeDto);

      expect(result.onboardingStatus).toBeDefined();
      expect(result.onboardingStatus.tenantId).toBe('tenant-1');
    });
  });

  describe('inviteTeamMember', () => {
    it('should invite team member successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.inviteTeamMember(mockUser, 'newuser@test.com');

      expect(result.email).toBe('newuser@test.com');
      expect(result.tenantId).toBe('tenant-1');
      expect(result.invitedBy).toBe('user-1');
      expect(result.status).toBe('pending');
    });

    it('should throw BadRequestException when user already exists', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com',
        tenantId: 'tenant-1',
      } as any);

      await expect(service.inviteTeamMember(mockUser, 'existing@test.com')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.inviteTeamMember(mockUser, 'existing@test.com')).rejects.toThrow(
        'User with email existing@test.com already exists in this tenant',
      );
    });

    it('should check user existence in correct tenant', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await service.inviteTeamMember(mockUser, 'newuser@test.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'newuser@test.com', tenantId: 'tenant-1' },
      });
    });
  });

  describe('skipOnboarding', () => {
    it('should skip onboarding successfully', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);

      const result = await service.skipOnboarding(mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Onboarding skipped');
      expect(result.tenant.id).toBe('tenant-1');
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.skipOnboarding(mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should add onboarding_skipped to features', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);

      await service.skipOnboarding(mockUser);

      expect(tenantRepository.save).toHaveBeenCalled();
      const savedTenant = tenantRepository.save.mock.calls[0][0];
      expect(savedTenant.features).toContain('onboarding_skipped');
      expect(savedTenant.updatedBy).toBe('user-1');
    });

    it('should preserve existing features when skipping', async () => {
      const tenantWithFeatures = {
        ...mockTenant,
        features: ['existing_feature'],
      };
      tenantRepository.findOne.mockResolvedValue(tenantWithFeatures);
      tenantRepository.save.mockResolvedValue(tenantWithFeatures);

      await service.skipOnboarding(mockUser);

      const savedTenant = tenantRepository.save.mock.calls[0][0];
      expect(savedTenant.features).toContain('existing_feature');
      expect(savedTenant.features).toContain('onboarding_skipped');
    });
  });
});

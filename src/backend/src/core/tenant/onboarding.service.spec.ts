import { User as AuthUser, PermissionService } from '@/common/security/permission.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { BusinessType, CompanySize, CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { Tenant } from '../entities/tenant.entity';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;

  const mockUser: AuthUser = {
    id: 'user-1',
    tenantId: 'tenant-uuid',
    roles: ['admin'],
  };

  const mockTenantRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockPermissionService = {
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
    buildSecureQuery: jest.fn((user, query) => query),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);

    // Mock SecureRepository methods
    jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue({
      id: 'tenant-uuid',
      name: 'Test Company',
      features: [],
    } as Tenant);
    jest
      .spyOn(service['secureTenantRepo'], 'save')
      .mockImplementation(async (_user, data: any) => data as Tenant);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarding status for a tenant', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        name: 'Test Company',
        features: ['business_type:trading', 'company_size:1-10'],
      };

      const mockUserEntity: Partial<User> = {
        id: 'user-uuid',
        emailVerified: true,
        role: 'admin',
      };

      jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue(mockTenant as Tenant);
      mockUserRepository.count.mockResolvedValue(2); // Admin + 1 team member
      mockUserRepository.findOne.mockResolvedValue(mockUserEntity);

      const result = await service.getOnboardingStatus(mockUser);

      expect(result.tenantId).toBe('tenant-uuid');
      expect(result.steps.accountCreated).toBe(true);
      expect(result.steps.emailVerified).toBe(true);
      expect(result.steps.businessInfoCompleted).toBe(true);
      expect(result.steps.teamInvited).toBe(true);
      expect(result.progress).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.getOnboardingStatus(mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should calculate progress correctly', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        name: 'Test Company',
        features: [],
      };

      jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue(mockTenant as Tenant);
      mockUserRepository.count.mockResolvedValue(1); // Only admin
      mockUserRepository.findOne.mockResolvedValue({ emailVerified: false });

      const result = await service.getOnboardingStatus(mockUser);

      // Only accountCreated is true
      expect(result.progress).toBe(20); // 1/5 steps = 20%
      expect(result.isComplete).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    const completeDto: CompleteOnboardingDto = {
      businessType: BusinessType.TRADING,
      companySize: CompanySize.SMALL,
      teamMembers: ['user1@test.com', 'user2@test.com'],
    };

    it('should successfully complete onboarding', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        name: 'Test Company',
        features: [],
      };

      jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(service['secureTenantRepo'], 'save').mockResolvedValue({
        ...mockTenant,
        features: ['business_type:trading', 'company_size:1-10'],
      } as Tenant);
      mockUserRepository.findOne.mockResolvedValue(null); // No existing users
      mockUserRepository.count.mockResolvedValue(1);

      const result = await service.completeOnboarding(mockUser, completeDto);

      expect(result.success).toBe(true);
      expect(result.tenant.businessType).toBe(BusinessType.TRADING);
      expect(result.tenant.companySize).toBe(CompanySize.SMALL);
      expect(result.invitations.sent).toBe(2);
      expect(service['secureTenantRepo'].save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.completeOnboarding(mockUser, completeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle onboarding without team members', async () => {
      const dtoWithoutTeam: CompleteOnboardingDto = {
        businessType: BusinessType.SERVICE,
        companySize: CompanySize.MEDIUM,
      };

      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        name: 'Test Company',
        features: [],
      };

      jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(service['secureTenantRepo'], 'save').mockResolvedValue(mockTenant as Tenant);
      mockUserRepository.count.mockResolvedValue(1);
      mockUserRepository.findOne.mockResolvedValue({ emailVerified: true });

      const result = await service.completeOnboarding(mockUser, dtoWithoutTeam);

      expect(result.success).toBe(true);
      expect(result.invitations.sent).toBe(0);
    });
  });

  describe('inviteTeamMember', () => {
    it('should create invitation for new team member', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user

      const result = await service.inviteTeamMember(mockUser, 'newuser@test.com');

      expect(result.email).toBe('newuser@test.com');
      expect(result.status).toBe('pending');
      expect(result.invitedBy).toBe('user-1');
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.inviteTeamMember(mockUser, 'existing@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('skipOnboarding', () => {
    it('should successfully skip onboarding', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        name: 'Test Company',
        features: [],
      };

      jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue(mockTenant as Tenant);
      jest.spyOn(service['secureTenantRepo'], 'save').mockResolvedValue({
        ...mockTenant,
        features: ['onboarding_skipped'],
      } as Tenant);

      const result = await service.skipOnboarding(mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('skipped');
      expect(service['secureTenantRepo'].save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found', async () => {
      jest.spyOn(service['secureTenantRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.skipOnboarding(mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});

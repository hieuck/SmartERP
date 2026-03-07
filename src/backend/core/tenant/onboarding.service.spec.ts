import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { Tenant } from './entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { CompleteOnboardingDto, BusinessType, CompanySize } from './dto/complete-onboarding.dto';

describe('OnboardingService', () => {
  let service: OnboardingService;

  const mockTenantRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
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
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);

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

      const mockUser: Partial<User> = {
        id: 'user-uuid',
        emailVerified: true,
        role: 'admin',
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockUserRepository.count.mockResolvedValue(2); // Admin + 1 team member
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getOnboardingStatus('tenant-uuid');

      expect(result.tenantId).toBe('tenant-uuid');
      expect(result.steps.accountCreated).toBe(true);
      expect(result.steps.emailVerified).toBe(true);
      expect(result.steps.businessInfoCompleted).toBe(true);
      expect(result.steps.teamInvited).toBe(true);
      expect(result.progress).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getOnboardingStatus('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should calculate progress correctly', async () => {
      const mockTenant: Partial<Tenant> = {
        id: 'tenant-uuid',
        name: 'Test Company',
        features: [],
      };

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockUserRepository.count.mockResolvedValue(1); // Only admin
      mockUserRepository.findOne.mockResolvedValue({ emailVerified: false });

      const result = await service.getOnboardingStatus('tenant-uuid');

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

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        features: ['business_type:trading', 'company_size:1-10'],
      });
      mockUserRepository.findOne.mockResolvedValue(null); // No existing users
      mockUserRepository.count.mockResolvedValue(1);

      const result = await service.completeOnboarding('tenant-uuid', completeDto);

      expect(result.success).toBe(true);
      expect(result.tenant.businessType).toBe(BusinessType.TRADING);
      expect(result.tenant.companySize).toBe(CompanySize.SMALL);
      expect(result.invitations.sent).toBe(2);
      expect(mockTenantRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.completeOnboarding('invalid-id', completeDto)).rejects.toThrow(
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

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.save.mockResolvedValue(mockTenant);
      mockUserRepository.count.mockResolvedValue(1);
      mockUserRepository.findOne.mockResolvedValue({ emailVerified: true });

      const result = await service.completeOnboarding('tenant-uuid', dtoWithoutTeam);

      expect(result.success).toBe(true);
      expect(result.invitations.sent).toBe(0);
    });
  });

  describe('inviteTeamMember', () => {
    it('should create invitation for new team member', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user

      const result = await service.inviteTeamMember('tenant-uuid', 'newuser@test.com', 'admin-id');

      expect(result.email).toBe('newuser@test.com');
      expect(result.status).toBe('pending');
      expect(result.invitedBy).toBe('admin-id');
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.inviteTeamMember('tenant-uuid', 'existing@test.com')).rejects.toThrow(
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

      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.save.mockResolvedValue({
        ...mockTenant,
        features: ['onboarding_skipped'],
      });

      const result = await service.skipOnboarding('tenant-uuid');

      expect(result.success).toBe(true);
      expect(result.message).toContain('skipped');
      expect(mockTenantRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.skipOnboarding('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});

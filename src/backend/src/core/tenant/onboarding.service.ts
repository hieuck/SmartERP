import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from '../user/entities/user.entity';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly secureTenantRepo: SecureRepository<Tenant>;

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureTenantRepo = new SecureRepository(
      this.tenantRepository,
      this.permissionService,
      'Tenant',
    );
  }

  /**
   * Get onboarding status for current tenant
   */
  async getOnboardingStatus(user: User) {
    const tenant = await this.secureTenantRepo.findOne(user, { where: { id: user.tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check what steps are completed
    const userCount = await this.userRepository.count({ where: { tenantId: user.tenantId } });

    const status = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      steps: {
        accountCreated: true, // Always true if tenant exists
        emailVerified: await this.isEmailVerified(user.tenantId),
        businessInfoCompleted: this.isBusinessInfoCompleted(tenant),
        teamInvited: userCount > 1, // More than just admin
        dataImported: false, // TODO: Track this separately
      },
      progress: 0,
      isComplete: false,
    };

    // Calculate progress
    const completedSteps = Object.values(status.steps).filter((step) => step === true).length;
    status.progress = Math.round((completedSteps / Object.keys(status.steps).length) * 100);
    status.isComplete = status.progress === 100;

    return status;
  }

  /**
   * Complete onboarding process for current tenant
   */
  async completeOnboarding(user: User, dto: CompleteOnboardingDto) {
    const tenant = await this.secureTenantRepo.findOne(user, { where: { id: user.tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Update tenant with business info
    tenant.companyName = tenant.companyName || tenant.name;
    tenant.updatedBy = user.id;

    // Store business type and size in features or custom fields
    // For now, we'll add them to features array
    const features = tenant.features || [];
    features.push(`business_type:${dto.businessType}`);
    features.push(`company_size:${dto.companySize}`);
    tenant.features = features;

    await this.secureTenantRepo.save(user, tenant);

    // Invite team members if provided
    const invitations = [];
    if (dto.teamMembers && dto.teamMembers.length > 0) {
      for (const email of dto.teamMembers) {
        try {
          const invitation = await this.inviteTeamMember(user, email);
          invitations.push(invitation);
        } catch (error) {
          this.logger.error(`Failed to invite ${email}:`, error.message);
        }
      }
    }

    // Get updated status
    const status = await this.getOnboardingStatus(user);

    return {
      success: true,
      message: 'Onboarding completed successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        businessType: dto.businessType,
        companySize: dto.companySize,
      },
      invitations: {
        sent: invitations.length,
        emails: invitations.map((inv) => inv.email),
      },
      onboardingStatus: status,
    };
  }

  /**
   * Invite team member to current tenant
   */
  async inviteTeamMember(user: User, email: string) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email, tenantId: user.tenantId },
    });

    if (existingUser) {
      throw new BadRequestException(`User with email ${email} already exists in this tenant`);
    }

    // TODO: Create invitation record and send email
    // For now, just return invitation info
    return {
      email,
      tenantId: user.tenantId,
      invitedBy: user.id,
      status: 'pending',
      message: 'Invitation email will be sent (email service not yet integrated)',
    };
  }

  /**
   * Skip onboarding (mark as completed without filling details)
   */
  async skipOnboarding(user: User) {
    const tenant = await this.secureTenantRepo.findOne(user, { where: { id: user.tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Mark onboarding as skipped in features
    const features = tenant.features || [];
    features.push('onboarding_skipped');
    tenant.features = features;
    tenant.updatedBy = user.id;

    await this.secureTenantRepo.save(user, tenant);

    return {
      success: true,
      message: 'Onboarding skipped. You can complete it later from settings.',
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    };
  }

  /**
   * Check if email is verified for tenant admin
   */
  private async isEmailVerified(tenantId: string): Promise<boolean> {
    const adminUser = await this.userRepository.findOne({
      where: { tenantId, role: 'admin' },
    });

    return adminUser?.emailVerified || false;
  }

  /**
   * Check if business info is completed
   */
  private isBusinessInfoCompleted(tenant: Tenant): boolean {
    const features = tenant.features || [];
    const hasBusinessType = features.some((f) => f.startsWith('business_type:'));
    const hasCompanySize = features.some((f) => f.startsWith('company_size:'));

    return hasBusinessType && hasCompanySize;
  }
}

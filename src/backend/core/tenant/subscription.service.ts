import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { BillingCycle, SubscriptionPlan, Tenant, TenantStatus } from './entities/tenant.entity';

// Pricing configuration (in VND)
const PRICING = {
  [SubscriptionPlan.FREE]: {
    [BillingCycle.MONTHLY]: 0,
    [BillingCycle.YEARLY]: 0,
    maxUsers: 1,
    maxStorage: 1073741824, // 1GB
    features: ['basic'],
  },
  [SubscriptionPlan.BASIC]: {
    [BillingCycle.MONTHLY]: 290000, // 290K VND/month
    [BillingCycle.YEARLY]: 2900000, // 2.9M VND/year (save ~17%)
    maxUsers: 5,
    maxStorage: 5368709120, // 5GB
    features: ['basic', 'reports', 'export'],
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    [BillingCycle.MONTHLY]: 990000, // 990K VND/month
    [BillingCycle.YEARLY]: 9900000, // 9.9M VND/year (save ~17%)
    maxUsers: 20,
    maxStorage: 53687091200, // 50GB
    features: ['basic', 'reports', 'export', 'api', 'integrations', 'priority-support'],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    [BillingCycle.MONTHLY]: 2990000, // 2.99M VND/month
    [BillingCycle.YEARLY]: 29900000, // 29.9M VND/year (save ~17%)
    maxUsers: -1, // Unlimited
    maxStorage: -1, // Unlimited
    features: [
      'basic',
      'reports',
      'export',
      'api',
      'integrations',
      'priority-support',
      'custom-domain',
      'white-label',
      'dedicated-support',
    ],
  },
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly secureTenantRepo: SecureRepository<Tenant>;

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureTenantRepo = new SecureRepository(tenantRepository, permissionService, 'Tenant');
  }

  /**
   * Get pricing information for all plans
   */
  getPricing() {
    return {
      plans: Object.entries(PRICING).map(([plan, config]) => ({
        plan,
        monthly: config[BillingCycle.MONTHLY],
        yearly: config[BillingCycle.YEARLY],
        maxUsers: config.maxUsers,
        maxStorage: config.maxStorage,
        features: config.features,
        savings:
          config[BillingCycle.YEARLY] > 0
            ? Math.round(
                ((config[BillingCycle.MONTHLY] * 12 - config[BillingCycle.YEARLY]) /
                  (config[BillingCycle.MONTHLY] * 12)) *
                  100,
              )
            : 0,
      })),
    };
  }

  /**
   * Get current subscription details for a tenant
   */
  async getSubscription(user: User) {
    const tenant = await this.secureTenantRepo.findOne(user, { where: { id: user.tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const planConfig = PRICING[tenant.subscriptionPlan];
    const currentPrice = planConfig[tenant.billingCycle];

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
      },
      subscription: {
        plan: tenant.subscriptionPlan,
        billingCycle: tenant.billingCycle,
        amount: currentPrice,
        startDate: tenant.subscriptionStartDate,
        endDate: tenant.subscriptionEndDate,
        status: tenant.status,
      },
      usage: {
        users: {
          max: tenant.maxUsers,
          // Current usage would be fetched from user count
        },
        storage: {
          current: tenant.currentStorage,
          max: tenant.maxStorage,
          percentage:
            tenant.maxStorage > 0
              ? Math.round((Number(tenant.currentStorage) / Number(tenant.maxStorage)) * 100)
              : 0,
        },
      },
      features: tenant.features || planConfig.features,
      isTrialActive: this.isTrialActive(tenant),
      daysUntilExpiry: this.getDaysUntilExpiry(tenant),
    };
  }

  /**
   * Upgrade or change subscription plan
   */
  async upgradeSubscription(user: User, upgradeDto: UpgradeSubscriptionDto) {
    const tenant = await this.secureTenantRepo.findOne(user, { where: { id: user.tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Validate plan upgrade
    if (
      tenant.subscriptionPlan === upgradeDto.plan &&
      tenant.billingCycle === upgradeDto.billingCycle
    ) {
      throw new BadRequestException('Already on this plan and billing cycle');
    }

    // Get new plan configuration
    const newPlanConfig = PRICING[upgradeDto.plan];
    const newAmount = newPlanConfig[upgradeDto.billingCycle];

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (upgradeDto.billingCycle === BillingCycle.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update tenant subscription
    tenant.subscriptionPlan = upgradeDto.plan;
    tenant.billingCycle = upgradeDto.billingCycle;
    tenant.subscriptionAmount = newAmount;
    tenant.subscriptionStartDate = startDate;
    tenant.subscriptionEndDate = endDate;
    tenant.maxUsers = newPlanConfig.maxUsers;
    tenant.maxStorage = newPlanConfig.maxStorage;
    tenant.features = newPlanConfig.features;
    tenant.status = TenantStatus.ACTIVE;
    tenant.updatedBy = user.id;

    await this.secureTenantRepo.save(user, tenant);

    // TODO: Process payment with payment gateway
    // if (upgradeDto.paymentMethodId && newAmount > 0) {
    //   await this.processPayment(tenant, newAmount, upgradeDto.paymentMethodId);
    // }

    return {
      success: true,
      message: 'Subscription upgraded successfully',
      subscription: {
        plan: tenant.subscriptionPlan,
        billingCycle: tenant.billingCycle,
        amount: tenant.subscriptionAmount,
        startDate: tenant.subscriptionStartDate,
        endDate: tenant.subscriptionEndDate,
        features: tenant.features,
      },
    };
  }

  /**
   * Cancel subscription (downgrade to free)
   */
  async cancelSubscription(user: User) {
    const tenant = await this.secureTenantRepo.findOne(user, { where: { id: user.tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.subscriptionPlan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Already on free plan');
    }

    // Downgrade to free plan
    const freePlanConfig = PRICING[SubscriptionPlan.FREE];

    tenant.subscriptionPlan = SubscriptionPlan.FREE;
    tenant.billingCycle = BillingCycle.MONTHLY;
    tenant.subscriptionAmount = 0;
    tenant.subscriptionEndDate = null;
    tenant.maxUsers = freePlanConfig.maxUsers;
    tenant.maxStorage = freePlanConfig.maxStorage;
    tenant.features = freePlanConfig.features;
    tenant.updatedBy = user.id;

    await this.secureTenantRepo.save(user, tenant);

    return {
      success: true,
      message: 'Subscription cancelled. Downgraded to free plan.',
      subscription: {
        plan: tenant.subscriptionPlan,
        features: tenant.features,
      },
    };
  }

  /**
   * Check if trial is active
   */
  private isTrialActive(tenant: Tenant): boolean {
    if (tenant.subscriptionPlan !== SubscriptionPlan.FREE) {
      return false;
    }

    if (!tenant.subscriptionEndDate) {
      return false;
    }

    return new Date() < new Date(tenant.subscriptionEndDate);
  }

  /**
   * Get days until subscription expiry
   */
  private getDaysUntilExpiry(tenant: Tenant): number | null {
    if (!tenant.subscriptionEndDate) {
      return null;
    }

    const now = new Date();
    const expiry = new Date(tenant.subscriptionEndDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Check if subscription is expired
   */
  async checkExpiredSubscriptions() {
    const now = new Date();

    const expiredTenants = await this.tenantRepository
      .createQueryBuilder('tenant')
      .where('tenant.subscriptionEndDate < :now', { now })
      .andWhere('tenant.status = :status', { status: TenantStatus.ACTIVE })
      .getMany();

    for (const tenant of expiredTenants) {
      // Suspend tenant if subscription expired
      tenant.status = TenantStatus.SUSPENDED;
      await this.tenantRepository.save(tenant);

      // TODO: Send notification email
      this.logger.warn(`Tenant ${tenant.code} subscription expired and suspended`);
    }

    return {
      checked: expiredTenants.length,
      suspended: expiredTenants.map((t) => t.code),
    };
  }

  /**
   * Get subscription history (placeholder for future implementation)
   */
  async getSubscriptionHistory(user: User) {
    // TODO: Implement subscription history tracking
    // This would require a separate subscription_history table

    return {
      tenantId: user.tenantId,
      history: [],
      message: 'Subscription history tracking to be implemented',
    };
  }
}

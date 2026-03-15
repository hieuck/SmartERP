/**
 * Tenant Factory
 * Generate test tenant data
 */

import { Tenant } from '@core/tenant/entities/tenant.entity';
import { SubscriptionPlan } from '@core/tenant/enums/subscription-plan.enum';
import { TenantStatus } from '@core/tenant/enums/tenant-status.enum';

let tenantIdCounter = 1;

export const createMockTenant = (overrides?: Partial<Tenant>): Tenant => {
  const id = `tenant-${tenantIdCounter++}`;

  return {
    id,
    name: `Test Company ${tenantIdCounter}`,
    subdomain: `company${tenantIdCounter}`,
    status: TenantStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    trialEndDate: null,
    maxUsers: 50,
    currentUsers: 1,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Tenant;
};

export const createMockTenants = (count: number, overrides?: Partial<Tenant>): Tenant[] => {
  return Array.from({ length: count }, () => createMockTenant(overrides));
};

export const resetTenantFactory = () => {
  tenantIdCounter = 1;
};

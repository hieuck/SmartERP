import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { Tenant } from './entities/tenant.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { SubscriptionPlan } from './enums/subscription-plan.enum';
import { BillingCycle } from './enums/billing-cycle.enum';
import { TenantStatus } from './enums/tenant-status.enum';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'admin@test.com',
    role: 'admin',
  };

  const mockTenant: Tenant = {
    id: 'tenant-1',
    code: 'TEST001',
    name: 'Test Company',
    domain: null,
    logo: null,
    status: TenantStatus.ACTIVE,
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
    subscriptionPlan: SubscriptionPlan.FREE,
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    maxUsers: 1,
    maxStorage: 1073741824,

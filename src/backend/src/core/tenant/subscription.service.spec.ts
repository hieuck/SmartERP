import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { Tenant } from './entities/tenant.entity';
import { PermissionService } from '@/common/security/permission.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: getRepositoryToken(Tenant), useValue: { findOne: jest.fn() } },
        { provide: PermissionService, useValue: {} },
      ],
    }).compile();
    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPricing', () => {
    it('should return pricing for all plans', () => {
      const pricing = service.getPricing();
      expect(pricing.plans).toHaveLength(4);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CrmService } from './crm.service';
import { Lead } from './entities/lead.entity';
import { Opportunity } from './entities/opportunity.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { LeadStatus, OpportunityStage } from './enums';

describe('CrmService', () => {
  let service: CrmService;
  let leadRepository: jest.Mocked<Repository<Lead>>;
  let opportunityRepository: jest.Mocked<Repository<Opportunity>>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;
  let secureLeadRepo: any;
  let secureOpportunityRepo: any;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockLead: Lead = {
    id: 'lead-123',
    tenantId: 'tenant-123',
    name: 'John Doe',
    company: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+84901234567',
    status: LeadStatus.NEW,
    source: 'website' as any,
    estimatedValue: 10000,
    notes: 'Interested in product A',
    assignedTo: 'user-456',
    convertedToCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockOpportunity: Opportunity = {
    id: 'opp-123',
    tenantId: 'tenant-123',
    name: 'Deal with Acme Corp',
    customerId: 'customer-123',
    amount: 50000,
    stage: OpportunityStage.PROSPECTING,
    probability: 20,
    expectedCloseDate: new Date('2026-06-30'),
    description: 'Large enterprise deal',
    assignedTo: 'user-456',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    leadRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    opportunityRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getOrSet: jest.fn(),
    } as any;

    permissionService = {
      checkPermission: jest.fn(),
      filterByTenant: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: getRepositoryToken(Lead), useValue: leadRepository },
        { provide: getRepositoryToken(Opportunity), useValue: opportunityRepository },
        { provide: CacheService, useValue: cacheService },
        { provide: PermissionService, useValue: permissionService },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
    secureLeadRepo = (service as any).secureLeadRepo;
    secureOpportunityRepo = (service as any).secureOpportunityRepo;

    // Mock SecureRepository methods
    secureLeadRepo.find = jest.fn();
    secureLeadRepo.findOne = jest.fn();
    secureLeadRepo.save = jest.fn();
    secureLeadRepo.remove = jest.fn();

    secureOpportunityRepo.find = jest.fn();
    secureOpportunityRepo.findOne = jest.fn();
    secureOpportunityRepo.save = jest.fn();
    secureOpportunityRepo.remove = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== LEADS TESTS ====================

  describe('findAllLeads', () => {
    it('should return all leads ordered by createdAt DESC', async () => {
      const leads = [mockLead, { ...mockLead, id: 'lead-456' }];
      secureLeadRepo.find.mockResolvedValue(leads);

      const result = await service.findAllLeads(mockUser);

      expect(result).toEqual(leads);
      expect(secureLeadRepo.find).toHaveBeenCalledWith(mockUser, {
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no leads exist', async () => {
      secureLeadRepo.find.mockResolvedValue([]);

      const result = await service.findAllLeads(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findLeadById', () => {
    it('should return lead from cache if available', async () => {
      cacheService.getOrSet.mockResolvedValue(mockLead);

      const result = await service.findLeadById(mockUser, 'lead-123');

      expect(result).toEqual(mockLead);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from database when cache miss', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureLeadRepo.findOne.mockResolvedValue(mockLead);

      const result = await service.findLeadById(mockUser, 'lead-123');

      expect(result).toEqual(mockLead);
    });

    it('should throw NotFoundException when lead not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureLeadRepo.findOne.mockResolvedValue(null);

      await expect(service.findLeadById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findLeadByEmail', () => {
    it('should return lead by email', async () => {
      secureLeadRepo.findOne.mockResolvedValue(mockLead);

      const result = await service.findLeadByEmail(mockUser, 'john@acme.com');

      expect(result).toEqual(mockLead);
      expect(secureLeadRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { email: 'john@acme.com' },
      });
    });

    it('should return null when email not found', async () => {
      secureLeadRepo.findOne.mockResolvedValue(null);

      const result = await service.findLeadByEmail(mockUser, 'notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createLead', () => {
    it('should create lead successfully', async () => {
      const createDto = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        company: 'Tech Corp',
      };
      secureLeadRepo.findOne.mockResolvedValue(null);
      secureLeadRepo.save.mockResolvedValue({ ...mockLead, ...createDto } as Lead);

      const result = await service.createLead(mockUser, createDto);

      expect(result.email).toBe('jane@example.com');
      expect(secureLeadRepo.save).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createDto = { name: 'Test', email: 'john@acme.com' };
      secureLeadRepo.findOne.mockResolvedValue(mockLead);

      await expect(service.createLead(mockUser, createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateLead', () => {
    it('should update lead successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockLead);
      secureLeadRepo.findOne.mockResolvedValue(null);
      const updated = { ...mockLead, name: 'Updated Name' };
      secureLeadRepo.save.mockResolvedValue(updated as Lead);

      const result = await service.updateLead(mockUser, 'lead-123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should check email uniqueness when updating email', async () => {
      cacheService.getOrSet.mockResolvedValue(mockLead);
      secureLeadRepo.findOne.mockResolvedValue({ ...mockLead, id: 'lead-456' } as Lead);

      await expect(
        service.updateLead(mockUser, 'lead-123', { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating same email', async () => {
      cacheService.getOrSet.mockResolvedValue(mockLead);
      secureLeadRepo.findOne.mockResolvedValue(null);
      secureLeadRepo.save.mockResolvedValue(mockLead);

      const result = await service.updateLead(mockUser, 'lead-123', { email: 'john@acme.com' });

      expect(result).toBeDefined();
    });
  });

  describe('deleteLead', () => {
    it('should delete lead successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockLead);
      secureLeadRepo.remove.mockResolvedValue(mockLead);

      await service.deleteLead(mockUser, 'lead-123');

      expect(secureLeadRepo.remove).toHaveBeenCalledWith(mockUser, mockLead);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('findLeadsByStatus', () => {
    it('should return leads by status', async () => {
      const leads = [mockLead];
      secureLeadRepo.find.mockResolvedValue(leads);

      const result = await service.findLeadsByStatus(mockUser, LeadStatus.NEW);

      expect(result).toEqual(leads);
      expect(secureLeadRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { status: LeadStatus.NEW },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findLeadsByAssignee', () => {
    it('should return leads by assignee', async () => {
      const leads = [mockLead];
      secureLeadRepo.find.mockResolvedValue(leads);

      const result = await service.findLeadsByAssignee(mockUser, 'user-456');

      expect(result).toEqual(leads);
      expect(secureLeadRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { assignedTo: 'user-456' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('convertLead', () => {
    it('should convert lead successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockLead);
      const converted = {
        ...mockLead,
        status: LeadStatus.CONVERTED,
        convertedToCustomerId: 'customer-123',
      };
      secureLeadRepo.save.mockResolvedValue(converted as Lead);

      const result = await service.convertLead(mockUser, 'lead-123', 'customer-123');

      expect(result.status).toBe(LeadStatus.CONVERTED);
      expect(result.convertedToCustomerId).toBe('customer-123');
    });

    it('should throw BadRequestException when lead already converted', async () => {
      const convertedLead = { ...mockLead, status: LeadStatus.CONVERTED };
      cacheService.getOrSet.mockResolvedValue(convertedLead);

      await expect(service.convertLead(mockUser, 'lead-123', 'customer-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('qualifyLead', () => {
    it('should qualify lead successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockLead);
      const qualified = { ...mockLead, status: LeadStatus.QUALIFIED };
      secureLeadRepo.save.mockResolvedValue(qualified as Lead);

      const result = await service.qualifyLead(mockUser, 'lead-123');

      expect(result.status).toBe(LeadStatus.QUALIFIED);
    });
  });

  describe('disqualifyLead', () => {
    it('should disqualify lead successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockLead);
      const disqualified = { ...mockLead, status: LeadStatus.UNQUALIFIED };
      secureLeadRepo.save.mockResolvedValue(disqualified as Lead);

      const result = await service.disqualifyLead(mockUser, 'lead-123');

      expect(result.status).toBe(LeadStatus.UNQUALIFIED);
    });
  });

  describe('countLeads', () => {
    it('should return lead count', async () => {
      const leads = [mockLead, { ...mockLead, id: 'lead-456' }];
      secureLeadRepo.find.mockResolvedValue(leads);

      const result = await service.countLeads(mockUser);

      expect(result).toBe(2);
    });

    it('should return 0 when no leads exist', async () => {
      secureLeadRepo.find.mockResolvedValue([]);

      const result = await service.countLeads(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getLeadStatistics', () => {
    it('should calculate lead statistics correctly', async () => {
      const leads = [
        { ...mockLead, status: LeadStatus.NEW, estimatedValue: 10000 },
        { ...mockLead, id: 'lead-2', status: LeadStatus.QUALIFIED, estimatedValue: 20000 },
        { ...mockLead, id: 'lead-3', status: LeadStatus.CONVERTED, estimatedValue: 30000 },
        { ...mockLead, id: 'lead-4', status: LeadStatus.LOST, estimatedValue: 5000 },
      ];
      secureLeadRepo.find.mockResolvedValue(leads as Lead[]);

      const result = await service.getLeadStatistics(mockUser);

      expect(result.total).toBe(4);
      expect(result.newLeads).toBe(1);
      expect(result.qualified).toBe(1);
      expect(result.converted).toBe(1);
      expect(result.lost).toBe(1);
      expect(result.conversionRate).toBe(25); // 1/4 * 100
      expect(result.totalEstimatedValue).toBe(65000);
    });

    it('should return 0 conversion rate when no leads exist', async () => {
      secureLeadRepo.find.mockResolvedValue([]);

      const result = await service.getLeadStatistics(mockUser);

      expect(result.total).toBe(0);
      expect(result.conversionRate).toBe(0);
      expect(result.totalEstimatedValue).toBe(0);
    });

    it('should handle null estimatedValue', async () => {
      const leads = [{ ...mockLead, estimatedValue: null }];
      secureLeadRepo.find.mockResolvedValue(leads as Lead[]);

      const result = await service.getLeadStatistics(mockUser);

      expect(result.totalEstimatedValue).toBe(0);
    });
  });

  // ==================== OPPORTUNITIES TESTS ====================

  describe('findAllOpportunities', () => {
    it('should return all opportunities ordered by createdAt DESC', async () => {
      const opportunities = [mockOpportunity, { ...mockOpportunity, id: 'opp-456' }];
      secureOpportunityRepo.find.mockResolvedValue(opportunities);

      const result = await service.findAllOpportunities(mockUser);

      expect(result).toEqual(opportunities);
      expect(secureOpportunityRepo.find).toHaveBeenCalledWith(mockUser, {
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no opportunities exist', async () => {
      secureOpportunityRepo.find.mockResolvedValue([]);

      const result = await service.findAllOpportunities(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOpportunityById', () => {
    it('should return opportunity from cache if available', async () => {
      cacheService.getOrSet.mockResolvedValue(mockOpportunity);

      const result = await service.findOpportunityById(mockUser, 'opp-123');

      expect(result).toEqual(mockOpportunity);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from database when cache miss', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureOpportunityRepo.findOne.mockResolvedValue(mockOpportunity);

      const result = await service.findOpportunityById(mockUser, 'opp-123');

      expect(result).toEqual(mockOpportunity);
    });

    it('should throw NotFoundException when opportunity not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureOpportunityRepo.findOne.mockResolvedValue(null);

      await expect(service.findOpportunityById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createOpportunity', () => {
    it('should create opportunity successfully', async () => {
      const createDto = {
        name: 'New Deal',
        customerId: 'customer-123',
        amount: 75000,
        stage: OpportunityStage.PROSPECTING,
      };
      secureOpportunityRepo.save.mockResolvedValue({
        ...mockOpportunity,
        ...createDto,
      } as Opportunity);

      const result = await service.createOpportunity(mockUser, createDto);

      expect(result.name).toBe('New Deal');
      expect(result.amount).toBe(75000);
      expect(secureOpportunityRepo.save).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('updateOpportunity', () => {
    it('should update opportunity successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockOpportunity);
      const updated = { ...mockOpportunity, name: 'Updated Deal' };
      secureOpportunityRepo.save.mockResolvedValue(updated as Opportunity);

      const result = await service.updateOpportunity(mockUser, 'opp-123', { name: 'Updated Deal' });

      expect(result.name).toBe('Updated Deal');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteOpportunity', () => {
    it('should delete opportunity successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockOpportunity);
      secureOpportunityRepo.remove.mockResolvedValue(mockOpportunity);

      await service.deleteOpportunity(mockUser, 'opp-123');

      expect(secureOpportunityRepo.remove).toHaveBeenCalledWith(mockUser, mockOpportunity);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('findOpportunitiesByStage', () => {
    it('should return opportunities by stage', async () => {
      const opportunities = [mockOpportunity];
      secureOpportunityRepo.find.mockResolvedValue(opportunities);

      const result = await service.findOpportunitiesByStage(mockUser, OpportunityStage.PROSPECTING);

      expect(result).toEqual(opportunities);
      expect(secureOpportunityRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { stage: OpportunityStage.PROSPECTING },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOpportunitiesByCustomer', () => {
    it('should return opportunities by customer', async () => {
      const opportunities = [mockOpportunity];
      secureOpportunityRepo.find.mockResolvedValue(opportunities);

      const result = await service.findOpportunitiesByCustomer(mockUser, 'customer-123');

      expect(result).toEqual(opportunities);
      expect(secureOpportunityRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { customerId: 'customer-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('moveOpportunityStage', () => {
    it('should move opportunity to new stage', async () => {
      cacheService.getOrSet.mockResolvedValue(mockOpportunity);
      const moved = { ...mockOpportunity, stage: OpportunityStage.QUALIFICATION };
      secureOpportunityRepo.save.mockResolvedValue(moved as Opportunity);

      const result = await service.moveOpportunityStage(
        mockUser,
        'opp-123',
        OpportunityStage.QUALIFICATION,
      );

      expect(result.stage).toBe(OpportunityStage.QUALIFICATION);
    });
  });

  describe('winOpportunity', () => {
    it('should mark opportunity as won', async () => {
      cacheService.getOrSet.mockResolvedValue(mockOpportunity);
      const won = { ...mockOpportunity, stage: OpportunityStage.CLOSED_WON, probability: 100 };
      secureOpportunityRepo.save.mockResolvedValue(won as Opportunity);

      const result = await service.winOpportunity(mockUser, 'opp-123');

      expect(result.stage).toBe(OpportunityStage.CLOSED_WON);
      expect(result.probability).toBe(100);
    });
  });

  describe('loseOpportunity', () => {
    it('should mark opportunity as lost', async () => {
      cacheService.getOrSet.mockResolvedValue(mockOpportunity);
      const lost = { ...mockOpportunity, stage: OpportunityStage.CLOSED_LOST, probability: 0 };
      secureOpportunityRepo.save.mockResolvedValue(lost as Opportunity);

      const result = await service.loseOpportunity(mockUser, 'opp-123');

      expect(result.stage).toBe(OpportunityStage.CLOSED_LOST);
      expect(result.probability).toBe(0);
    });
  });

  describe('countOpportunities', () => {
    it('should return opportunity count', async () => {
      const opportunities = [mockOpportunity, { ...mockOpportunity, id: 'opp-456' }];
      secureOpportunityRepo.find.mockResolvedValue(opportunities);

      const result = await service.countOpportunities(mockUser);

      expect(result).toBe(2);
    });

    it('should return 0 when no opportunities exist', async () => {
      secureOpportunityRepo.find.mockResolvedValue([]);

      const result = await service.countOpportunities(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getOpportunityStatistics', () => {
    it('should calculate opportunity statistics correctly', async () => {
      const opportunities = [
        { ...mockOpportunity, stage: OpportunityStage.PROSPECTING, amount: 10000 },
        { ...mockOpportunity, id: 'opp-2', stage: OpportunityStage.QUALIFICATION, amount: 20000 },
        { ...mockOpportunity, id: 'opp-3', stage: OpportunityStage.CLOSED_WON, amount: 30000 },
        { ...mockOpportunity, id: 'opp-4', stage: OpportunityStage.CLOSED_LOST, amount: 5000 },
      ];
      secureOpportunityRepo.find.mockResolvedValue(opportunities as Opportunity[]);

      const result = await service.getOpportunityStatistics(mockUser);

      expect(result.total).toBe(4);
      expect(result.active).toBe(2); // PROSPECTING + QUALIFICATION
      expect(result.won).toBe(1);
      expect(result.lost).toBe(1);
      expect(result.winRate).toBe(25); // 1/4 * 100
      expect(result.totalValue).toBe(65000);
      expect(result.wonValue).toBe(30000);
    });

    it('should return 0 win rate when no opportunities exist', async () => {
      secureOpportunityRepo.find.mockResolvedValue([]);

      const result = await service.getOpportunityStatistics(mockUser);

      expect(result.total).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.wonValue).toBe(0);
    });

    it('should handle string amount values', async () => {
      const opportunities = [{ ...mockOpportunity, amount: '50000' as any }];
      secureOpportunityRepo.find.mockResolvedValue(opportunities as Opportunity[]);

      const result = await service.getOpportunityStatistics(mockUser);

      expect(result.totalValue).toBe(50000);
    });
  });

  describe('getPipeline', () => {
    it('should group opportunities by stage with summary', async () => {
      const opportunities = [
        { ...mockOpportunity, stage: OpportunityStage.PROSPECTING, amount: 10000 },
        { ...mockOpportunity, id: 'opp-2', stage: OpportunityStage.PROSPECTING, amount: 15000 },
        { ...mockOpportunity, id: 'opp-3', stage: OpportunityStage.QUALIFICATION, amount: 20000 },
        { ...mockOpportunity, id: 'opp-4', stage: OpportunityStage.PROPOSAL, amount: 30000 },
        { ...mockOpportunity, id: 'opp-5', stage: OpportunityStage.NEGOTIATION, amount: 40000 },
        { ...mockOpportunity, id: 'opp-6', stage: OpportunityStage.CLOSED_WON, amount: 50000 },
        { ...mockOpportunity, id: 'opp-7', stage: OpportunityStage.CLOSED_LOST, amount: 5000 },
      ];
      secureOpportunityRepo.find.mockResolvedValue(opportunities as Opportunity[]);

      const result = await service.getPipeline(mockUser);

      expect(result.pipeline.prospecting).toHaveLength(2);
      expect(result.pipeline.qualification).toHaveLength(1);
      expect(result.pipeline.proposal).toHaveLength(1);
      expect(result.pipeline.negotiation).toHaveLength(1);
      expect(result.pipeline.closedWon).toHaveLength(1);
      expect(result.pipeline.closedLost).toHaveLength(1);

      expect(result.summary.prospecting.count).toBe(2);
      expect(result.summary.prospecting.value).toBe(25000);
      expect(result.summary.qualification.count).toBe(1);
      expect(result.summary.qualification.value).toBe(20000);
      expect(result.summary.closedWon.count).toBe(1);
      expect(result.summary.closedWon.value).toBe(50000);
    });

    it('should return empty pipeline when no opportunities exist', async () => {
      secureOpportunityRepo.find.mockResolvedValue([]);

      const result = await service.getPipeline(mockUser);

      expect(result.pipeline.prospecting).toHaveLength(0);
      expect(result.summary.prospecting.count).toBe(0);
      expect(result.summary.prospecting.value).toBe(0);
    });
  });
});

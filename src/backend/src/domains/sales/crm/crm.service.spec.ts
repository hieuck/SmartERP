import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lead } from '../entities/lead.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { LeadStatus } from '../enums/lead-status.enum';
import { OpportunityStage } from '../enums/opportunity-stage.enum';
import { CrmService } from './crm.service';

describe('CrmService', () => {
  let service: CrmService;

  const mockLeadRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  };

  const mockOpportunityRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  const mockPermissionService = {
    checkPermission: jest.fn().mockResolvedValue(true),
    hasRole: jest.fn().mockReturnValue(true),
    canAccessTenant: jest.fn().mockReturnValue(true),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
    buildSecureQuery: jest.fn((user, baseWhere) => ({
      ...baseWhere,
      tenantId: user.tenantId,
    })),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        {
          provide: getRepositoryToken(Lead),
          useValue: mockLeadRepository,
        },
        {
          provide: getRepositoryToken(Opportunity),
          useValue: mockOpportunityRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Leads Management', () => {
    it('should find all leads', async () => {
      const mockLeads = [{ id: '1', email: 'lead@test.com' }];
      mockLeadRepository.find.mockResolvedValue(mockLeads);

      const result = await service.findAllLeads(mockUser);

      expect(result).toEqual(mockLeads);
    });

    it('should find lead by id', async () => {
      const mockLead = { id: '1', email: 'lead@test.com' };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);

      const result = await service.findLeadById(mockUser, '1');

      expect(result).toEqual(mockLead);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockLeadRepository.findOne.mockResolvedValue(null);

      await expect(service.findLeadById(mockUser, '999')).rejects.toThrow(NotFoundException);
    });

    it('should create lead', async () => {
      const leadData = { email: 'new@lead.com', name: 'John Doe' };
      mockLeadRepository.findOne.mockResolvedValue(null);
      mockLeadRepository.create.mockReturnValue(leadData);
      mockLeadRepository.save.mockResolvedValue(leadData);

      const result = await service.createLead(mockUser, leadData);

      expect(result).toEqual(leadData);
    });

    it('should throw ConflictException if email exists', async () => {
      const leadData = { email: 'existing@lead.com' };
      mockLeadRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.createLead(mockUser, leadData)).rejects.toThrow(ConflictException);
    });

    it('should convert lead', async () => {
      const mockLead = { id: '1', status: LeadStatus.QUALIFIED };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);
      mockLeadRepository.save.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CONVERTED,
        convertedToCustomerId: 'customer-1',
      });

      const result = await service.convertLead(mockUser, '1', 'customer-1');

      expect(result.status).toBe(LeadStatus.CONVERTED);
      expect(result.convertedToCustomerId).toBe('customer-1');
    });

    it('should throw error if lead already converted', async () => {
      const mockLead = { id: '1', status: LeadStatus.CONVERTED };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);

      await expect(service.convertLead(mockUser, '1', 'customer-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should qualify lead', async () => {
      const mockLead = { id: '1', status: LeadStatus.NEW };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);
      mockLeadRepository.save.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.QUALIFIED,
      });

      const result = await service.qualifyLead(mockUser, '1');

      expect(result.status).toBe(LeadStatus.QUALIFIED);
    });

    it('should disqualify lead', async () => {
      const mockLead = { id: '1', status: LeadStatus.NEW };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);
      mockLeadRepository.save.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.UNQUALIFIED,
      });

      const result = await service.disqualifyLead(mockUser, '1');

      expect(result.status).toBe(LeadStatus.UNQUALIFIED);
    });

    it('should find lead by email', async () => {
      const mockLead = { id: '1', email: 'test@example.com' };
      mockLeadRepository.findOne.mockResolvedValue(mockLead);

      const result = await service.findLeadByEmail(mockUser, 'test@example.com');

      expect(result).toEqual(mockLead);
      expect(mockLeadRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if lead email not found', async () => {
      mockLeadRepository.findOne.mockResolvedValue(null);

      const result = await service.findLeadByEmail(mockUser, 'notfound@example.com');

      expect(result).toBeNull();
    });

    it('should update lead', async () => {
      const existingLead = { id: '1', email: 'old@example.com', name: 'John Doe' };
      const updateData = { name: 'Jane Doe' };
      mockCacheService.getOrSet.mockResolvedValue(existingLead);
      mockLeadRepository.save.mockResolvedValue({ ...existingLead, ...updateData });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateLead(mockUser, '1', updateData);

      expect(result.name).toBe('Jane Doe');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should update lead email if unique', async () => {
      const existingLead = { id: '1', email: 'old@example.com' };
      const updateData = { email: 'new@example.com' };
      mockCacheService.getOrSet.mockResolvedValue(existingLead);
      mockLeadRepository.findOne.mockResolvedValue(null); // Email not taken
      mockLeadRepository.save.mockResolvedValue({ ...existingLead, ...updateData });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateLead(mockUser, '1', updateData);

      expect(result.email).toBe('new@example.com');
    });

    it('should throw ConflictException if updated email exists', async () => {
      const existingLead = { id: '1', email: 'old@example.com' };
      const updateData = { email: 'taken@example.com' };
      mockCacheService.getOrSet.mockResolvedValue(existingLead);
      mockLeadRepository.findOne.mockResolvedValue({ id: '2', email: 'taken@example.com' });

      await expect(service.updateLead(mockUser, '1', updateData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should delete lead', async () => {
      const mockLead = { id: '1', email: 'test@example.com' };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);
      mockLeadRepository.findOne.mockResolvedValue(mockLead);
      mockLeadRepository.remove.mockResolvedValue(mockLead);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteLead(mockUser, '1');

      expect(mockLeadRepository.remove).toHaveBeenCalledWith(mockLead);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find leads by status', async () => {
      const mockLeads = [
        { id: '1', status: LeadStatus.QUALIFIED },
        { id: '2', status: LeadStatus.QUALIFIED },
      ];
      mockLeadRepository.find.mockResolvedValue(mockLeads);

      const result = await service.findLeadsByStatus(mockUser, LeadStatus.QUALIFIED);

      expect(result).toEqual(mockLeads);
      expect(mockLeadRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', status: LeadStatus.QUALIFIED },
        order: { createdAt: 'DESC' },
      });
    });

    it('should find leads by assignee', async () => {
      const mockLeads = [
        { id: '1', assignedTo: 'user-1' },
        { id: '2', assignedTo: 'user-1' },
      ];
      mockLeadRepository.find.mockResolvedValue(mockLeads);

      const result = await service.findLeadsByAssignee(mockUser, 'user-1');

      expect(result).toEqual(mockLeads);
      expect(mockLeadRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', assignedTo: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should count leads', async () => {
      const mockLeads = [{ id: '1' }, { id: '2' }];
      mockLeadRepository.find.mockResolvedValue(mockLeads);

      const result = await service.countLeads(mockUser);

      expect(result).toBe(2);
    });

    it('should get lead statistics', async () => {
      const mockLeads = [
        { id: '1', status: LeadStatus.NEW, estimatedValue: 1000 },
        { id: '2', status: LeadStatus.QUALIFIED, estimatedValue: 2000 },
        { id: '3', status: LeadStatus.CONVERTED, estimatedValue: 3000 },
        { id: '4', status: LeadStatus.LOST, estimatedValue: 500 },
      ];
      mockLeadRepository.find.mockResolvedValue(mockLeads);

      const result = await service.getLeadStatistics(mockUser);

      expect(result.total).toBe(4);
      expect(result.newLeads).toBe(1);
      expect(result.qualified).toBe(1);
      expect(result.converted).toBe(1);
      expect(result.lost).toBe(1);
      expect(result.conversionRate).toBe(25);
      expect(result.totalEstimatedValue).toBe(6500);
    });
  });

  describe('Opportunities Management', () => {
    it('should find all opportunities', async () => {
      const mockOpportunities = [{ id: '1', name: 'Deal 1' }];
      mockOpportunityRepository.find.mockResolvedValue(mockOpportunities);

      const result = await service.findAllOpportunities(mockUser);

      expect(result).toEqual(mockOpportunities);
    });

    it('should find opportunity by id', async () => {
      const mockOpportunity = { id: '1', name: 'Deal 1' };
      mockCacheService.getOrSet.mockResolvedValue(mockOpportunity);

      const result = await service.findOpportunityById(mockUser, '1');

      expect(result).toEqual(mockOpportunity);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if opportunity not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockOpportunityRepository.findOne.mockResolvedValue(null);

      await expect(service.findOpportunityById(mockUser, '999')).rejects.toThrow(NotFoundException);
    });

    it('should move opportunity stage', async () => {
      const mockOpportunity = {
        id: '1',
        stage: OpportunityStage.PROSPECTING,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockOpportunity);
      mockOpportunityRepository.save.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.QUALIFICATION,
      });

      const result = await service.moveOpportunityStage(
        mockUser,
        '1',
        OpportunityStage.QUALIFICATION,
      );

      expect(result.stage).toBe(OpportunityStage.QUALIFICATION);
    });

    it('should win opportunity', async () => {
      const mockOpportunity = {
        id: '1',
        stage: OpportunityStage.NEGOTIATION,
        probability: 75,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockOpportunity);
      mockOpportunityRepository.save.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.CLOSED_WON,
        probability: 100,
      });

      const result = await service.winOpportunity(mockUser, '1');

      expect(result.stage).toBe(OpportunityStage.CLOSED_WON);
      expect(result.probability).toBe(100);
    });

    it('should lose opportunity', async () => {
      const mockOpportunity = {
        id: '1',
        stage: OpportunityStage.NEGOTIATION,
        probability: 75,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockOpportunity);
      mockOpportunityRepository.save.mockResolvedValue({
        ...mockOpportunity,
        stage: OpportunityStage.CLOSED_LOST,
        probability: 0,
      });

      const result = await service.loseOpportunity(mockUser, '1');

      expect(result.stage).toBe(OpportunityStage.CLOSED_LOST);
      expect(result.probability).toBe(0);
    });

    it('should create opportunity', async () => {
      const opportunityData = { name: 'New Deal', amount: 5000 };
      mockOpportunityRepository.save.mockResolvedValue({
        ...opportunityData,
        tenantId: 'tenant-1',
        createdBy: 'user-123',
      });

      const result = await service.createOpportunity(mockUser, opportunityData);

      expect(result.name).toBe('New Deal');
      expect(result.amount).toBe(5000);
    });

    it('should update opportunity', async () => {
      const existingOpportunity = { id: '1', name: 'Old Deal', amount: 1000 };
      const updateData = { amount: 2000 };
      mockCacheService.getOrSet.mockResolvedValue(existingOpportunity);
      mockOpportunityRepository.save.mockResolvedValue({ ...existingOpportunity, ...updateData });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateOpportunity(mockUser, '1', updateData);

      expect(result.amount).toBe(2000);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete opportunity', async () => {
      const mockOpportunity = { id: '1', name: 'Deal 1' };
      mockCacheService.getOrSet.mockResolvedValue(mockOpportunity);
      mockOpportunityRepository.findOne.mockResolvedValue(mockOpportunity);
      mockOpportunityRepository.remove.mockResolvedValue(mockOpportunity);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteOpportunity(mockUser, '1');

      expect(mockOpportunityRepository.remove).toHaveBeenCalledWith(mockOpportunity);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find opportunities by stage', async () => {
      const mockOpportunities = [
        { id: '1', stage: OpportunityStage.PROPOSAL },
        { id: '2', stage: OpportunityStage.PROPOSAL },
      ];
      mockOpportunityRepository.find.mockResolvedValue(mockOpportunities);

      const result = await service.findOpportunitiesByStage(mockUser, OpportunityStage.PROPOSAL);

      expect(result).toEqual(mockOpportunities);
      expect(mockOpportunityRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', stage: OpportunityStage.PROPOSAL },
        order: { createdAt: 'DESC' },
      });
    });

    it('should find opportunities by customer', async () => {
      const mockOpportunities = [
        { id: '1', customerId: 'customer-1' },
        { id: '2', customerId: 'customer-1' },
      ];
      mockOpportunityRepository.find.mockResolvedValue(mockOpportunities);

      const result = await service.findOpportunitiesByCustomer(mockUser, 'customer-1');

      expect(result).toEqual(mockOpportunities);
      expect(mockOpportunityRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', customerId: 'customer-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should count opportunities', async () => {
      const mockOpportunities = [{ id: '1' }, { id: '2' }];
      mockOpportunityRepository.find.mockResolvedValue(mockOpportunities);

      const result = await service.countOpportunities(mockUser);

      expect(result).toBe(2);
    });

    it('should get opportunity statistics', async () => {
      const mockOpportunities = [
        {
          id: '1',
          stage: OpportunityStage.PROSPECTING,
          amount: 1000,
        },
        {
          id: '2',
          stage: OpportunityStage.CLOSED_WON,
          amount: 2000,
        },
        {
          id: '3',
          stage: OpportunityStage.CLOSED_WON,
          amount: 3000,
        },
        {
          id: '4',
          stage: OpportunityStage.CLOSED_LOST,
          amount: 1500,
        },
      ];
      mockOpportunityRepository.find.mockResolvedValue(mockOpportunities);

      const result = await service.getOpportunityStatistics(mockUser);

      expect(result.total).toBe(4);
      expect(result.active).toBe(1);
      expect(result.won).toBe(2);
      expect(result.lost).toBe(1);
      expect(result.winRate).toBe(50);
      expect(result.totalValue).toBe(7500);
      expect(result.wonValue).toBe(5000);
    });

    it('should get pipeline', async () => {
      const mockOpportunities = [
        {
          id: '1',
          stage: OpportunityStage.PROSPECTING,
          amount: 1000,
        },
        {
          id: '2',
          stage: OpportunityStage.QUALIFICATION,
          amount: 2000,
        },
        {
          id: '3',
          stage: OpportunityStage.CLOSED_WON,
          amount: 3000,
        },
      ];
      mockOpportunityRepository.find.mockResolvedValue(mockOpportunities);

      const result = await service.getPipeline(mockUser);

      expect(result.pipeline.prospecting).toHaveLength(1);
      expect(result.pipeline.qualification).toHaveLength(1);
      expect(result.pipeline.closedWon).toHaveLength(1);
      expect(result.summary.prospecting.count).toBe(1);
      expect(result.summary.prospecting.value).toBe(1000);
    });
  });
});

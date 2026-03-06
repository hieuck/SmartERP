import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CrmService } from './crm.service';
import { Lead, LeadStatus } from './entities/lead.entity';
import { Opportunity, OpportunityStage } from './entities/opportunity.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('CrmService', () => {
  let service: CrmService;

  const mockLeadRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
  };

  const mockOpportunityRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

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

      const result = await service.findAllLeads('tenant-1');

      expect(result).toEqual(mockLeads);
    });

    it('should find lead by id', async () => {
      const mockLead = { id: '1', email: 'lead@test.com' };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);

      const result = await service.findLeadById('tenant-1', '1');

      expect(result).toEqual(mockLead);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if lead not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockLeadRepository.findOne.mockResolvedValue(null);

      await expect(service.findLeadById('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });

    it('should create lead', async () => {
      const leadData = { email: 'new@lead.com', firstName: 'John' };
      mockLeadRepository.findOne.mockResolvedValue(null);
      mockLeadRepository.create.mockReturnValue(leadData);
      mockLeadRepository.save.mockResolvedValue(leadData);

      const result = await service.createLead('tenant-1', leadData);

      expect(result).toEqual(leadData);
    });

    it('should throw ConflictException if email exists', async () => {
      const leadData = { email: 'existing@lead.com' };
      mockLeadRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.createLead('tenant-1', leadData)).rejects.toThrow(ConflictException);
    });

    it('should convert lead', async () => {
      const mockLead = { id: '1', status: LeadStatus.QUALIFIED };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);
      mockLeadRepository.save.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CONVERTED,
        convertedToCustomerId: 'customer-1',
      });

      const result = await service.convertLead('tenant-1', '1', 'customer-1');

      expect(result.status).toBe(LeadStatus.CONVERTED);
      expect(result.convertedToCustomerId).toBe('customer-1');
    });

    it('should throw error if lead already converted', async () => {
      const mockLead = { id: '1', status: LeadStatus.CONVERTED };
      mockCacheService.getOrSet.mockResolvedValue(mockLead);

      await expect(service.convertLead('tenant-1', '1', 'customer-1')).rejects.toThrow(
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

      const result = await service.qualifyLead('tenant-1', '1');

      expect(result.status).toBe(LeadStatus.QUALIFIED);
    });

    it('should get lead statistics', async () => {
      const mockLeads = [
        { id: '1', status: LeadStatus.NEW, estimatedValue: 1000 },
        { id: '2', status: LeadStatus.QUALIFIED, estimatedValue: 2000 },
        { id: '3', status: LeadStatus.CONVERTED, estimatedValue: 3000 },
        { id: '4', status: LeadStatus.LOST, estimatedValue: 500 },
      ];
      mockLeadRepository.find.mockResolvedValue(mockLeads);

      const result = await service.getLeadStatistics('tenant-1');

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

      const result = await service.findAllOpportunities('tenant-1');

      expect(result).toEqual(mockOpportunities);
    });

    it('should find opportunity by id', async () => {
      const mockOpportunity = { id: '1', name: 'Deal 1' };
      mockCacheService.getOrSet.mockResolvedValue(mockOpportunity);

      const result = await service.findOpportunityById('tenant-1', '1');

      expect(result).toEqual(mockOpportunity);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if opportunity not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockOpportunityRepository.findOne.mockResolvedValue(null);

      await expect(service.findOpportunityById('tenant-1', '999')).rejects.toThrow(
        NotFoundException,
      );
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
        'tenant-1',
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

      const result = await service.winOpportunity('tenant-1', '1');

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

      const result = await service.loseOpportunity('tenant-1', '1');

      expect(result.stage).toBe(OpportunityStage.CLOSED_LOST);
      expect(result.probability).toBe(0);
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

      const result = await service.getOpportunityStatistics('tenant-1');

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

      const result = await service.getPipeline('tenant-1');

      expect(result.pipeline.prospecting).toHaveLength(1);
      expect(result.pipeline.qualification).toHaveLength(1);
      expect(result.pipeline.closedWon).toHaveLength(1);
      expect(result.summary.prospecting.count).toBe(1);
      expect(result.summary.prospecting.value).toBe(1000);
    });
  });
});

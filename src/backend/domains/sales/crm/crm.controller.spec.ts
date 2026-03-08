import { Test, TestingModule } from '@nestjs/testing';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { createMockUser } from '@/common/test/test-helpers';

describe('CrmController', () => {
  let controller: CrmController;
  let service: CrmService;

  const mockCrmService = {
    findAllLeads: jest.fn(),
    findLeadById: jest.fn(),
    createLead: jest.fn(),
    updateLead: jest.fn(),
    deleteLead: jest.fn(),
    convertLead: jest.fn(),
    findAllOpportunities: jest.fn(),
    findOpportunityById: jest.fn(),
    createOpportunity: jest.fn(),
    updateOpportunity: jest.fn(),
    deleteOpportunity: jest.fn(),
    getPipeline: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrmController],
      providers: [
        {
          provide: CrmService,
          useValue: mockCrmService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<CrmController>(CrmController);
    service = module.get<CrmService>(CrmService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Lead Endpoints', () => {
    describe('findAllLeads', () => {
      it('should return all leads', async () => {
        
        const mockLeads = [
          { id: '1', name: 'Lead 1', status: 'new' },
          { id: '2', name: 'Lead 2', status: 'contacted' },
        ];
        mockCrmService.findAllLeads.mockResolvedValue(mockLeads);

        const result = await controller.findAllLeads(mockUser);

        expect(result).toEqual(mockLeads);
        expect(service.findAllLeads).toHaveBeenCalledWith(mockUser);
      });
    });

    describe('findLeadById', () => {
      it('should return a lead by id', async () => {
        
        const leadId = 'lead-1';
        const mockLead = { id: leadId, name: 'Lead 1', status: 'new' };
        mockCrmService.findLeadById.mockResolvedValue(mockLead);

        const result = await controller.findLeadById(mockUser, leadId);

        expect(result).toEqual(mockLead);
        expect(service.findLeadById).toHaveBeenCalledWith(mockUser, leadId);
      });
    });

    describe('createLead', () => {
      it('should create a new lead', async () => {
        
        const createDto = { name: 'New Lead', email: 'lead@example.com' };
        const mockLead = { id: 'lead-1', ...createDto };
        mockCrmService.createLead.mockResolvedValue(mockLead);

        const result = await controller.createLead(mockUser, createDto as any);

        expect(result).toEqual(mockLead);
        expect(service.createLead).toHaveBeenCalledWith(mockUser, createDto);
      });
    });

    describe('updateLead', () => {
      it('should update a lead', async () => {
        
        const leadId = 'lead-1';
        const updateDto = { status: 'qualified' };
        const mockLead = { id: leadId, name: 'Lead 1', status: 'qualified' };
        mockCrmService.updateLead.mockResolvedValue(mockLead);

        const result = await controller.updateLead(mockUser, leadId, updateDto as any);

        expect(result).toEqual(mockLead);
        expect(service.updateLead).toHaveBeenCalledWith(mockUser, leadId, updateDto);
      });
    });

    describe('deleteLead', () => {
      it('should delete a lead', async () => {
        
        const leadId = 'lead-1';
        mockCrmService.deleteLead.mockResolvedValue(undefined);

        await controller.deleteLead(mockUser, leadId);

        expect(service.deleteLead).toHaveBeenCalledWith(mockUser, leadId);
      });
    });

    describe('convertLead', () => {
      it('should convert a lead to customer', async () => {
        
        const leadId = 'lead-1';
        const customerId = 'customer-1';
        const mockLead = { id: leadId, status: 'converted', customerId };
        mockCrmService.convertLead.mockResolvedValue(mockLead);

        const result = await controller.convertLead(mockUser, leadId, customerId);

        expect(result).toEqual(mockLead);
        expect(service.convertLead).toHaveBeenCalledWith(mockUser, leadId, customerId);
      });
    });
  });

  describe('Opportunity Endpoints', () => {
    describe('findAllOpportunities', () => {
      it('should return all opportunities', async () => {
        
        const mockOpportunities = [
          { id: '1', name: 'Opp 1', stage: 'prospecting' },
          { id: '2', name: 'Opp 2', stage: 'negotiation' },
        ];
        mockCrmService.findAllOpportunities.mockResolvedValue(mockOpportunities);

        const result = await controller.findAllOpportunities(mockUser);

        expect(result).toEqual(mockOpportunities);
        expect(service.findAllOpportunities).toHaveBeenCalledWith(mockUser);
      });
    });

    describe('findOpportunityById', () => {
      it('should return an opportunity by id', async () => {
        
        const oppId = 'opp-1';
        const mockOpp = { id: oppId, name: 'Opp 1', stage: 'prospecting' };
        mockCrmService.findOpportunityById.mockResolvedValue(mockOpp);

        const result = await controller.findOpportunityById(mockUser, oppId);

        expect(result).toEqual(mockOpp);
        expect(service.findOpportunityById).toHaveBeenCalledWith(mockUser, oppId);
      });
    });

    describe('createOpportunity', () => {
      it('should create a new opportunity', async () => {
        
        const createDto = { name: 'New Opp', value: 10000 };
        const mockOpp = { id: 'opp-1', ...createDto };
        mockCrmService.createOpportunity.mockResolvedValue(mockOpp);

        const result = await controller.createOpportunity(mockUser, createDto as any);

        expect(result).toEqual(mockOpp);
        expect(service.createOpportunity).toHaveBeenCalledWith(mockUser, createDto);
      });
    });

    describe('updateOpportunity', () => {
      it('should update an opportunity', async () => {
        
        const oppId = 'opp-1';
        const updateDto = { stage: 'closed-won' };
        const mockOpp = { id: oppId, name: 'Opp 1', stage: 'closed-won' };
        mockCrmService.updateOpportunity.mockResolvedValue(mockOpp);

        const result = await controller.updateOpportunity(mockUser, oppId, updateDto as any);

        expect(result).toEqual(mockOpp);
        expect(service.updateOpportunity).toHaveBeenCalledWith(mockUser, oppId, updateDto);
      });
    });

    describe('deleteOpportunity', () => {
      it('should delete an opportunity', async () => {
        
        const oppId = 'opp-1';
        mockCrmService.deleteOpportunity.mockResolvedValue(undefined);

        await controller.deleteOpportunity(mockUser, oppId);

        expect(service.deleteOpportunity).toHaveBeenCalledWith(mockUser, oppId);
      });
    });

    describe('getPipeline', () => {
      it('should return pipeline data', async () => {
        
        const mockPipeline = {
          stages: ['prospecting', 'qualification', 'negotiation', 'closed'],
          opportunities: { prospecting: 5, qualification: 3, negotiation: 2, closed: 10 },
        };
        mockCrmService.getPipeline.mockResolvedValue(mockPipeline);

        const result = await controller.getPipeline(mockUser);

        expect(result).toEqual(mockPipeline);
        expect(service.getPipeline).toHaveBeenCalledWith(mockUser);
      });
    });
  });
});


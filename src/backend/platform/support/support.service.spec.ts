import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SupportService } from './support.service';
import { Ticket, TicketChannel, TicketSatisfactionRating } from './entities/ticket.entity';
import { SLA } from './entities/sla.entity';
import { AssignmentRule, AssignmentStrategy } from './entities/assignment-rule.entity';
import { KnowledgeBaseArticle, ArticleStatus } from './entities/knowledge-base-article.entity';
import { CannedResponse } from './entities/canned-response.entity';
import { IssueStatus, IssuePriority, IssueType } from '../issue-tracking/entities/issue.entity';
import { User } from '../../core/user/entities/user.entity';

const createMockUser = (): User => ({
  id: 'user-123',
  tenantId: 'tenant-123',
  email: 'test@example.com',
  password: 'hashed',
  role: 'user',
  roles: ['user'],
  status: 'active',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
  });

describe('SupportService', () => {
  let service: SupportService;
  let ticketRepository: Repository<Ticket>;
  let slaRepository: Repository<SLA>;
  let assignmentRuleRepository: Repository<AssignmentRule>;
  let articleRepository: Repository<KnowledgeBaseArticle>;
  let cannedResponseRepository: Repository<CannedResponse>;

  const mockUser = createMockUser();

  const mockTicket: Partial<Ticket> = {
    id: 'ticket-1',
    tenantId: mockUser.tenantId,
    title: 'Test Ticket',
    description: 'Test Description',
    status: IssueStatus.NEW,
    priority: IssuePriority.MEDIUM,
    type: IssueType.TASK,
    reporterId: mockUser.id,
    customerId: mockUser.id,
    channel: TicketChannel.PORTAL
  };

  const mockSLA: Partial<SLA> = {
    id: 'sla-1',
    tenantId: mockUser.tenantId,
    name: 'Standard SLA',
    priority: IssuePriority.MEDIUM,
    responseTimeHours: 4,
    resolutionTimeHours: 24,
    isActive: true
  };

  const mockAssignmentRule: Partial<AssignmentRule> = {
    id: 'rule-1',
    tenantId: mockUser.tenantId,
    name: 'Round Robin Rule',
    strategy: AssignmentStrategy.ROUND_ROBIN,
    assigneeIds: ['user-1', 'user-2'],
    isActive: true,
    priority_order: 0
  };

  const mockArticle: Partial<KnowledgeBaseArticle> = {
    id: 'article-1',
    tenantId: mockUser.tenantId,
    title: 'How to use the system',
    content: 'Step by step guide',
    status: ArticleStatus.PUBLISHED,
    authorId: mockUser.id,
    viewCount: 0,
    helpfulCount: 0,
    notHelpfulCount: 0
  };

  const mockCannedResponse: Partial<CannedResponse> = {
    id: 'response-1',
    tenantId: mockUser.tenantId,
    title: 'Welcome Message',
    content: 'Thank you for contacting us',
    createdById: mockUser.id,
    usageCount: 0,
    isActive: true
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn()
  }))
  }
  },
        {
          provide: getRepositoryToken(SLA),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn()
  }
  },
        {
          provide: getRepositoryToken(AssignmentRule),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn()
  }
  },
        {
          provide: getRepositoryToken(KnowledgeBaseArticle),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn()
  }))
  }
  },
        {
          provide: getRepositoryToken(CannedResponse),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn()
  }))
  }
  },
      ]
  }).compile();

    service = module.get<SupportService>(SupportService);
    ticketRepository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
    slaRepository = module.get<Repository<SLA>>(getRepositoryToken(SLA));
    assignmentRuleRepository = module.get<Repository<AssignmentRule>>(getRepositoryToken(AssignmentRule));
    articleRepository = module.get<Repository<KnowledgeBaseArticle>>(getRepositoryToken(KnowledgeBaseArticle));
    cannedResponseRepository = module.get<Repository<CannedResponse>>(getRepositoryToken(CannedResponse));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Ticket Operations', () => {
    describe('createTicket', () => {
      it('should create a ticket successfully', async () => {
        const createDto = {
          title: 'Test Ticket',
          description: 'Test Description',
          priority: IssuePriority.MEDIUM,
          type: IssueType.TASK,
          customerId: mockUser.id,
          channel: TicketChannel.PORTAL
  };

        jest.spyOn(ticketRepository, 'create').mockReturnValue(mockTicket as Ticket);
        jest.spyOn(assignmentRuleRepository, 'find').mockResolvedValue([]);
        jest.spyOn(ticketRepository, 'save').mockResolvedValue(mockTicket as Ticket);

        const result = await service.createTicket(mockUser, createDto);

        expect(result).toEqual(mockTicket);
        expect(ticketRepository.create).toHaveBeenCalledWith({
          ...createDto,
          tenantId: mockUser.tenantId,
          reporterId: mockUser.id,
          customerId: createDto.customerId
  });
      });

      it('should apply SLA when slaId is provided', async () => {
        const createDto = {
          title: 'Test Ticket',
          description: 'Test Description',
          priority: IssuePriority.MEDIUM,
          type: IssueType.TASK,
          customerId: mockUser.id,
          channel: TicketChannel.PORTAL,
          slaId: 'sla-1'
  };

        jest.spyOn(ticketRepository, 'create').mockReturnValue(mockTicket as Ticket);
        jest.spyOn(slaRepository, 'findOne').mockResolvedValue(mockSLA as SLA);
        jest.spyOn(assignmentRuleRepository, 'find').mockResolvedValue([]);
        jest.spyOn(ticketRepository, 'save').mockResolvedValue(mockTicket as Ticket);

        await service.createTicket(mockUser, createDto);

        expect(slaRepository.findOne).toHaveBeenCalled();
      });
    });

    describe('findAllTickets', () => {
      it('should return paginated tickets', async () => {
        
        jest.spyOn(ticketRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.findAllTickets(mockUser, { page: 1, limit: 10 });

        expect(result).toEqual({
          data: [mockTicket],
          total: 1,
          page: 1,
          limit: 10
  });
      });
    });

    describe('findOneTicket', () => {
      it('should return a ticket by id', async () => {
        jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as Ticket);

        const result = await service.findOneTicket(mockUser, 'ticket-1');

        expect(result).toEqual(mockTicket);
      });

      it('should throw NotFoundException if ticket not found', async () => {
        jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(null);

        await expect(service.findOneTicket(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateTicket', () => {
      it('should update a ticket successfully', async () => {
        const updateDto = { title: 'Updated Title' };

        jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as Ticket);
        jest.spyOn(ticketRepository, 'save').mockResolvedValue({ ...mockTicket, ...updateDto } as Ticket);

        const result = await service.updateTicket(mockUser, 'ticket-1', updateDto);

        expect(result.title).toBe('Updated Title');
      });
    });

    describe('rateTicket', () => {
      it('should rate a closed ticket successfully', async () => {
        const closedTicket = { ...mockTicket, status: IssueStatus.CLOSED };
        const rateDto = { rating: TicketSatisfactionRating.VERY_SATISFIED, comment: 'Great service' };

        jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(closedTicket as Ticket);
        jest.spyOn(ticketRepository, 'save').mockResolvedValue({ ...closedTicket, satisfactionRating: rateDto.rating, satisfactionComment: rateDto.comment } as Ticket);

        const result = await service.rateTicket(mockUser, 'ticket-1', rateDto);

        expect(result.satisfactionRating).toBe(TicketSatisfactionRating.VERY_SATISFIED);
      });

      it('should throw error if non-customer tries to rate', async () => {
        const ticket = { ...mockTicket, customerId: 'other-user', status: IssueStatus.CLOSED };

        jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(ticket as Ticket);

        await expect(service.rateTicket(mockUser, 'ticket-1', { rating: TicketSatisfactionRating.SATISFIED })).rejects.toThrow(BadRequestException);
      });

      it('should throw error if ticket is not closed', async () => {
        jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as Ticket);

        await expect(service.rateTicket(mockUser, 'ticket-1', { rating: TicketSatisfactionRating.SATISFIED })).rejects.toThrow(BadRequestException);
      });
    });

    describe('escalateTicket', () => {
      it('should escalate a ticket successfully', async () => {
        jest.spyOn(ticketRepository, 'findOne').mockResolvedValue(mockTicket as Ticket);
        jest.spyOn(ticketRepository, 'save').mockResolvedValue({
          ...mockTicket,
          isEscalated: true,
          escalatedToId: 'manager-1'
  } as Ticket);

        const result = await service.escalateTicket(mockUser, 'ticket-1', 'manager-1');

        expect(result.isEscalated).toBe(true);
        expect(result.escalatedToId).toBe('manager-1');
      });
    });
  });

  describe('SLA Operations', () => {
    describe('createSLA', () => {
      it('should create an SLA successfully', async () => {
        const createDto = {
          name: 'Standard SLA',
          priority: IssuePriority.MEDIUM,
          responseTimeHours: 4,
          resolutionTimeHours: 24
  };

        jest.spyOn(slaRepository, 'create').mockReturnValue(mockSLA as SLA);
        jest.spyOn(slaRepository, 'save').mockResolvedValue(mockSLA as SLA);

        const result = await service.createSLA(mockUser, createDto);

        expect(result).toEqual(mockSLA);
      });
    });

    describe('findAllSLAs', () => {
      it('should return all active SLAs', async () => {
        jest.spyOn(slaRepository, 'find').mockResolvedValue([mockSLA] as SLA[]);

        const result = await service.findAllSLAs(mockUser);

        expect(result).toEqual([mockSLA]);
      });
    });

    describe('updateSLA', () => {
      it('should update an SLA successfully', async () => {
        const updateDto = { responseTimeHours: 2 };

        jest.spyOn(slaRepository, 'findOne').mockResolvedValue(mockSLA as SLA);
        jest.spyOn(slaRepository, 'save').mockResolvedValue({ ...mockSLA, ...updateDto } as SLA);

        const result = await service.updateSLA(mockUser, 'sla-1', updateDto);

        expect(result.responseTimeHours).toBe(2);
      });
    });

    describe('deleteSLA', () => {
      it('should delete an SLA successfully', async () => {
        jest.spyOn(slaRepository, 'findOne').mockResolvedValue(mockSLA as SLA);
        jest.spyOn(slaRepository, 'remove').mockResolvedValue(mockSLA as SLA);

        await service.deleteSLA(mockUser, 'sla-1');

        expect(slaRepository.remove).toHaveBeenCalledWith(mockSLA);
      });
    });
  });

  describe('Assignment Rule Operations', () => {
    describe('createAssignmentRule', () => {
      it('should create an assignment rule successfully', async () => {
        const createDto = {
          name: 'Round Robin Rule',
          strategy: AssignmentStrategy.ROUND_ROBIN,
          assigneeIds: ['user-1', 'user-2']
  };

        jest.spyOn(assignmentRuleRepository, 'create').mockReturnValue(mockAssignmentRule as AssignmentRule);
        jest.spyOn(assignmentRuleRepository, 'save').mockResolvedValue(mockAssignmentRule as AssignmentRule);

        const result = await service.createAssignmentRule(mockUser, createDto);

        expect(result).toEqual(mockAssignmentRule);
      });
    });

    describe('findAllAssignmentRules', () => {
      it('should return all active assignment rules', async () => {
        jest.spyOn(assignmentRuleRepository, 'find').mockResolvedValue([mockAssignmentRule] as AssignmentRule[]);

        const result = await service.findAllAssignmentRules(mockUser);

        expect(result).toEqual([mockAssignmentRule]);
      });
    });
  });

  describe('Knowledge Base Operations', () => {
    describe('createArticle', () => {
      it('should create an article successfully', async () => {
        const createDto = {
          title: 'How to use the system',
          content: 'Step by step guide',
          status: ArticleStatus.DRAFT
  };

        jest.spyOn(articleRepository, 'create').mockReturnValue(mockArticle as KnowledgeBaseArticle);
        jest.spyOn(articleRepository, 'save').mockResolvedValue(mockArticle as KnowledgeBaseArticle);

        const result = await service.createArticle(mockUser, createDto);

        expect(result).toEqual(mockArticle);
      });
    });

    describe('findOneArticle', () => {
      it('should increment view count when fetching article', async () => {
        jest.spyOn(articleRepository, 'findOne').mockResolvedValue(mockArticle as KnowledgeBaseArticle);
        jest.spyOn(articleRepository, 'save').mockResolvedValue({
          ...mockArticle,
          viewCount: 1
  } as KnowledgeBaseArticle);

        const result = await service.findOneArticle(mockUser, 'article-1');

        expect(articleRepository.save).toHaveBeenCalled();
        expect(result.viewCount).toBeGreaterThanOrEqual(0);
      });
    });

    describe('markArticleHelpful', () => {
      it('should increment helpful count', async () => {
        jest.spyOn(articleRepository, 'findOne').mockResolvedValue(mockArticle as KnowledgeBaseArticle);
        jest.spyOn(articleRepository, 'save').mockResolvedValue({
          ...mockArticle,
          helpfulCount: 1
  } as KnowledgeBaseArticle);

        const result = await service.markArticleHelpful(mockUser, 'article-1', true);

        expect(result.helpfulCount).toBeGreaterThanOrEqual(0);
      });

      it('should increment not helpful count', async () => {
        jest.spyOn(articleRepository, 'findOne').mockResolvedValue(mockArticle as KnowledgeBaseArticle);
        jest.spyOn(articleRepository, 'save').mockResolvedValue({
          ...mockArticle,
          notHelpfulCount: 1
  } as KnowledgeBaseArticle);

        const result = await service.markArticleHelpful(mockUser, 'article-1', false);

        expect(result.notHelpfulCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Canned Response Operations', () => {
    describe('createCannedResponse', () => {
      it('should create a canned response successfully', async () => {
        const createDto = {
          title: 'Welcome Message',
          content: 'Thank you for contacting us'
  };

        jest.spyOn(cannedResponseRepository, 'create').mockReturnValue(mockCannedResponse as CannedResponse);
        jest.spyOn(cannedResponseRepository, 'save').mockResolvedValue(mockCannedResponse as CannedResponse);

        const result = await service.createCannedResponse(mockUser, createDto);

        expect(result).toEqual(mockCannedResponse);
      });
    });

    describe('findAllCannedResponses', () => {
      it('should return all active canned responses', async () => {
        
        jest.spyOn(cannedResponseRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.findAllCannedResponses(mockUser, {});

        expect(result).toEqual([mockCannedResponse]);
        expect(mockQueryBuilder.where).toHaveBeenCalled();
      });
    });

    describe('updateCannedResponse', () => {
      it('should update a canned response successfully', async () => {
        const updateDto = { title: 'Updated Title' };

        jest.spyOn(cannedResponseRepository, 'findOne').mockResolvedValue(mockCannedResponse as CannedResponse);
        jest.spyOn(cannedResponseRepository, 'save').mockResolvedValue({ ...mockCannedResponse, ...updateDto } as CannedResponse);

        const result = await service.updateCannedResponse(mockUser, 'response-1', updateDto);

        expect(result.title).toBe('Updated Title');
      });

      it('should throw NotFoundException if canned response not found', async () => {
        jest.spyOn(cannedResponseRepository, 'findOne').mockResolvedValue(null);

        await expect(service.updateCannedResponse(mockUser, 'invalid-id', {})).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteCannedResponse', () => {
      it('should delete a canned response successfully', async () => {
        jest.spyOn(cannedResponseRepository, 'findOne').mockResolvedValue(mockCannedResponse as CannedResponse);
        jest.spyOn(cannedResponseRepository, 'remove').mockResolvedValue(mockCannedResponse as CannedResponse);

        await service.deleteCannedResponse(mockUser, 'response-1');

        expect(cannedResponseRepository.remove).toHaveBeenCalledWith(mockCannedResponse);
      });

      it('should throw NotFoundException if canned response not found', async () => {
        jest.spyOn(cannedResponseRepository, 'findOne').mockResolvedValue(null);

        await expect(service.deleteCannedResponse(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('useCannedResponse', () => {
      it('should increment usage count', async () => {
        jest.spyOn(cannedResponseRepository, 'findOne').mockResolvedValue(mockCannedResponse as CannedResponse);
        jest.spyOn(cannedResponseRepository, 'save').mockResolvedValue({
          ...mockCannedResponse,
          usageCount: 1
  } as CannedResponse);

        const result = await service.useCannedResponse(mockUser, 'response-1');

        expect(result.usageCount).toBeGreaterThanOrEqual(0);
      });

      it('should throw NotFoundException if canned response not found', async () => {
        jest.spyOn(cannedResponseRepository, 'findOne').mockResolvedValue(null);

        await expect(service.useCannedResponse(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
      });
    });
  });
});

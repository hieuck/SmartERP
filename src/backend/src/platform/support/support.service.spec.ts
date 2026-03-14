import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SupportService } from './support.service';
import { Ticket } from './entities/ticket.entity';
import { SLA } from './entities/sla.entity';
import { AssignmentRule } from './entities/assignment-rule.entity';
import { KnowledgeBaseArticle } from './entities/knowledge-base-article.entity';
import { CannedResponse } from './entities/canned-response.entity';
import { User } from '@core/user/entities/user.entity';
import { IssueStatus } from '@platform/issue-tracking/enums/issue-status.enum';
import { IssuePriority } from '@platform/issue-tracking/enums/issue-priority.enum';
import { TicketChannel, AssignmentStrategy, ArticleStatus } from '@platform/support/enums';

describe('SupportService', () => {
  let service: SupportService;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;
  let slaRepository: jest.Mocked<Repository<SLA>>;
  let assignmentRuleRepository: jest.Mocked<Repository<AssignmentRule>>;
  let articleRepository: jest.Mocked<Repository<KnowledgeBaseArticle>>;
  let cannedResponseRepository: jest.Mocked<Repository<CannedResponse>>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    role: 'admin',
  } as User;

  const mockTicket: Partial<Ticket> = {
    id: 'ticket-1',
    tenantId: 'tenant-1',
    reporterId: 'user-1',
    customerId: 'user-1',
    title: 'Test ticket',
    status: IssueStatus.NEW,
    priority: IssuePriority.HIGH,
    channel: TicketChannel.EMAIL,
  };

  const mockSLA: Partial<SLA> = {
    id: 'sla-1',
    tenantId: 'tenant-1',
    name: 'Standard SLA',
    responseTimeHours: 2,
    resolutionTimeHours: 24,
    isActive: true,
    priority: IssuePriority.HIGH,
  };

  const mockAssignmentRule: Partial<AssignmentRule> = {
    id: 'rule-1',
    tenantId: 'tenant-1',
    name: 'Auto assign rule',
    strategy: AssignmentStrategy.ROUND_ROBIN,
    assigneeIds: ['user-1', 'user-2'],
    isActive: true,
    priority_order: 1,
  };

  const mockArticle: Partial<KnowledgeBaseArticle> = {
    id: 'article-1',
    tenantId: 'tenant-1',
    authorId: 'user-1',
    title: 'How to use',
    content: 'Content here',
    status: ArticleStatus.PUBLISHED,
    viewCount: 0,
    helpfulCount: 0,
    notHelpfulCount: 0,
  };

  const mockCannedResponse: Partial<CannedResponse> = {
    id: 'response-1',
    tenantId: 'tenant-1',
    createdById: 'user-1',
    title: 'Welcome message',
    content: 'Thank you for contacting us',
    shortcut: '/welcome',
    isActive: true,
    usageCount: 0,
  };

  beforeEach(async () => {
    const mockTicketRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      })),
    };

    const mockSLARepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockAssignmentRuleRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockArticleRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      })),
    };

    const mockCannedResponseRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
        { provide: getRepositoryToken(SLA), useValue: mockSLARepo },
        { provide: getRepositoryToken(AssignmentRule), useValue: mockAssignmentRuleRepo },
        { provide: getRepositoryToken(KnowledgeBaseArticle), useValue: mockArticleRepo },
        { provide: getRepositoryToken(CannedResponse), useValue: mockCannedResponseRepo },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    ticketRepository = module.get(getRepositoryToken(Ticket));
    slaRepository = module.get(getRepositoryToken(SLA));
    assignmentRuleRepository = module.get(getRepositoryToken(AssignmentRule));
    articleRepository = module.get(getRepositoryToken(KnowledgeBaseArticle));
    cannedResponseRepository = module.get(getRepositoryToken(CannedResponse));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create ticket successfully', async () => {
      const createDto = { title: 'Test', description: 'Test desc', priority: IssuePriority.HIGH };
      ticketRepository.create.mockReturnValue(mockTicket as Ticket);
      ticketRepository.save.mockResolvedValue(mockTicket as Ticket);
      assignmentRuleRepository.find.mockResolvedValue([]);

      const result = await service.createTicket(mockUser, createDto as any);

      expect(ticketRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: mockUser.tenantId,
        reporterId: mockUser.id,
        customerId: mockUser.id,
      });
      expect(result).toEqual(mockTicket);
    });

    it('should apply SLA when slaId provided', async () => {
      const createDto = { title: 'Test', slaId: 'sla-1' };
      ticketRepository.create.mockReturnValue(mockTicket as Ticket);
      slaRepository.findOne.mockResolvedValue(mockSLA as SLA);
      ticketRepository.save.mockResolvedValue(mockTicket as Ticket);
      assignmentRuleRepository.find.mockResolvedValue([]);

      await service.createTicket(mockUser, createDto as any);

      expect(slaRepository.findOne).toHaveBeenCalled();
    });

    it('should auto-assign when no assigneeId provided', async () => {
      const createDto = { title: 'Test' };
      ticketRepository.create.mockReturnValue(mockTicket as Ticket);
      assignmentRuleRepository.find.mockResolvedValue([mockAssignmentRule as AssignmentRule]);
      ticketRepository.save.mockResolvedValue(mockTicket as Ticket);
      ticketRepository.count.mockResolvedValue(0);

      await service.createTicket(mockUser, createDto as any);

      expect(assignmentRuleRepository.find).toHaveBeenCalled();
    });

    it('should use customerId from dto if provided', async () => {
      const createDto = { title: 'Test', customerId: 'customer-1' };
      ticketRepository.create.mockReturnValue(mockTicket as Ticket);
      ticketRepository.save.mockResolvedValue(mockTicket as Ticket);
      assignmentRuleRepository.find.mockResolvedValue([]);

      await service.createTicket(mockUser, createDto as any);

      expect(ticketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'customer-1' })
      );
    });
  });

  describe('findAllTickets', () => {
    it('should return paginated tickets', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTicket], 1]),
      };
      ticketRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAllTickets(mockUser, { page: 1, limit: 10 });

      expect(result).toEqual({ data: [mockTicket], total: 1, page: 1, limit: 10 });
    });

    it('should filter by status', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      ticketRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.findAllTickets(mockUser, { status: IssueStatus.CLOSED });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('ticket.status = :status', { status: IssueStatus.CLOSED });
    });

    it('should filter by channel', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      ticketRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.findAllTickets(mockUser, { channel: TicketChannel.EMAIL });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('ticket.channel = :channel', { channel: TicketChannel.EMAIL });
    });

    it('should use default pagination', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      ticketRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAllTickets(mockUser, {});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOneTicket', () => {
    it('should return ticket with relations', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket as Ticket);

      const result = await service.findOneTicket(mockUser, 'ticket-1');

      expect(ticketRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-1', tenantId: mockUser.tenantId },
        relations: ['customer', 'reporter', 'assignee', 'escalatedTo'],
      });
      expect(result).toEqual(mockTicket);
    });

    it('should throw NotFoundException when ticket not found', async () => {
      ticketRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneTicket(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTicket', () => {
    it('should update ticket successfully', async () => {
      const updateDto = { title: 'Updated title' };
      ticketRepository.findOne.mockResolvedValue(mockTicket as Ticket);
      ticketRepository.save.mockResolvedValue({ ...mockTicket, ...updateDto } as Ticket);

      const result = await service.updateTicket(mockUser, 'ticket-1', updateDto as any);

      expect(result.title).toBe('Updated title');
    });

    it('should update SLA when slaId changed', async () => {
      const updateDto = { slaId: 'sla-2' };
      const ticketWithOldSla = { ...mockTicket, slaId: 'sla-1' };
      ticketRepository.findOne.mockResolvedValue(ticketWithOldSla as Ticket);
      slaRepository.findOne.mockResolvedValue(mockSLA as SLA);
      ticketRepository.save.mockResolvedValue({ ...ticketWithOldSla, slaId: 'sla-2' } as Ticket);

      await service.updateTicket(mockUser, 'ticket-1', updateDto as any);

      expect(slaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sla-2', tenantId: mockUser.tenantId },
      });
    });
  });

  describe('rateTicket', () => {
    it('should rate closed ticket successfully', async () => {
      const closedTicket = { ...mockTicket, status: IssueStatus.CLOSED, customerId: mockUser.id };
      ticketRepository.findOne.mockResolvedValue(closedTicket as Ticket);
      ticketRepository.save.mockResolvedValue(closedTicket as Ticket);

      const result = await service.rateTicket(mockUser, 'ticket-1', { rating: 5, comment: 'Great' });

      expect(result.satisfactionRating).toBe(5);
    });

    it('should throw error when non-customer tries to rate', async () => {
      const ticket = { ...mockTicket, customerId: 'other-user', status: IssueStatus.CLOSED };
      ticketRepository.findOne.mockResolvedValue(ticket as Ticket);

      await expect(service.rateTicket(mockUser, 'ticket-1', { rating: 5 })).rejects.toThrow(BadRequestException);
    });

    it('should throw error when rating non-closed ticket', async () => {
      const ticket = { ...mockTicket, customerId: mockUser.id, status: IssueStatus.NEW };
      ticketRepository.findOne.mockResolvedValue(ticket as Ticket);

      await expect(service.rateTicket(mockUser, 'ticket-1', { rating: 5 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('escalateTicket', () => {
    it('should escalate ticket successfully', async () => {
      ticketRepository.findOne.mockResolvedValue(mockTicket as Ticket);
      const escalatedTicket = { 
        ...mockTicket, 
        isEscalated: true, 
        escalatedAt: new Date(),
        escalatedToId: 'manager-1' 
      };
      ticketRepository.save.mockResolvedValue(escalatedTicket as Ticket);

      const result = await service.escalateTicket(mockUser, 'ticket-1', 'manager-1');

      expect(result.isEscalated).toBe(true);
      expect(result.escalatedToId).toBe('manager-1');
      expect(result.escalatedAt).toBeDefined();
    });
  });

  describe('SLA Operations', () => {
    describe('createSLA', () => {
      it('should create SLA successfully', async () => {
        const createDto = { name: 'Premium SLA', responseTimeHours: 1, resolutionTimeHours: 8 };
        slaRepository.create.mockReturnValue(mockSLA as SLA);
        slaRepository.save.mockResolvedValue(mockSLA as SLA);

        const result = await service.createSLA(mockUser, createDto as any);

        expect(slaRepository.create).toHaveBeenCalledWith({ ...createDto, tenantId: mockUser.tenantId });
        expect(result).toEqual(mockSLA);
      });
    });

    describe('findAllSLAs', () => {
      it('should return all active SLAs', async () => {
        slaRepository.find.mockResolvedValue([mockSLA as SLA]);

        const result = await service.findAllSLAs(mockUser);

        expect(slaRepository.find).toHaveBeenCalledWith({
          where: { tenantId: mockUser.tenantId, isActive: true },
          order: { priority: 'DESC' },
        });
        expect(result).toEqual([mockSLA]);
      });
    });

    describe('findOneSLA', () => {
      it('should return SLA by id', async () => {
        slaRepository.findOne.mockResolvedValue(mockSLA as SLA);

        const result = await service.findOneSLA(mockUser, 'sla-1');

        expect(result).toEqual(mockSLA);
      });

      it('should throw NotFoundException when SLA not found', async () => {
        slaRepository.findOne.mockResolvedValue(null);

        await expect(service.findOneSLA(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateSLA', () => {
      it('should update SLA successfully', async () => {
        const updateDto = { name: 'Updated SLA' };
        slaRepository.findOne.mockResolvedValue(mockSLA as SLA);
        slaRepository.save.mockResolvedValue({ ...mockSLA, ...updateDto } as SLA);

        const result = await service.updateSLA(mockUser, 'sla-1', updateDto as any);

        expect(result.name).toBe('Updated SLA');
      });
    });

    describe('deleteSLA', () => {
      it('should delete SLA successfully', async () => {
        slaRepository.findOne.mockResolvedValue(mockSLA as SLA);
        slaRepository.remove.mockResolvedValue(mockSLA as SLA);

        await service.deleteSLA(mockUser, 'sla-1');

        expect(slaRepository.remove).toHaveBeenCalledWith(mockSLA);
      });
    });
  });

  describe('Assignment Rule Operations', () => {
    describe('createAssignmentRule', () => {
      it('should create assignment rule successfully', async () => {
        const createDto = { name: 'Auto assign', strategy: AssignmentStrategy.ROUND_ROBIN, assigneeIds: ['user-1'] };
        assignmentRuleRepository.create.mockReturnValue(mockAssignmentRule as AssignmentRule);
        assignmentRuleRepository.save.mockResolvedValue(mockAssignmentRule as AssignmentRule);

        const result = await service.createAssignmentRule(mockUser, createDto as any);

        expect(result).toEqual(mockAssignmentRule);
      });
    });

    describe('findAllAssignmentRules', () => {
      it('should return all active rules ordered by priority', async () => {
        assignmentRuleRepository.find.mockResolvedValue([mockAssignmentRule as AssignmentRule]);

        const result = await service.findAllAssignmentRules(mockUser);

        expect(assignmentRuleRepository.find).toHaveBeenCalledWith({
          where: { tenantId: mockUser.tenantId, isActive: true },
          order: { priority_order: 'ASC' },
        });
        expect(result).toEqual([mockAssignmentRule]);
      });
    });

    describe('updateAssignmentRule', () => {
      it('should update rule successfully', async () => {
        const updateDto = { name: 'Updated rule' };
        assignmentRuleRepository.findOne.mockResolvedValue(mockAssignmentRule as AssignmentRule);
        assignmentRuleRepository.save.mockResolvedValue({ ...mockAssignmentRule, ...updateDto } as AssignmentRule);

        const result = await service.updateAssignmentRule(mockUser, 'rule-1', updateDto as any);

        expect(result.name).toBe('Updated rule');
      });
    });

    describe('deleteAssignmentRule', () => {
      it('should delete rule successfully', async () => {
        assignmentRuleRepository.findOne.mockResolvedValue(mockAssignmentRule as AssignmentRule);
        assignmentRuleRepository.remove.mockResolvedValue(mockAssignmentRule as AssignmentRule);

        await service.deleteAssignmentRule(mockUser, 'rule-1');

        expect(assignmentRuleRepository.remove).toHaveBeenCalled();
      });
    });
  });

  describe('Knowledge Base Operations', () => {
    describe('createArticle', () => {
      it('should create article successfully', async () => {
        const createDto = { title: 'How to', content: 'Content', status: ArticleStatus.DRAFT };
        articleRepository.create.mockReturnValue(mockArticle as KnowledgeBaseArticle);
        articleRepository.save.mockResolvedValue(mockArticle as KnowledgeBaseArticle);

        const result = await service.createArticle(mockUser, createDto as any);

        expect(articleRepository.create).toHaveBeenCalledWith({
          ...createDto,
          tenantId: mockUser.tenantId,
          authorId: mockUser.id,
        });
        expect(result).toEqual(mockArticle);
      });
    });

    describe('findAllArticles', () => {
      it('should return paginated articles', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[mockArticle], 1]),
        };
        articleRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        const result = await service.findAllArticles(mockUser, { page: 1, limit: 10 });

        expect(result).toEqual({ data: [mockArticle], total: 1, page: 1, limit: 10 });
      });

      it('should filter by status', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };
        articleRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        await service.findAllArticles(mockUser, { status: ArticleStatus.PUBLISHED });

        expect(queryBuilder.andWhere).toHaveBeenCalledWith('article.status = :status', { status: ArticleStatus.PUBLISHED });
      });

      it('should search by title and content', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };
        articleRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        await service.findAllArticles(mockUser, { search: 'test' });

        expect(queryBuilder.andWhere).toHaveBeenCalled();
      });
    });

    describe('findOneArticle', () => {
      it('should return article and increment view count', async () => {
        articleRepository.findOne.mockResolvedValue(mockArticle as KnowledgeBaseArticle);
        articleRepository.save.mockResolvedValue({ ...mockArticle, viewCount: 1 } as KnowledgeBaseArticle);

        const result = await service.findOneArticle(mockUser, 'article-1');

        expect(result.viewCount).toBe(1);
      });

      it('should throw NotFoundException when article not found', async () => {
        articleRepository.findOne.mockResolvedValue(null);

        await expect(service.findOneArticle(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateArticle', () => {
      it('should update article successfully', async () => {
        const updateDto = { title: 'Updated title' };
        articleRepository.findOne.mockResolvedValue(mockArticle as KnowledgeBaseArticle);
        articleRepository.save.mockResolvedValue({ ...mockArticle, ...updateDto } as KnowledgeBaseArticle);

        const result = await service.updateArticle(mockUser, 'article-1', updateDto as any);

        expect(result.title).toBe('Updated title');
      });

      it('should set publishedAt when status changed to published', async () => {
        const updateDto = { status: ArticleStatus.PUBLISHED };
        const draftArticle = { ...mockArticle, status: ArticleStatus.DRAFT, publishedAt: null };
        articleRepository.findOne.mockResolvedValue(draftArticle as KnowledgeBaseArticle);
        articleRepository.save.mockResolvedValue({ ...draftArticle, ...updateDto, publishedAt: new Date() } as KnowledgeBaseArticle);

        const result = await service.updateArticle(mockUser, 'article-1', updateDto as any);

        expect(result.publishedAt).toBeDefined();
      });
    });

    describe('deleteArticle', () => {
      it('should delete article successfully', async () => {
        articleRepository.findOne.mockResolvedValue(mockArticle as KnowledgeBaseArticle);
        articleRepository.remove.mockResolvedValue(mockArticle as KnowledgeBaseArticle);

        await service.deleteArticle(mockUser, 'article-1');

        expect(articleRepository.remove).toHaveBeenCalled();
      });
    });

    describe('markArticleHelpful', () => {
      it('should increment helpful count when helpful is true', async () => {
        articleRepository.findOne.mockResolvedValue(mockArticle as KnowledgeBaseArticle);
        articleRepository.save.mockResolvedValue({ ...mockArticle, helpfulCount: 1 } as KnowledgeBaseArticle);

        const result = await service.markArticleHelpful(mockUser, 'article-1', true);

        expect(result.helpfulCount).toBe(1);
      });

      it('should increment not helpful count when helpful is false', async () => {
        articleRepository.findOne.mockResolvedValue(mockArticle as KnowledgeBaseArticle);
        articleRepository.save.mockResolvedValue({ ...mockArticle, notHelpfulCount: 1 } as KnowledgeBaseArticle);

        const result = await service.markArticleHelpful(mockUser, 'article-1', false);

        expect(result.notHelpfulCount).toBe(1);
      });
    });
  });

  describe('Canned Response Operations', () => {
    describe('createCannedResponse', () => {
      it('should create canned response successfully', async () => {
        const createDto = { title: 'Welcome', content: 'Thank you', shortcut: '/welcome' };
        cannedResponseRepository.create.mockReturnValue(mockCannedResponse as CannedResponse);
        cannedResponseRepository.save.mockResolvedValue(mockCannedResponse as CannedResponse);

        const result = await service.createCannedResponse(mockUser, createDto as any);

        expect(cannedResponseRepository.create).toHaveBeenCalledWith({
          ...createDto,
          tenantId: mockUser.tenantId,
          createdById: mockUser.id,
        });
        expect(result).toEqual(mockCannedResponse);
      });
    });

    describe('findAllCannedResponses', () => {
      it('should return all active responses ordered by usage', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockCannedResponse]),
        };
        cannedResponseRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        const result = await service.findAllCannedResponses(mockUser, {});

        expect(result).toEqual([mockCannedResponse]);
      });

      it('should search by title, content and shortcut', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        };
        cannedResponseRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        await service.findAllCannedResponses(mockUser, { search: 'test' });

        expect(queryBuilder.andWhere).toHaveBeenCalled();
      });
    });

    describe('findOneCannedResponse', () => {
      it('should return canned response by id', async () => {
        cannedResponseRepository.findOne.mockResolvedValue(mockCannedResponse as CannedResponse);

        const result = await service.findOneCannedResponse(mockUser, 'response-1');

        expect(result).toEqual(mockCannedResponse);
      });

      it('should throw NotFoundException when response not found', async () => {
        cannedResponseRepository.findOne.mockResolvedValue(null);

        await expect(service.findOneCannedResponse(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateCannedResponse', () => {
      it('should update canned response successfully', async () => {
        const updateDto = { title: 'Updated title' };
        cannedResponseRepository.findOne.mockResolvedValue(mockCannedResponse as CannedResponse);
        cannedResponseRepository.save.mockResolvedValue({ ...mockCannedResponse, ...updateDto } as CannedResponse);

        const result = await service.updateCannedResponse(mockUser, 'response-1', updateDto as any);

        expect(result.title).toBe('Updated title');
      });
    });

    describe('deleteCannedResponse', () => {
      it('should delete canned response successfully', async () => {
        cannedResponseRepository.findOne.mockResolvedValue(mockCannedResponse as CannedResponse);
        cannedResponseRepository.remove.mockResolvedValue(mockCannedResponse as CannedResponse);

        await service.deleteCannedResponse(mockUser, 'response-1');

        expect(cannedResponseRepository.remove).toHaveBeenCalled();
      });
    });

    describe('useCannedResponse', () => {
      it('should increment usage count', async () => {
        cannedResponseRepository.findOne.mockResolvedValue(mockCannedResponse as CannedResponse);
        cannedResponseRepository.save.mockResolvedValue({ ...mockCannedResponse, usageCount: 1 } as CannedResponse);

        const result = await service.useCannedResponse(mockUser, 'response-1');

        expect(result.usageCount).toBe(1);
      });
    });
  });
});

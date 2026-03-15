/**
 * SupportController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * TICKETS (8 endpoints):
 * 1. POST /support/tickets - Create ticket
 * 2. GET /support/tickets - Get all tickets
 * 3. GET /support/tickets/:id - Get ticket by ID
 * 4. PUT /support/tickets/:id - Update ticket
 * 5. POST /support/tickets/:id/rate - Rate ticket
 * 6. POST /support/tickets/:id/escalate - Escalate ticket
 *
 * SLA (5 endpoints):
 * 7. POST /support/slas - Create SLA
 * 8. GET /support/slas - Get all SLAs
 * 9. GET /support/slas/:id - Get SLA by ID
 * 10. PUT /support/slas/:id - Update SLA
 * 11. DELETE /support/slas/:id - Delete SLA
 *
 * ASSIGNMENT RULES (5 endpoints):
 * 12. POST /support/assignment-rules - Create rule
 * 13. GET /support/assignment-rules - Get all rules
 * 14. GET /support/assignment-rules/:id - Get rule by ID
 * 15. PUT /support/assignment-rules/:id - Update rule
 * 16. DELETE /support/assignment-rules/:id - Delete rule
 *
 * KNOWLEDGE BASE (6 endpoints):
 * 17. POST /support/articles - Create article
 * 18. GET /support/articles - Get all articles
 * 19. GET /support/articles/:id - Get article by ID
 * 20. PUT /support/articles/:id - Update article
 * 21. DELETE /support/articles/:id - Delete article
 * 22. POST /support/articles/:id/helpful - Mark helpful
 *
 * CANNED RESPONSES (6 endpoints):
 * 23. POST /support/canned-responses - Create response
 * 24. GET /support/canned-responses - Get all responses
 * 25. GET /support/canned-responses/:id - Get response by ID
 * 26. PUT /support/canned-responses/:id - Update response
 * 27. DELETE /support/canned-responses/:id - Delete response
 * 28. POST /support/canned-responses/:id/use - Use response
 *
 * 29. Authentication/Authorization tests
 * 30. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IssueStatus } from '@platform/issue-tracking/enums/issue-status.enum';
import { IssuePriority } from '@platform/issue-tracking/enums/issue-priority.enum';
import { IssueType } from '@platform/issue-tracking/enums/issue-type.enum';
import { TicketChannel, AssignmentStrategy, ArticleStatus } from './enums';

describe('SupportController (Integration)', () => {
  let app: INestApplication;
  let supportService: jest.Mocked<SupportService>;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const mockAgent = {
    id: 'agent-123',
    email: 'agent@example.com',
    tenantId: 'tenant-123',
    roles: ['support_agent'],
  };

  const mockManager = {
    id: 'manager-123',
    email: 'manager@example.com',
    tenantId: 'tenant-123',
    roles: ['support_manager'],
  };

  const mockTicket = {
    id: 'ticket-123',
    title: 'Cannot login',
    description: 'User cannot login to the system',
    status: IssueStatus.NEW,
    priority: IssuePriority.HIGH,
    type: IssueType.BUG,
    channel: TicketChannel.EMAIL,
    customerId: 'user-123',
    reporterId: 'user-123',
    assigneeId: null,
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockSLA = {
    id: 'sla-123',
    name: 'Standard SLA',
    description: 'Standard support SLA',
    priority: IssuePriority.MEDIUM,
    responseTimeHours: 4,
    resolutionTimeHours: 24,
    isActive: true,
    tenantId: 'tenant-123',
  };

  const mockAssignmentRule = {
    id: 'rule-123',
    name: 'High Priority Rule',
    priority: IssuePriority.HIGH,
    strategy: AssignmentStrategy.ROUND_ROBIN,
    assigneeIds: ['agent-123', 'agent-456'],
    isActive: true,
    priority_order: 1,
    tenantId: 'tenant-123',
  };

  const mockArticle = {
    id: 'article-123',
    title: 'How to reset password',
    content: 'Step-by-step guide to reset your password',
    status: ArticleStatus.PUBLISHED,
    category: 'account',
    tags: ['password', 'security'],
    viewCount: 100,
    helpfulCount: 50,
    notHelpfulCount: 5,
    authorId: 'agent-123',
    tenantId: 'tenant-123',
    publishedAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockCannedResponse = {
    id: 'response-123',
    title: 'Welcome Message',
    shortcut: '/welcome',
    content: 'Thank you for contacting support. How can we help you today?',
    category: 'greeting',
    usageCount: 25,
    isActive: true,
    createdById: 'agent-123',
    tenantId: 'tenant-123',
  };

  beforeAll(async () => {
    const mockSupportService = {
      createTicket: jest.fn(),
      findAllTickets: jest.fn(),
      findOneTicket: jest.fn(),
      updateTicket: jest.fn(),
      rateTicket: jest.fn(),
      escalateTicket: jest.fn(),
      createSLA: jest.fn(),
      findAllSLAs: jest.fn(),
      findOneSLA: jest.fn(),
      updateSLA: jest.fn(),
      deleteSLA: jest.fn(),
      createAssignmentRule: jest.fn(),
      findAllAssignmentRules: jest.fn(),
      findOneAssignmentRule: jest.fn(),
      updateAssignmentRule: jest.fn(),
      deleteAssignmentRule: jest.fn(),
      createArticle: jest.fn(),
      findAllArticles: jest.fn(),
      findOneArticle: jest.fn(),
      updateArticle: jest.fn(),
      deleteArticle: jest.fn(),
      markArticleHelpful: jest.fn(),
      createCannedResponse: jest.fn(),
      findAllCannedResponses: jest.fn(),
      findOneCannedResponse: jest.fn(),
      updateCannedResponse: jest.fn(),
      deleteCannedResponse: jest.fn(),
      useCannedResponse: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          if (token === 'agent-token') {
            request.user = mockAgent;
          } else if (token === 'manager-token') {
            request.user = mockManager;
          } else {
            request.user = mockUser;
          }
          return true;
        }

        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    supportService = moduleFixture.get(SupportService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== TICKET TESTS ====================
  describe('POST /support/tickets', () => {
    it('should create ticket successfully', async () => {
      const createDto = {
        title: 'Login Issue',
        description: 'Cannot login',
        priority: IssuePriority.HIGH,
        type: IssueType.BUG,
        channel: TicketChannel.EMAIL,
      };

      supportService.createTicket.mockResolvedValue(mockTicket as any);

      const response = await request(app.getHttpServer())
        .post('/support/tickets')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockTicket);
      expect(supportService.createTicket).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/support/tickets')
        .send({ title: 'Test', description: 'Test' })
        .expect(401);
    });
  });

  describe('GET /support/tickets', () => {
    it('should return all tickets with pagination', async () => {
      const result = { data: [mockTicket], total: 1, page: 1, limit: 10 };
      supportService.findAllTickets.mockResolvedValue(result as any);

      const response = await request(app.getHttpServer())
        .get('/support/tickets')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(result);
    });

    it('should filter by status and channel', async () => {
      const result = { data: [mockTicket], total: 1, page: 1, limit: 10 };
      supportService.findAllTickets.mockResolvedValue(result as any);

      await request(app.getHttpServer())
        .get(`/support/tickets?status=${IssueStatus.NEW}&channel=${TicketChannel.EMAIL}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /support/tickets/:id', () => {
    it('should return ticket by ID', async () => {
      supportService.findOneTicket.mockResolvedValue(mockTicket as any);

      const response = await request(app.getHttpServer())
        .get('/support/tickets/ticket-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTicket);
    });

    it('should return 404 when not found', async () => {
      supportService.findOneTicket.mockRejectedValue(
        new HttpException('Ticket not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/support/tickets/ticket-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PUT /support/tickets/:id', () => {
    it('should update ticket', async () => {
      const updateDto = { title: 'Updated Title' };
      supportService.updateTicket.mockResolvedValue({ ...mockTicket, ...updateDto } as any);

      const response = await request(app.getHttpServer())
        .put('/support/tickets/ticket-123')
        .set('Authorization', 'Bearer agent-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
    });
  });

  describe('POST /support/tickets/:id/rate', () => {
    it('should rate ticket', async () => {
      const rateDto = { rating: 5, comment: 'Excellent service' };
      supportService.rateTicket.mockResolvedValue({
        ...mockTicket,
        satisfactionRating: 5,
      } as any);

      await request(app.getHttpServer())
        .post('/support/tickets/ticket-123/rate')
        .set('Authorization', 'Bearer valid-token')
        .send(rateDto)
        .expect(201);
    });
  });

  describe('POST /support/tickets/:id/escalate', () => {
    it('should escalate ticket', async () => {
      supportService.escalateTicket.mockResolvedValue({
        ...mockTicket,
        isEscalated: true,
      } as any);

      await request(app.getHttpServer())
        .post('/support/tickets/ticket-123/escalate')
        .set('Authorization', 'Bearer agent-token')
        .send({ escalatedToId: 'manager-123' })
        .expect(201);
    });
  });

  // ==================== SLA TESTS ====================
  describe('POST /support/slas', () => {
    it('should create SLA', async () => {
      const createDto = {
        name: 'Premium SLA',
        priority: IssuePriority.HIGH,
        responseTimeHours: 2,
        resolutionTimeHours: 12,
      };

      supportService.createSLA.mockResolvedValue(mockSLA as any);

      const response = await request(app.getHttpServer())
        .post('/support/slas')
        .set('Authorization', 'Bearer manager-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockSLA);
    });
  });

  describe('GET /support/slas', () => {
    it('should return all SLAs', async () => {
      supportService.findAllSLAs.mockResolvedValue([mockSLA] as any);

      const response = await request(app.getHttpServer())
        .get('/support/slas')
        .set('Authorization', 'Bearer agent-token')
        .expect(200);

      expect(response.body).toEqual([mockSLA]);
    });
  });

  describe('GET /support/slas/:id', () => {
    it('should return SLA by ID', async () => {
      supportService.findOneSLA.mockResolvedValue(mockSLA as any);

      const response = await request(app.getHttpServer())
        .get('/support/slas/sla-123')
        .set('Authorization', 'Bearer agent-token')
        .expect(200);

      expect(response.body).toEqual(mockSLA);
    });
  });

  describe('PUT /support/slas/:id', () => {
    it('should update SLA', async () => {
      const updateDto = { responseTimeHours: 1 };
      supportService.updateSLA.mockResolvedValue({ ...mockSLA, ...updateDto } as any);

      await request(app.getHttpServer())
        .put('/support/slas/sla-123')
        .set('Authorization', 'Bearer manager-token')
        .send(updateDto)
        .expect(200);
    });
  });

  describe('DELETE /support/slas/:id', () => {
    it('should delete SLA', async () => {
      supportService.deleteSLA.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/support/slas/sla-123')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.message).toBe('SLA deleted successfully');
    });
  });

  // ==================== ASSIGNMENT RULE TESTS ====================
  describe('POST /support/assignment-rules', () => {
    it('should create assignment rule', async () => {
      const createDto = {
        name: 'High Priority Rule',
        priority: IssuePriority.HIGH,
        strategy: AssignmentStrategy.ROUND_ROBIN,
        assigneeIds: ['agent-123'],
      };

      supportService.createAssignmentRule.mockResolvedValue(mockAssignmentRule as any);

      const response = await request(app.getHttpServer())
        .post('/support/assignment-rules')
        .set('Authorization', 'Bearer manager-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockAssignmentRule);
    });
  });

  describe('GET /support/assignment-rules', () => {
    it('should return all rules', async () => {
      supportService.findAllAssignmentRules.mockResolvedValue([mockAssignmentRule] as any);

      const response = await request(app.getHttpServer())
        .get('/support/assignment-rules')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body).toEqual([mockAssignmentRule]);
    });
  });

  describe('GET /support/assignment-rules/:id', () => {
    it('should return rule by ID', async () => {
      supportService.findOneAssignmentRule.mockResolvedValue(mockAssignmentRule as any);

      const response = await request(app.getHttpServer())
        .get('/support/assignment-rules/rule-123')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body).toEqual(mockAssignmentRule);
    });
  });

  describe('PUT /support/assignment-rules/:id', () => {
    it('should update rule', async () => {
      const updateDto = { strategy: AssignmentStrategy.LEAST_ACTIVE };
      supportService.updateAssignmentRule.mockResolvedValue({
        ...mockAssignmentRule,
        ...updateDto,
      } as any);

      await request(app.getHttpServer())
        .put('/support/assignment-rules/rule-123')
        .set('Authorization', 'Bearer manager-token')
        .send(updateDto)
        .expect(200);
    });
  });

  describe('DELETE /support/assignment-rules/:id', () => {
    it('should delete rule', async () => {
      supportService.deleteAssignmentRule.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/support/assignment-rules/rule-123')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.message).toBe('Assignment rule deleted successfully');
    });
  });

  // ==================== KNOWLEDGE BASE TESTS ====================
  describe('POST /support/articles', () => {
    it('should create article', async () => {
      const createDto = {
        title: 'Password Reset Guide',
        content: 'How to reset password',
        category: 'account',
        tags: ['password'],
      };

      supportService.createArticle.mockResolvedValue(mockArticle as any);

      const response = await request(app.getHttpServer())
        .post('/support/articles')
        .set('Authorization', 'Bearer agent-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockArticle);
    });
  });

  describe('GET /support/articles', () => {
    it('should return all articles with filters', async () => {
      const result = { data: [mockArticle], total: 1, page: 1, limit: 10 };
      supportService.findAllArticles.mockResolvedValue(result as any);

      const response = await request(app.getHttpServer())
        .get('/support/articles?status=published&search=password')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(result);
    });
  });

  describe('GET /support/articles/:id', () => {
    it('should return article and increment view count', async () => {
      supportService.findOneArticle.mockResolvedValue(mockArticle as any);

      const response = await request(app.getHttpServer())
        .get('/support/articles/article-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockArticle);
    });
  });

  describe('PUT /support/articles/:id', () => {
    it('should update article', async () => {
      const updateDto = { title: 'Updated Title' };
      supportService.updateArticle.mockResolvedValue({ ...mockArticle, ...updateDto } as any);

      await request(app.getHttpServer())
        .put('/support/articles/article-123')
        .set('Authorization', 'Bearer agent-token')
        .send(updateDto)
        .expect(200);
    });
  });

  describe('DELETE /support/articles/:id', () => {
    it('should delete article', async () => {
      supportService.deleteArticle.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/support/articles/article-123')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.message).toBe('Article deleted successfully');
    });
  });

  describe('POST /support/articles/:id/helpful', () => {
    it('should mark article as helpful', async () => {
      supportService.markArticleHelpful.mockResolvedValue({
        ...mockArticle,
        helpfulCount: 51,
      } as any);

      await request(app.getHttpServer())
        .post('/support/articles/article-123/helpful')
        .set('Authorization', 'Bearer valid-token')
        .send({ helpful: true })
        .expect(201);
    });

    it('should mark article as not helpful', async () => {
      supportService.markArticleHelpful.mockResolvedValue({
        ...mockArticle,
        notHelpfulCount: 6,
      } as any);

      await request(app.getHttpServer())
        .post('/support/articles/article-123/helpful')
        .set('Authorization', 'Bearer valid-token')
        .send({ helpful: false })
        .expect(201);
    });
  });

  // ==================== CANNED RESPONSE TESTS ====================
  describe('POST /support/canned-responses', () => {
    it('should create canned response', async () => {
      const createDto = {
        title: 'Greeting',
        shortcut: '/hi',
        content: 'Hello! How can I help?',
        category: 'greeting',
      };

      supportService.createCannedResponse.mockResolvedValue(mockCannedResponse as any);

      const response = await request(app.getHttpServer())
        .post('/support/canned-responses')
        .set('Authorization', 'Bearer agent-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockCannedResponse);
    });
  });

  describe('GET /support/canned-responses', () => {
    it('should return all canned responses', async () => {
      supportService.findAllCannedResponses.mockResolvedValue([mockCannedResponse] as any);

      const response = await request(app.getHttpServer())
        .get('/support/canned-responses')
        .set('Authorization', 'Bearer agent-token')
        .expect(200);

      expect(response.body).toEqual([mockCannedResponse]);
    });

    it('should search canned responses', async () => {
      supportService.findAllCannedResponses.mockResolvedValue([mockCannedResponse] as any);

      await request(app.getHttpServer())
        .get('/support/canned-responses?search=welcome')
        .set('Authorization', 'Bearer agent-token')
        .expect(200);
    });
  });

  describe('GET /support/canned-responses/:id', () => {
    it('should return canned response by ID', async () => {
      supportService.findOneCannedResponse.mockResolvedValue(mockCannedResponse as any);

      const response = await request(app.getHttpServer())
        .get('/support/canned-responses/response-123')
        .set('Authorization', 'Bearer agent-token')
        .expect(200);

      expect(response.body).toEqual(mockCannedResponse);
    });
  });

  describe('PUT /support/canned-responses/:id', () => {
    it('should update canned response', async () => {
      const updateDto = { content: 'Updated content' };
      supportService.updateCannedResponse.mockResolvedValue({
        ...mockCannedResponse,
        ...updateDto,
      } as any);

      await request(app.getHttpServer())
        .put('/support/canned-responses/response-123')
        .set('Authorization', 'Bearer agent-token')
        .send(updateDto)
        .expect(200);
    });
  });

  describe('DELETE /support/canned-responses/:id', () => {
    it('should delete canned response', async () => {
      supportService.deleteCannedResponse.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/support/canned-responses/response-123')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.message).toBe('Canned response deleted successfully');
    });
  });

  describe('POST /support/canned-responses/:id/use', () => {
    it('should increment usage count', async () => {
      supportService.useCannedResponse.mockResolvedValue({
        ...mockCannedResponse,
        usageCount: 26,
      } as any);

      await request(app.getHttpServer())
        .post('/support/canned-responses/response-123/use')
        .set('Authorization', 'Bearer agent-token')
        .expect(201);
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle concurrent ticket creation', async () => {
      supportService.createTicket.mockResolvedValue(mockTicket as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/support/tickets')
            .set('Authorization', 'Bearer valid-token')
            .send({ title: 'Test', description: 'Test' }),
        );

      const responses = await Promise.all(requests);
      responses.forEach((r) => expect(r.status).toBe(201));
    });

    it('should handle very long ticket descriptions', async () => {
      const longDesc = 'a'.repeat(10000);
      supportService.createTicket.mockResolvedValue({
        ...mockTicket,
        description: longDesc,
      } as any);

      await request(app.getHttpServer())
        .post('/support/tickets')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Test', description: longDesc })
        .expect(201);
    });

    it('should handle special characters in content', async () => {
      const specialContent = '<script>alert("XSS")</script>';
      supportService.createArticle.mockResolvedValue({
        ...mockArticle,
        content: specialContent,
      } as any);

      await request(app.getHttpServer())
        .post('/support/articles')
        .set('Authorization', 'Bearer agent-token')
        .send({ title: 'Test', content: specialContent, category: 'test' })
        .expect(201);
    });

    it('should handle multiple assignment strategies', async () => {
      const strategies = [
        AssignmentStrategy.ROUND_ROBIN,
        AssignmentStrategy.LEAST_ACTIVE,
        AssignmentStrategy.RANDOM,
        AssignmentStrategy.SKILL_BASED,
      ];

      for (const strategy of strategies) {
        supportService.createAssignmentRule.mockResolvedValue({
          ...mockAssignmentRule,
          strategy,
        } as any);

        await request(app.getHttpServer())
          .post('/support/assignment-rules')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Test Rule',
            strategy,
            assigneeIds: ['agent-123'],
          })
          .expect(201);
      }
    });

    it('should handle SLA with zero response time', async () => {
      supportService.createSLA.mockRejectedValue(
        new HttpException('Invalid response time', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/support/slas')
        .set('Authorization', 'Bearer manager-token')
        .send({
          name: 'Invalid SLA',
          responseTimeHours: 0,
          resolutionTimeHours: 24,
        })
        .expect(400);
    });

    it('should handle article with empty tags', async () => {
      supportService.createArticle.mockResolvedValue({
        ...mockArticle,
        tags: [],
      } as any);

      await request(app.getHttpServer())
        .post('/support/articles')
        .set('Authorization', 'Bearer agent-token')
        .send({ title: 'Test', content: 'Test', category: 'test', tags: [] })
        .expect(201);
    });

    it('should handle canned response with duplicate shortcut', async () => {
      supportService.createCannedResponse.mockRejectedValue(
        new HttpException('Shortcut already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/support/canned-responses')
        .set('Authorization', 'Bearer agent-token')
        .send({
          title: 'Test',
          shortcut: '/welcome',
          content: 'Test',
        })
        .expect(409);
    });
  });
});

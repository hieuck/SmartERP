/**
 * IssueTrackingController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. POST /issues - Create issue
 * 2. GET /issues - Get all issues with pagination
 * 3. GET /issues/:id - Get issue by ID
 * 4. PUT /issues/:id - Update issue
 * 5. PATCH /issues/:id/status - Update issue status
 * 6. PATCH /issues/:id/assign - Assign issue
 * 7. POST /issues/:id/comments - Add comment
 * 8. GET /issues/:id/comments - Get comments
 * 9. Authentication/Authorization tests
 * 10. Validation tests
 * 11. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { IssueTrackingController } from './issue-tracking.controller';
import { IssueTrackingService } from './issue-tracking.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IssueStatus } from './enums/issue-status.enum';
import { IssuePriority } from './enums/issue-priority.enum';
import { IssueType } from './enums/issue-type.enum';

describe('IssueTrackingController (Integration)', () => {
  let app: INestApplication;
  let issueTrackingService: jest.Mocked<IssueTrackingService>;

  const mockUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const mockManager = {
    id: 'manager-123',
    tenantId: 'tenant-123',
    roles: ['manager'],
  };

  const mockIssue = {
    id: 'issue-123',
    title: 'Bug in login page',
    description: 'Users cannot login with valid credentials',
    status: IssueStatus.NEW,
    priority: IssuePriority.HIGH,
    type: IssueType.BUG,
    reporterId: 'user-123',
    assigneeId: null,
    tenantId: 'tenant-123',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    resolvedAt: null,
    closedAt: null,
  };

  const mockComment = {
    id: 'comment-123',
    issueId: 'issue-123',
    authorId: 'user-123',
    content: 'This is a test comment',
    isInternal: false,
    tenantId: 'tenant-123',
    createdAt: '2024-01-15T10:05:00.000Z',
  };

  beforeAll(async () => {
    const mockIssueTrackingService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      assign: jest.fn(),
      addComment: jest.fn(),
      getComments: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          if (token === 'manager-token') {
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
      controllers: [IssueTrackingController],
      providers: [
        {
          provide: IssueTrackingService,
          useValue: mockIssueTrackingService,
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

    issueTrackingService = moduleFixture.get(IssueTrackingService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /issues', () => {
    it('should create issue successfully', async () => {
      const createDto = {
        title: 'New Bug',
        description: 'Bug description',
        priority: IssuePriority.HIGH,
        type: IssueType.BUG,
      };

      issueTrackingService.create.mockResolvedValue(mockIssue as any);

      const response = await request(app.getHttpServer())
        .post('/issues')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockIssue);
      expect(issueTrackingService.create).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should create issue with assignee', async () => {
      const createDto = {
        title: 'New Bug',
        description: 'Bug description',
        priority: IssuePriority.HIGH,
        type: IssueType.BUG,
        assigneeId: 'assignee-123',
      };

      const issueWithAssignee = { ...mockIssue, assigneeId: 'assignee-123' };
      issueTrackingService.create.mockResolvedValue(issueWithAssignee as any);

      const response = await request(app.getHttpServer())
        .post('/issues')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.assigneeId).toBe('assignee-123');
    });

    it('should create issue with default priority and type', async () => {
      const createDto = {
        title: 'Simple Issue',
        description: 'Simple description',
      };

      issueTrackingService.create.mockResolvedValue(mockIssue as any);

      await request(app.getHttpServer())
        .post('/issues')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/issues')
        .send({ title: 'Test', description: 'Test' })
        .expect(401);
    });

    it('should handle service errors', async () => {
      issueTrackingService.create.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .post('/issues')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Test', description: 'Test' })
        .expect(500);
    });
  });

  describe('GET /issues', () => {
    it('should return all issues with pagination', async () => {
      const paginatedResult = {
        data: [mockIssue],
        total: 1,
        page: 1,
        limit: 10,
      };

      issueTrackingService.findAll.mockResolvedValue(paginatedResult as any);

      const response = await request(app.getHttpServer())
        .get('/issues')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(paginatedResult);
      expect(issueTrackingService.findAll).toHaveBeenCalledWith(mockUser, {
        page: undefined,
        limit: undefined,
        status: undefined,
      });
    });

    it('should return issues with custom pagination', async () => {
      const paginatedResult = {
        data: [mockIssue],
        total: 50,
        page: 2,
        limit: 20,
      };

      issueTrackingService.findAll.mockResolvedValue(paginatedResult as any);

      const response = await request(app.getHttpServer())
        .get('/issues?page=2&limit=20')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(20);
      expect(issueTrackingService.findAll).toHaveBeenCalledWith(mockUser, {
        page: '2',
        limit: '20',
        status: undefined,
      });
    });

    it('should filter issues by status', async () => {
      const paginatedResult = {
        data: [mockIssue],
        total: 1,
        page: 1,
        limit: 10,
      };

      issueTrackingService.findAll.mockResolvedValue(paginatedResult as any);

      await request(app.getHttpServer())
        .get(`/issues?status=${IssueStatus.NEW}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(issueTrackingService.findAll).toHaveBeenCalledWith(mockUser, {
        page: undefined,
        limit: undefined,
        status: IssueStatus.NEW,
      });
    });

    it('should return empty array when no issues', async () => {
      const emptyResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      issueTrackingService.findAll.mockResolvedValue(emptyResult as any);

      const response = await request(app.getHttpServer())
        .get('/issues')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/issues')
        .expect(401);
    });
  });

  describe('GET /issues/:id', () => {
    it('should return issue by ID', async () => {
      issueTrackingService.findOne.mockResolvedValue(mockIssue as any);

      const response = await request(app.getHttpServer())
        .get('/issues/issue-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockIssue);
      expect(issueTrackingService.findOne).toHaveBeenCalledWith(mockUser, 'issue-123');
    });

    it('should return 404 when issue not found', async () => {
      issueTrackingService.findOne.mockRejectedValue(
        new HttpException('Issue with ID issue-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/issues/issue-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/issues/issue-123')
        .expect(401);
    });
  });

  describe('PUT /issues/:id', () => {
    it('should update issue successfully', async () => {
      const updateDto = {
        title: 'Updated Title',
        description: 'Updated description',
        priority: IssuePriority.CRITICAL,
      };

      const updatedIssue = { ...mockIssue, ...updateDto };
      issueTrackingService.update.mockResolvedValue(updatedIssue as any);

      const response = await request(app.getHttpServer())
        .put('/issues/issue-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.priority).toBe(IssuePriority.CRITICAL);
      expect(issueTrackingService.update).toHaveBeenCalledWith(mockUser, 'issue-123', updateDto);
    });

    it('should update partial fields', async () => {
      const updateDto = {
        priority: IssuePriority.LOW,
      };

      const updatedIssue = { ...mockIssue, priority: IssuePriority.LOW };
      issueTrackingService.update.mockResolvedValue(updatedIssue as any);

      const response = await request(app.getHttpServer())
        .put('/issues/issue-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.priority).toBe(IssuePriority.LOW);
    });

    it('should return 404 when issue not found', async () => {
      issueTrackingService.update.mockRejectedValue(
        new HttpException('Issue not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/issues/issue-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Test' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put('/issues/issue-123')
        .send({ title: 'Test' })
        .expect(401);
    });
  });

  describe('PATCH /issues/:id/status', () => {
    it('should update issue status to IN_PROGRESS', async () => {
      const updatedIssue = { ...mockIssue, status: IssueStatus.IN_PROGRESS };
      issueTrackingService.updateStatus.mockResolvedValue(updatedIssue as any);

      const response = await request(app.getHttpServer())
        .patch('/issues/issue-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: IssueStatus.IN_PROGRESS })
        .expect(200);

      expect(response.body.status).toBe(IssueStatus.IN_PROGRESS);
      expect(issueTrackingService.updateStatus).toHaveBeenCalledWith(
        mockUser,
        'issue-123',
        IssueStatus.IN_PROGRESS,
      );
    });

    it('should update issue status to RESOLVED', async () => {
      const resolvedIssue = {
        ...mockIssue,
        status: IssueStatus.RESOLVED,
        resolvedAt: '2024-01-15T12:00:00.000Z',
      };
      issueTrackingService.updateStatus.mockResolvedValue(resolvedIssue as any);

      const response = await request(app.getHttpServer())
        .patch('/issues/issue-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: IssueStatus.RESOLVED })
        .expect(200);

      expect(response.body.status).toBe(IssueStatus.RESOLVED);
      expect(response.body.resolvedAt).toBeDefined();
    });

    it('should update issue status to CLOSED', async () => {
      const closedIssue = {
        ...mockIssue,
        status: IssueStatus.CLOSED,
        closedAt: '2024-01-15T13:00:00.000Z',
      };
      issueTrackingService.updateStatus.mockResolvedValue(closedIssue as any);

      const response = await request(app.getHttpServer())
        .patch('/issues/issue-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: IssueStatus.CLOSED })
        .expect(200);

      expect(response.body.status).toBe(IssueStatus.CLOSED);
      expect(response.body.closedAt).toBeDefined();
    });

    it('should return 404 when issue not found', async () => {
      issueTrackingService.updateStatus.mockRejectedValue(
        new HttpException('Issue not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/issues/issue-999/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: IssueStatus.RESOLVED })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .patch('/issues/issue-123/status')
        .send({ status: IssueStatus.RESOLVED })
        .expect(401);
    });
  });

  describe('PATCH /issues/:id/assign', () => {
    it('should assign issue to user', async () => {
      const assignedIssue = { ...mockIssue, assigneeId: 'assignee-123' };
      issueTrackingService.assign.mockResolvedValue(assignedIssue as any);

      const response = await request(app.getHttpServer())
        .patch('/issues/issue-123/assign')
        .set('Authorization', 'Bearer manager-token')
        .send({ assigneeId: 'assignee-123' })
        .expect(200);

      expect(response.body.assigneeId).toBe('assignee-123');
      expect(issueTrackingService.assign).toHaveBeenCalledWith(
        mockManager,
        'issue-123',
        'assignee-123',
      );
    });

    it('should reassign issue to different user', async () => {
      const reassignedIssue = { ...mockIssue, assigneeId: 'new-assignee-456' };
      issueTrackingService.assign.mockResolvedValue(reassignedIssue as any);

      const response = await request(app.getHttpServer())
        .patch('/issues/issue-123/assign')
        .set('Authorization', 'Bearer manager-token')
        .send({ assigneeId: 'new-assignee-456' })
        .expect(200);

      expect(response.body.assigneeId).toBe('new-assignee-456');
    });

    it('should return 404 when issue not found', async () => {
      issueTrackingService.assign.mockRejectedValue(
        new HttpException('Issue not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/issues/issue-999/assign')
        .set('Authorization', 'Bearer manager-token')
        .send({ assigneeId: 'assignee-123' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .patch('/issues/issue-123/assign')
        .send({ assigneeId: 'assignee-123' })
        .expect(401);
    });
  });

  describe('POST /issues/:id/comments', () => {
    it('should add comment to issue', async () => {
      const commentDto = {
        content: 'This is a comment',
        isInternal: false,
      };

      issueTrackingService.addComment.mockResolvedValue(mockComment as any);

      const response = await request(app.getHttpServer())
        .post('/issues/issue-123/comments')
        .set('Authorization', 'Bearer valid-token')
        .send(commentDto)
        .expect(201);

      expect(response.body).toEqual(mockComment);
      expect(issueTrackingService.addComment).toHaveBeenCalledWith(
        mockUser,
        'issue-123',
        commentDto,
      );
    });

    it('should add internal comment', async () => {
      const commentDto = {
        content: 'Internal note',
        isInternal: true,
      };

      const internalComment = { ...mockComment, isInternal: true };
      issueTrackingService.addComment.mockResolvedValue(internalComment as any);

      const response = await request(app.getHttpServer())
        .post('/issues/issue-123/comments')
        .set('Authorization', 'Bearer valid-token')
        .send(commentDto)
        .expect(201);

      expect(response.body.isInternal).toBe(true);
    });

    it('should return 404 when issue not found', async () => {
      issueTrackingService.addComment.mockRejectedValue(
        new HttpException('Issue not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/issues/issue-999/comments')
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Test comment' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/issues/issue-123/comments')
        .send({ content: 'Test comment' })
        .expect(401);
    });
  });

  describe('GET /issues/:id/comments', () => {
    it('should return all comments for issue', async () => {
      const comments = [mockComment];
      issueTrackingService.getComments.mockResolvedValue(comments as any);

      const response = await request(app.getHttpServer())
        .get('/issues/issue-123/comments')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(comments);
      expect(issueTrackingService.getComments).toHaveBeenCalledWith(mockUser, 'issue-123');
    });

    it('should return empty array when no comments', async () => {
      issueTrackingService.getComments.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/issues/issue-123/comments')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 404 when issue not found', async () => {
      issueTrackingService.getComments.mockRejectedValue(
        new HttpException('Issue not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/issues/issue-999/comments')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/issues/issue-123/comments')
        .expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent issue creation', async () => {
      issueTrackingService.create.mockResolvedValue(mockIssue as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/issues')
            .set('Authorization', 'Bearer valid-token')
            .send({ title: 'Test', description: 'Test' }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle very long issue title', async () => {
      const longTitle = 'a'.repeat(500);
      issueTrackingService.create.mockResolvedValue({ ...mockIssue, title: longTitle } as any);

      await request(app.getHttpServer())
        .post('/issues')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: longTitle, description: 'Test' })
        .expect(201);
    });

    it('should handle very long issue description', async () => {
      const longDescription = 'a'.repeat(10000);
      issueTrackingService.create.mockResolvedValue({ ...mockIssue, description: longDescription } as any);

      await request(app.getHttpServer())
        .post('/issues')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Test', description: longDescription })
        .expect(201);
    });

    it('should handle special characters in title', async () => {
      const specialTitle = 'Bug: <script>alert("XSS")</script> & More!';
      issueTrackingService.create.mockResolvedValue({ ...mockIssue, title: specialTitle } as any);

      await request(app.getHttpServer())
        .post('/issues')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: specialTitle, description: 'Test' })
        .expect(201);
    });

    it('should handle pagination with large page numbers', async () => {
      const paginatedResult = {
        data: [],
        total: 1000,
        page: 100,
        limit: 10,
      };

      issueTrackingService.findAll.mockResolvedValue(paginatedResult as any);

      await request(app.getHttpServer())
        .get('/issues?page=100&limit=10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle multiple status updates in sequence', async () => {
      const statuses = [
        IssueStatus.IN_PROGRESS,
        IssueStatus.RESOLVED,
        IssueStatus.CLOSED,
      ];

      for (const status of statuses) {
        issueTrackingService.updateStatus.mockResolvedValue({ ...mockIssue, status } as any);

        await request(app.getHttpServer())
          .patch('/issues/issue-123/status')
          .set('Authorization', 'Bearer valid-token')
          .send({ status })
          .expect(200);
      }
    });

    it('should handle empty comment content gracefully', async () => {
      issueTrackingService.addComment.mockRejectedValue(
        new HttpException('Comment content cannot be empty', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/issues/issue-123/comments')
        .set('Authorization', 'Bearer valid-token')
        .send({ content: '' })
        .expect(400);
    });
  });
});

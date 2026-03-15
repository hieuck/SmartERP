import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { IssueTrackingService } from './issue-tracking.service';
import { Issue } from './entities/issue.entity';
import { IssueComment } from './entities/issue-comment.entity';
import { IssueAttachment } from './entities/issue-attachment.entity';
import { IssueStatus } from './enums/issue-status.enum';
import { IssuePriority } from './enums/issue-priority.enum';
import { IssueType } from './enums/issue-type.enum';
import { User } from '@/common/security/permission.service';

describe('IssueTrackingService', () => {
  let service: IssueTrackingService;
  let issueRepository: jest.Mocked<Repository<Issue>>;
  let commentRepository: jest.Mocked<Repository<IssueComment>>;
  let _attachmentRepository: jest.Mocked<Repository<IssueAttachment>>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockIssue: Issue = {
    id: 'issue-1',
    tenantId: 'tenant-1',
    reporterId: 'user-1',
    reference: 'ISS-2024-0001',
    title: 'Test Issue',
    description: 'Test description',
    status: IssueStatus.NEW,
    priority: IssuePriority.MEDIUM,
    type: IssueType.BUG,
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    closedAt: null,
    generateReference: jest.fn(),
  } as any;

  const mockComment: IssueComment = {
    id: 'comment-1',
    tenantId: 'tenant-1',
    issueId: 'issue-1',
    authorId: 'user-1',
    content: 'Test comment',
    isInternal: false,
    createdAt: new Date(),
  } as IssueComment;

  beforeEach(async () => {
    const mockIssueRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCommentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const mockAttachmentRepository = {
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssueTrackingService,
        {
          provide: getRepositoryToken(Issue),
          useValue: mockIssueRepository,
        },
        {
          provide: getRepositoryToken(IssueComment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(IssueAttachment),
          useValue: mockAttachmentRepository,
        },
      ],
    }).compile();

    service = module.get<IssueTrackingService>(IssueTrackingService);
    issueRepository = module.get(getRepositoryToken(Issue));
    commentRepository = module.get(getRepositoryToken(IssueComment));
    attachmentRepository = module.get(getRepositoryToken(IssueAttachment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create issue successfully', async () => {
      issueRepository.save.mockResolvedValue(mockIssue);

      const createDto = {
        title: 'Test Issue',
        description: 'Test description',
        priority: IssuePriority.MEDIUM,
        type: IssueType.BUG,
      };

      const result = await service.create(mockUser, createDto);

      expect(result).toEqual(mockIssue);
      expect(issueRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockUser.tenantId,
          reporterId: mockUser.id,
          title: createDto.title,
          description: createDto.description,
        }),
      );
    });

    it('should create issue with assignee', async () => {
      issueRepository.save.mockResolvedValue(mockIssue);

      const createDto = {
        title: 'Test Issue',
        description: 'Test description',
        assigneeId: 'user-2',
      };

      await service.create(mockUser, createDto);

      expect(issueRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeId: 'user-2',
        }),
      );
    });

    it('should create issue without optional fields', async () => {
      issueRepository.save.mockResolvedValue(mockIssue);

      const createDto = {
        title: 'Test Issue',
        description: 'Test description',
      };

      await service.create(mockUser, createDto);

      expect(issueRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated issues', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockIssue], 1]),
      };
      issueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(mockUser, { page: 1, limit: 10 });

      expect(result).toEqual({
        data: [mockIssue],
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('issue.tenantId = :tenantId', {
        tenantId: mockUser.tenantId,
      });
    });

    it('should filter by status', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockIssue], 1]),
      };
      issueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAll(mockUser, { status: IssueStatus.NEW });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('issue.status = :status', {
        status: IssueStatus.NEW,
      });
    });

    it('should use default pagination values', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      issueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(mockUser, {});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should calculate skip correctly for page 2', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      issueRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAll(mockUser, { page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
    });
  });

  describe('findOne', () => {
    it('should return issue with relations', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);

      const result = await service.findOne(mockUser, 'issue-1');

      expect(result).toEqual(mockIssue);
      expect(issueRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'issue-1', tenantId: mockUser.tenantId },
        relations: ['reporter', 'assignee', 'comments', 'attachments'],
      });
    });

    it('should throw NotFoundException when issue not found', async () => {
      issueRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUser, 'non-existent')).rejects.toThrow(
        'Issue with ID non-existent not found',
      );
    });
  });

  describe('update', () => {
    it('should update issue successfully', async () => {
      const updatedIssue = { ...mockIssue, title: 'Updated Title' };
      issueRepository.findOne.mockResolvedValue(mockIssue);
      issueRepository.save.mockResolvedValue(updatedIssue as any);

      const updateDto = { title: 'Updated Title' };
      const result = await service.update(mockUser, 'issue-1', updateDto);

      expect(result.title).toBe('Updated Title');
      expect(issueRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when issue not found', async () => {
      issueRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUser, 'non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status to RESOLVED and set resolvedAt', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);
      const resolvedIssue = {
        ...mockIssue,
        status: IssueStatus.RESOLVED,
        resolvedAt: new Date(),
      };
      issueRepository.save.mockResolvedValue(resolvedIssue as any);

      const result = await service.updateStatus(mockUser, 'issue-1', IssueStatus.RESOLVED);

      expect(result.status).toBe(IssueStatus.RESOLVED);
      expect(issueRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: IssueStatus.RESOLVED,
          resolvedAt: expect.any(Date),
        }),
      );
    });

    it('should update status to CLOSED and set closedAt', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);
      const closedIssue = {
        ...mockIssue,
        status: IssueStatus.CLOSED,
        closedAt: new Date(),
      };
      issueRepository.save.mockResolvedValue(closedIssue as any);

      const result = await service.updateStatus(mockUser, 'issue-1', IssueStatus.CLOSED);

      expect(result.status).toBe(IssueStatus.CLOSED);
      expect(issueRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: IssueStatus.CLOSED,
          closedAt: expect.any(Date),
        }),
      );
    });

    it('should update status without setting timestamps for other statuses', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);
      const inProgressIssue = {
        ...mockIssue,
        status: IssueStatus.IN_PROGRESS,
      };
      issueRepository.save.mockResolvedValue(inProgressIssue as any);

      await service.updateStatus(mockUser, 'issue-1', IssueStatus.IN_PROGRESS);

      expect(issueRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: IssueStatus.IN_PROGRESS,
        }),
      );
    });
  });

  describe('assign', () => {
    it('should assign issue to user', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);
      const assignedIssue = { ...mockIssue, assigneeId: 'user-2' };
      issueRepository.save.mockResolvedValue(assignedIssue as any);

      const result = await service.assign(mockUser, 'issue-1', 'user-2');

      expect(result.assigneeId).toBe('user-2');
      expect(issueRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeId: 'user-2',
        }),
      );
    });

    it('should throw NotFoundException when issue not found', async () => {
      issueRepository.findOne.mockResolvedValue(null);

      await expect(service.assign(mockUser, 'non-existent', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addComment', () => {
    it('should add comment to issue', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);
      commentRepository.create.mockReturnValue(mockComment as any);
      commentRepository.save.mockResolvedValue(mockComment);

      const commentDto = { content: 'Test comment' };
      const result = await service.addComment(mockUser, 'issue-1', commentDto);

      expect(result).toEqual(mockComment);
      expect(commentRepository.create).toHaveBeenCalledWith({
        tenantId: mockUser.tenantId,
        issueId: 'issue-1',
        authorId: mockUser.id,
        content: 'Test comment',
        isInternal: false,
      });
    });

    it('should add internal comment', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);
      commentRepository.create.mockReturnValue(mockComment as any);
      commentRepository.save.mockResolvedValue(mockComment);

      const commentDto = { content: 'Internal note', isInternal: true };
      await service.addComment(mockUser, 'issue-1', commentDto);

      expect(commentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isInternal: true,
        }),
      );
    });

    it('should throw NotFoundException when issue not found', async () => {
      issueRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addComment(mockUser, 'non-existent', { content: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getComments', () => {
    it('should return comments for issue', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);
      commentRepository.find.mockResolvedValue([mockComment]);

      const result = await service.getComments(mockUser, 'issue-1');

      expect(result).toEqual([mockComment]);
      expect(commentRepository.find).toHaveBeenCalledWith({
        where: { issueId: 'issue-1', tenantId: mockUser.tenantId },
        relations: ['author'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when no comments', async () => {
      issueRepository.findOne.mockResolvedValue(mockIssue);
      commentRepository.find.mockResolvedValue([]);

      const result = await service.getComments(mockUser, 'issue-1');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when issue not found', async () => {
      issueRepository.findOne.mockResolvedValue(null);

      await expect(service.getComments(mockUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

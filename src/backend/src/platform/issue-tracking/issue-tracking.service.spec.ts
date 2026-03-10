import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueTrackingService } from './issue-tracking.service';
import { Issue, IssueStatus, IssuePriority, IssueType } from './entities/issue.entity';
import { IssueComment } from './entities/issue-comment.entity';
import { IssueAttachment } from './entities/issue-attachment.entity';
import { User } from '../../core/user/entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('IssueTrackingService', () => {
  let service: IssueTrackingService;
  let issueRepository: Repository<Issue>;
  let commentRepository: Repository<IssueComment>;
  let attachmentRepository: Repository<IssueAttachment>;

  const mockUser: User = {
    id: 'user1',
    tenantId: 'tenant1',
    email: 'test@example.com',
    password: 'hashed',
    role: 'user',
    roles: ['user'],
    status: 'active',
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  } as User;

  const mockIssue: Issue = {
    id: '1',
    tenantId: 'tenant1',
    reference: 'ISS-2026-0001',
    title: 'Test Issue',
    description: 'Test Description',
    status: IssueStatus.NEW,
    priority: IssuePriority.MEDIUM,
    type: IssueType.BUG,
    reporterId: mockUser.id,
    reporter: mockUser,
    assigneeId: null,
    assignee: null,
    comments: [],
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    closedAt: null,
    generateReference: jest.fn()
  };

  const mockIssueRepository = {
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
  };
      return queryBuilder;
    })
  };

  const mockCommentRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn()
  };

  const mockAttachmentRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssueTrackingService,
        {
          provide: getRepositoryToken(Issue),
          useValue: mockIssueRepository
  },
        {
          provide: getRepositoryToken(IssueComment),
          useValue: mockCommentRepository
  },
        {
          provide: getRepositoryToken(IssueAttachment),
          useValue: mockAttachmentRepository
  },
      ]
  }).compile();

    service = module.get<IssueTrackingService>(IssueTrackingService);
    issueRepository = module.get<Repository<Issue>>(getRepositoryToken(Issue));
    commentRepository = module.get<Repository<IssueComment>>(getRepositoryToken(IssueComment));
    attachmentRepository = module.get<Repository<IssueAttachment>>(getRepositoryToken(IssueAttachment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new issue', async () => {
      const createDto = {
        title: 'Test Issue',
        description: 'Test Description',
        priority: IssuePriority.HIGH,
        type: IssueType.BUG
  };

      mockIssueRepository.create.mockReturnValue(mockIssue);
      mockIssueRepository.save.mockResolvedValue(mockIssue);

      const result = await service.create(mockUser, createDto);

      expect(result).toEqual(mockIssue);
      expect(mockIssueRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: mockUser.tenantId,
        reporterId: mockUser.id
  });
      expect(mockIssueRepository.save).toHaveBeenCalledWith(mockIssue);
    });
  });

  describe('findAll', () => {
    it('should return paginated issues', async () => {
      const issues = [mockIssue];
      
      // Reset mock và setup lại cho test này
      mockIssueRepository.createQueryBuilder.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([issues, 1])
  });

      const result = await service.findAll(mockUser, { page: 1, limit: 10 });

      expect(result).toEqual({
        data: issues,
        total: 1,
        page: 1,
        limit: 10
  });
    });
  });

  describe('findOne', () => {
    it('should return an issue by id', async () => {
      mockIssueRepository.findOne.mockResolvedValue(mockIssue);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockIssue);
      expect(mockIssueRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', tenantId: mockUser.tenantId },
        relations: ['reporter', 'assignee', 'comments', 'attachments']
  });
    });

    it('should throw NotFoundException if issue not found', async () => {
      mockIssueRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an issue', async () => {
      const updateDto = { title: 'Updated Title' };
      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      mockIssueRepository.save.mockResolvedValue({ ...mockIssue, ...updateDto });

      const result = await service.update(mockUser, '1', updateDto);

      expect(result.title).toBe('Updated Title');
      expect(mockIssueRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update issue status to IN_PROGRESS', async () => {
      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      mockIssueRepository.save.mockResolvedValue({
        ...mockIssue,
        status: IssueStatus.IN_PROGRESS
  });

      const result = await service.updateStatus(mockUser, '1', IssueStatus.IN_PROGRESS);

      expect(result.status).toBe(IssueStatus.IN_PROGRESS);
    });

    it('should set resolvedAt when status is RESOLVED', async () => {
      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      const resolvedIssue = {
        ...mockIssue,
        status: IssueStatus.RESOLVED,
        resolvedAt: new Date()
  };
      mockIssueRepository.save.mockResolvedValue(resolvedIssue);

      const result = await service.updateStatus(mockUser, '1', IssueStatus.RESOLVED);

      expect(result.status).toBe(IssueStatus.RESOLVED);
      expect(result.resolvedAt).toBeDefined();
    });

    it('should set closedAt when status is CLOSED', async () => {
      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      const closedIssue = {
        ...mockIssue,
        status: IssueStatus.CLOSED,
        closedAt: new Date()
  };
      mockIssueRepository.save.mockResolvedValue(closedIssue);

      const result = await service.updateStatus(mockUser, '1', IssueStatus.CLOSED);

      expect(result.status).toBe(IssueStatus.CLOSED);
      expect(result.closedAt).toBeDefined();
    });
  });

  describe('assign', () => {
    it('should assign issue to a user', async () => {
      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      mockIssueRepository.save.mockResolvedValue({
        ...mockIssue,
        assigneeId: 'user2'
  });

      const result = await service.assign(mockUser, '1', 'user2');

      expect(result.assigneeId).toBe('user2');
    });
  });

  describe('addComment', () => {
    it('should add a comment to an issue', async () => {
      const commentDto = { content: 'Test comment', isInternal: false };
      const mockComment = {
        id: '1',
        tenantId: mockUser.tenantId,
        issueId: '1',
        authorId: mockUser.id,
        content: 'Test comment',
        isInternal: false,
        createdAt: new Date()
  };

      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);

      const result = await service.addComment(mockUser, '1', commentDto);

      expect(result).toEqual(mockComment);
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        tenantId: mockUser.tenantId,
        issueId: '1',
        authorId: mockUser.id,
        content: commentDto.content,
        isInternal: commentDto.isInternal
  });
    });
  });

  describe('getComments', () => {
    it('should return all comments for an issue', async () => {
      const mockComments = [
        {
          id: '1',
          content: 'Comment 1',
          isInternal: false
  },
      ];

      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      mockCommentRepository.find.mockResolvedValue(mockComments);

      const result = await service.getComments(mockUser, '1');

      expect(result).toEqual(mockComments);
    });
  });
});

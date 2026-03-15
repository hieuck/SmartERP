import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalRequest } from './entities/approval-request.entity';
import { Workflow } from './entities/workflow.entity';
import { PermissionService } from '@/common/security/permission.service';
import { User } from '@core/user/entities/user.entity';
import { ApprovalStatus } from './enums';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let approvalRepository: jest.Mocked<Repository<ApprovalRequest>>;
  let workflowRepository: jest.Mocked<Repository<Workflow>>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'user@test.com',
    password: 'hashed',
    role: 'user',
    roles: ['manager'],
    status: 'active',
    isActive: true,
    emailVerified: true,
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockApprover: User = {
    id: 'approver-1',
    tenantId: 'tenant-1',
    email: 'approver@test.com',
    password: 'hashed',
    role: 'approver',
    roles: ['approver'],
    status: 'active',
    isActive: true,
    emailVerified: true,
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockWorkflow: Partial<Workflow> = {
    id: 'workflow-1',
    tenantId: 'tenant-1',
    name: 'Purchase Order Approval',
    entityType: 'PurchaseOrder',
    states: [
      { name: 'pending_approval', allowedRoles: ['approver', 'manager'] },
      { name: 'approved', allowedRoles: ['approver', 'manager'] },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockApprovalRequest: Partial<ApprovalRequest> = {
    id: 'request-1',
    tenantId: 'tenant-1',
    entityType: 'PurchaseOrder',
    entityId: 'po-1',
    workflowId: 'workflow-1',
    currentState: 'pending_approval',
    requestedBy: 'user-1',
    status: ApprovalStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockApprovalRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockWorkflowRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockPermissionService = {
      checkPermission: jest.fn().mockResolvedValue(true),
      filterByTenant: jest.fn((user, entities) => entities),
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, query) => query),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        { provide: getRepositoryToken(ApprovalRequest), useValue: mockApprovalRepo },
        { provide: getRepositoryToken(Workflow), useValue: mockWorkflowRepo },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
    approvalRepository = module.get(getRepositoryToken(ApprovalRequest));
    workflowRepository = module.get(getRepositoryToken(Workflow));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitForApproval', () => {
    it('should submit approval request successfully', async () => {
      workflowRepository.findOne.mockResolvedValue(mockWorkflow as Workflow);
      approvalRepository.create.mockReturnValue(mockApprovalRequest as ApprovalRequest);
      approvalRepository.save.mockResolvedValue(mockApprovalRequest as ApprovalRequest);

      const result = await service.submitForApproval('PurchaseOrder', 'po-1', mockUser);

      expect(workflowRepository.findOne).toHaveBeenCalledWith({
        where: { entityType: 'PurchaseOrder' },
      });
      expect(approvalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'PurchaseOrder',
          entityId: 'po-1',
          workflowId: 'workflow-1',
          requestedBy: mockUser.id,
          status: ApprovalStatus.PENDING,
          tenantId: mockUser.tenantId,
        }),
      );
      expect(result).toEqual(mockApprovalRequest);
    });

    it('should throw NotFoundException when workflow not found', async () => {
      workflowRepository.findOne.mockResolvedValue(null);

      await expect(service.submitForApproval('InvalidType', 'entity-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('should approve request successfully', async () => {
      const pendingRequest = { ...mockApprovalRequest, status: ApprovalStatus.PENDING };
      approvalRepository.findOne.mockResolvedValue(pendingRequest as ApprovalRequest);
      workflowRepository.findOne.mockResolvedValue(mockWorkflow as Workflow);
      approvalRepository.save.mockResolvedValue({
        ...pendingRequest,
        status: ApprovalStatus.APPROVED,
        approvedBy: mockApprover.id,
        approvedAt: new Date(),
      } as ApprovalRequest);

      const result = await service.approve('request-1', mockApprover);

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(result.approvedBy).toBe(mockApprover.id);
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw BadRequestException when request is not pending', async () => {
      const approvedRequest = { ...mockApprovalRequest, status: ApprovalStatus.APPROVED };
      approvalRepository.findOne.mockResolvedValue(approvedRequest as ApprovalRequest);

      await expect(service.approve('request-1', mockApprover)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when user cannot approve', async () => {
      const unauthorizedUser = { ...mockUser, roles: ['user'] };
      const pendingRequest = { ...mockApprovalRequest, status: ApprovalStatus.PENDING };
      approvalRepository.findOne.mockResolvedValue(pendingRequest as ApprovalRequest);
      workflowRepository.findOne.mockResolvedValue(mockWorkflow as Workflow);

      await expect(service.approve('request-1', unauthorizedUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('reject', () => {
    it('should reject request successfully with reason', async () => {
      const pendingRequest = { ...mockApprovalRequest, status: ApprovalStatus.PENDING };
      approvalRepository.findOne.mockResolvedValue(pendingRequest as ApprovalRequest);
      workflowRepository.findOne.mockResolvedValue(mockWorkflow as Workflow);
      approvalRepository.save.mockResolvedValue({
        ...pendingRequest,
        status: ApprovalStatus.REJECTED,
        approvedBy: mockApprover.id,
        approvedAt: new Date(),
        rejectionReason: 'Budget exceeded',
      } as ApprovalRequest);

      const result = await service.reject('request-1', mockApprover, 'Budget exceeded');

      expect(result.status).toBe(ApprovalStatus.REJECTED);
      expect(result.rejectionReason).toBe('Budget exceeded');
      expect(result.approvedBy).toBe(mockApprover.id);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      const rejectedRequest = { ...mockApprovalRequest, status: ApprovalStatus.REJECTED };
      approvalRepository.findOne.mockResolvedValue(rejectedRequest as ApprovalRequest);

      await expect(service.reject('request-1', mockApprover, 'Reason')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException when user cannot reject', async () => {
      const unauthorizedUser = { ...mockUser, roles: ['user'] };
      const pendingRequest = { ...mockApprovalRequest, status: ApprovalStatus.PENDING };
      approvalRepository.findOne.mockResolvedValue(pendingRequest as ApprovalRequest);
      workflowRepository.findOne.mockResolvedValue(mockWorkflow as Workflow);

      await expect(service.reject('request-1', unauthorizedUser, 'Reason')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel request successfully by requester', async () => {
      const pendingRequest = { ...mockApprovalRequest, status: ApprovalStatus.PENDING };
      approvalRepository.findOne.mockResolvedValue(pendingRequest as ApprovalRequest);
      approvalRepository.save.mockResolvedValue({
        ...pendingRequest,
        status: ApprovalStatus.CANCELLED,
      } as ApprovalRequest);

      const result = await service.cancel(mockUser, 'request-1');

      expect(result.status).toBe(ApprovalStatus.CANCELLED);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      const approvedRequest = { ...mockApprovalRequest, status: ApprovalStatus.APPROVED };
      approvalRepository.findOne.mockResolvedValue(approvedRequest as ApprovalRequest);

      await expect(service.cancel(mockUser, 'request-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when non-requester tries to cancel', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      const pendingRequest = { ...mockApprovalRequest, status: ApprovalStatus.PENDING };
      approvalRepository.findOne.mockResolvedValue(pendingRequest as ApprovalRequest);

      await expect(service.cancel(otherUser, 'request-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyRequests', () => {
    it('should return user requests ordered by creation date', async () => {
      approvalRepository.find.mockResolvedValue([mockApprovalRequest as ApprovalRequest]);

      const result = await service.getMyRequests(mockUser);

      expect(approvalRepository.find).toHaveBeenCalledWith({
        where: { requestedBy: mockUser.id },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockApprovalRequest]);
    });

    it('should return empty array when no requests', async () => {
      approvalRepository.find.mockResolvedValue([]);

      const result = await service.getMyRequests(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('getPendingApprovals', () => {
    it('should return pending requests user can approve', async () => {
      approvalRepository.find.mockResolvedValue([mockApprovalRequest as ApprovalRequest]);
      workflowRepository.find.mockResolvedValue([mockWorkflow as Workflow]);

      const result = await service.getPendingApprovals(mockApprover);

      expect(result).toEqual([mockApprovalRequest]);
    });

    it('should filter out requests user cannot approve', async () => {
      const unauthorizedUser = { ...mockUser, roles: ['user'] };
      approvalRepository.find.mockResolvedValue([mockApprovalRequest as ApprovalRequest]);
      workflowRepository.find.mockResolvedValue([mockWorkflow as Workflow]);

      const result = await service.getPendingApprovals(unauthorizedUser);

      expect(result).toEqual([]);
    });

    it('should return empty array when no pending requests', async () => {
      approvalRepository.find.mockResolvedValue([]);
      workflowRepository.find.mockResolvedValue([]);

      const result = await service.getPendingApprovals(mockApprover);

      expect(result).toEqual([]);
    });

    it('should handle workflow not found in map', async () => {
      const requestWithInvalidWorkflow = { ...mockApprovalRequest, workflowId: 'invalid-workflow' };
      approvalRepository.find.mockResolvedValue([requestWithInvalidWorkflow as ApprovalRequest]);
      workflowRepository.find.mockResolvedValue([mockWorkflow as Workflow]);

      const result = await service.getPendingApprovals(mockApprover);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when request not found', async () => {
      approvalRepository.findOne.mockResolvedValue(null);

      await expect(service['findOne']('invalid-id', mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});

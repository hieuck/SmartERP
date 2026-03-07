import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalService } from './approval.service';
import { ApprovalRequest, ApprovalStatus } from './entities/approval-request.entity';
import { Workflow } from './entities/workflow.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createMockUser } from '@/common/test/test-helpers';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let approvalRepository: Repository<ApprovalRequest>;
  let workflowRepository: Repository<Workflow>;
  let permissionService: PermissionService;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    roles: ['user'],
  };

  const mockManager: User = {
    id: 'manager-1',
    email: 'manager@example.com',
    tenantId: 'tenant-1',
    roles: ['manager'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        {
          provide: getRepositoryToken(ApprovalRequest),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Workflow),
          useClass: Repository,
        },
        {
          provide: PermissionService,
          useValue: {
            checkPermission: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
    approvalRepository = module.get(getRepositoryToken(ApprovalRequest));
    workflowRepository = module.get(getRepositoryToken(Workflow));
    permissionService = module.get(PermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitForApproval', () => {
    it('should create approval request', async () => {
      const workflow = {
        id: 'workflow-1',
        entityType: 'SalesOrder',
        states: [
          { name: 'draft', allowedRoles: ['user'] },
          { name: 'pending_approval', allowedRoles: ['manager'] },
          { name: 'approved', allowedRoles: ['manager'] },
        ],
      };

      const savedRequest = {
        id: 'request-1',
        entityType: 'SalesOrder',
        entityId: 'order-1',
        workflowId: 'workflow-1',
        currentState: 'pending_approval',
        requestedBy: mockUser.id,
        status: ApprovalStatus.PENDING,
        tenantId: mockUser.tenantId,
      };

      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(workflow as any);
      jest.spyOn(approvalRepository, 'create').mockReturnValue(savedRequest as any);
      jest.spyOn(approvalRepository, 'save').mockResolvedValue(savedRequest as any);
      jest.spyOn(service as any, 'notifyApprovers').mockResolvedValue(undefined);

      const result = await service.submitForApproval(
        'SalesOrder',
        'order-1',
        mockUser,
      );

      expect(result.status).toBe(ApprovalStatus.PENDING);
      expect(result.currentState).toBe('pending_approval');
      expect(approvalRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if workflow not found', async () => {
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.submitForApproval('SalesOrder', 'order-1', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve pending request', async () => {
      const request = {
        id: 'request-1',
        entityType: 'SalesOrder',
        entityId: 'order-1',
        workflowId: 'workflow-1',
        status: ApprovalStatus.PENDING,
        tenantId: mockUser.tenantId,
      };

      const workflow = {
        id: 'workflow-1',
        entityType: 'SalesOrder',
        states: [
          { name: 'pending_approval', allowedRoles: ['manager'] },
          { name: 'approved', allowedRoles: ['manager'] },
        ],
      };

      jest.spyOn(approvalRepository, 'findOne').mockResolvedValue(request as any);
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(workflow as any);
      jest.spyOn(service as any, 'canApprove').mockReturnValue(true);
      jest.spyOn(approvalRepository, 'save').mockResolvedValue({
        ...request,
        status: ApprovalStatus.APPROVED,
        approvedBy: mockManager.id,
      } as any);
      jest.spyOn(service as any, 'updateEntityState').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'notifyRequester').mockResolvedValue(undefined);

      const result = await service.approve('request-1', mockManager);

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(result.approvedBy).toBe(mockManager.id);
      expect(approvalRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user cannot approve', async () => {
      const request = {
        id: 'request-1',
        status: ApprovalStatus.PENDING,
        tenantId: mockUser.tenantId,
      };

      const workflow = {
        id: 'workflow-1',
        states: [{ name: 'pending_approval', allowedRoles: ['manager'] }],
      };

      jest.spyOn(approvalRepository, 'findOne').mockResolvedValue(request as any);
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(workflow as any);
      jest.spyOn(service as any, 'canApprove').mockReturnValue(false);

      await expect(service.approve('request-1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if request not pending', async () => {
      const request = {
        id: 'request-1',
        status: ApprovalStatus.APPROVED,
        tenantId: mockUser.tenantId,
      };

      jest.spyOn(approvalRepository, 'findOne').mockResolvedValue(request as any);

      await expect(service.approve('request-1', mockManager)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('should reject pending request with reason', async () => {
      const request = {
        id: 'request-1',
        status: ApprovalStatus.PENDING,
        tenantId: mockUser.tenantId,
      };

      const workflow = {
        id: 'workflow-1',
        states: [{ name: 'pending_approval', allowedRoles: ['manager'] }],
      };

      jest.spyOn(approvalRepository, 'findOne').mockResolvedValue(request as any);
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(workflow as any);
      jest.spyOn(service as any, 'canApprove').mockReturnValue(true);
      jest.spyOn(approvalRepository, 'save').mockResolvedValue({
        ...request,
        status: ApprovalStatus.REJECTED,
        approvedBy: mockManager.id,
        rejectionReason: 'Invalid data',
      } as any);
      jest.spyOn(service as any, 'updateEntityState').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'notifyRequester').mockResolvedValue(undefined);

      const result = await service.reject('request-1', mockManager, 'Invalid data');

      expect(result.status).toBe(ApprovalStatus.REJECTED);
      expect(result.rejectionReason).toBe('Invalid data');
    });
  });

  describe('cancel', () => {
    it('should allow requester to cancel their own request', async () => {
      const request = {
        id: 'request-1',
        status: ApprovalStatus.PENDING,
        requestedBy: mockUser.id,
        tenantId: mockUser.tenantId,
      };

      jest.spyOn(approvalRepository, 'findOne').mockResolvedValue(request as any);
      jest.spyOn(approvalRepository, 'save').mockResolvedValue({
        ...request,
        status: ApprovalStatus.CANCELLED,
      } as any);

      const result = await service.cancel('request-1', mockUser);

      expect(result.status).toBe(ApprovalStatus.CANCELLED);
    });

    it('should throw ForbiddenException if user is not requester', async () => {
      const request = {
        id: 'request-1',
        status: ApprovalStatus.PENDING,
        requestedBy: 'other-user',
        tenantId: mockUser.tenantId,
      };

      jest.spyOn(approvalRepository, 'findOne').mockResolvedValue(request as any);

      await expect(service.cancel('request-1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMyRequests', () => {
    it('should return requests created by user', async () => {
      const requests = [
        {
          id: 'request-1',
          requestedBy: mockUser.id,
          status: ApprovalStatus.PENDING,
        },
        {
          id: 'request-2',
          requestedBy: mockUser.id,
          status: ApprovalStatus.APPROVED,
        },
      ];

      jest.spyOn(approvalRepository, 'find').mockResolvedValue(requests as any);

      const result = await service.getMyRequests(mockUser);

      expect(result).toHaveLength(2);
      expect(approvalRepository.find).toHaveBeenCalledWith({
        where: { requestedBy: mockUser.id, tenantId: mockUser.tenantId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getPendingApprovals', () => {
    it('should return pending requests for approver role', async () => {
      const requests = [
        {
          id: 'request-1',
          status: ApprovalStatus.PENDING,
          workflowId: 'workflow-1',
        },
      ];

      const workflows = [
        {
          id: 'workflow-1',
          states: [{ name: 'pending_approval', allowedRoles: ['manager'] }],
        },
      ];

      jest.spyOn(approvalRepository, 'find').mockResolvedValue(requests as any);
      jest.spyOn(workflowRepository, 'find').mockResolvedValue(workflows as any);

      const result = await service.getPendingApprovals(mockManager);

      expect(result).toHaveLength(1);
    });
  });
});

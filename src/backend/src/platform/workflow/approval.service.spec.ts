import { PermissionService, User } from '@/common/security/permission.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApprovalService } from './approval.service';
import { ApprovalRequest, ApprovalStatus } from '@platform/enums/platform.enum';
import { Workflow } from '@platform/enums/platform.enum';

describe('ApprovalService', () => {
  let service: ApprovalService;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['user'],
  };

  const mockManager: User = {
    id: 'manager-1',
    tenantId: 'tenant-1',
    roles: ['manager'],
  };

  const mockApprovalRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    metadata: {
      tableName: 'approval_requests',
      name: 'ApprovalRequest',
      columns: [],
      relations: [],
    },
  };

  const mockWorkflowRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    metadata: {
      tableName: 'workflows',
      name: 'Workflow',
      columns: [],
      relations: [],
    },
  };

  const mockPermissionService = {
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
    buildSecureQuery: jest.fn((user, query) => query),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        {
          provide: getRepositoryToken(ApprovalRequest),
          useValue: mockApprovalRepository,
        },
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockWorkflowRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);

    // Mock SecureRepository methods
    jest.spyOn(service['secureApprovalRepo'], 'find').mockImplementation(async () => []);
    jest.spyOn(service['secureApprovalRepo'], 'findOne').mockImplementation(async () => null);
    jest
      .spyOn(service['secureApprovalRepo'], 'save')
      .mockImplementation(async (_user, data: any) => data);

    jest.spyOn(service['secureWorkflowRepo'], 'find').mockImplementation(async () => []);
    jest.spyOn(service['secureWorkflowRepo'], 'findOne').mockImplementation(async () => null);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitForApproval', () => {
    it('should create approval request', async () => {
      const workflow = {
        id: 'workflow-1',
        entityType: 'SalesOrder',
        tenantId: 'tenant-1',
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

      jest.spyOn(service['secureWorkflowRepo'], 'findOne').mockResolvedValue(workflow as any);
      mockApprovalRepository.create.mockReturnValue(savedRequest);
      jest.spyOn(service['secureApprovalRepo'], 'save').mockResolvedValue(savedRequest as any);
      jest.spyOn(service as any, 'notifyApprovers').mockResolvedValue(undefined);

      const result = await service.submitForApproval('SalesOrder', 'order-1', mockUser);

      expect(result.status).toBe(ApprovalStatus.PENDING);
      expect(result.currentState).toBe('pending_approval');
      expect(service['secureApprovalRepo'].save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if workflow not found', async () => {
      jest.spyOn(service['secureWorkflowRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.submitForApproval('SalesOrder', 'order-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
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
        tenantId: 'tenant-1',
        states: [
          { name: 'pending_approval', allowedRoles: ['manager'] },
          { name: 'approved', allowedRoles: ['manager'] },
        ],
      };

      jest.spyOn(service['secureApprovalRepo'], 'findOne').mockResolvedValue(request as any);
      jest.spyOn(service['secureWorkflowRepo'], 'findOne').mockResolvedValue(workflow as any);
      jest.spyOn(service as any, 'canApprove').mockReturnValue(true);
      jest.spyOn(service['secureApprovalRepo'], 'save').mockResolvedValue({
        ...request,
        status: ApprovalStatus.APPROVED,
        approvedBy: mockManager.id,
      } as any);
      jest.spyOn(service as any, 'updateEntityState').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'notifyRequester').mockResolvedValue(undefined);

      const result = await service.approve('request-1', mockManager);

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(result.approvedBy).toBe(mockManager.id);
      expect(service['secureApprovalRepo'].save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user cannot approve', async () => {
      const request = {
        id: 'request-1',
        entityType: 'SalesOrder',
        status: ApprovalStatus.PENDING,
        tenantId: mockUser.tenantId,
      };

      const workflow = {
        id: 'workflow-1',
        entityType: 'SalesOrder',
        tenantId: 'tenant-1',
        states: [{ name: 'pending_approval', allowedRoles: ['manager'] }],
      };

      jest.spyOn(service['secureApprovalRepo'], 'findOne').mockResolvedValue(request as any);
      jest.spyOn(service['secureWorkflowRepo'], 'findOne').mockResolvedValue(workflow as any);
      jest.spyOn(service as any, 'canApprove').mockReturnValue(false);

      await expect(service.approve('request-1', mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if request not pending', async () => {
      const request = {
        id: 'request-1',
        status: ApprovalStatus.APPROVED,
        tenantId: mockUser.tenantId,
      };

      jest.spyOn(service['secureApprovalRepo'], 'findOne').mockResolvedValue(request as any);

      await expect(service.approve('request-1', mockManager)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject pending request with reason', async () => {
      const request = {
        id: 'request-1',
        entityType: 'SalesOrder',
        status: ApprovalStatus.PENDING,
        tenantId: mockUser.tenantId,
      };

      const workflow = {
        id: 'workflow-1',
        entityType: 'SalesOrder',
        tenantId: 'tenant-1',
        states: [{ name: 'pending_approval', allowedRoles: ['manager'] }],
      };

      jest.spyOn(service['secureApprovalRepo'], 'findOne').mockResolvedValue(request as any);
      jest.spyOn(service['secureWorkflowRepo'], 'findOne').mockResolvedValue(workflow as any);
      jest.spyOn(service as any, 'canApprove').mockReturnValue(true);
      jest.spyOn(service['secureApprovalRepo'], 'save').mockResolvedValue({
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

      jest.spyOn(service['secureApprovalRepo'], 'findOne').mockResolvedValue(request as any);
      jest.spyOn(service['secureApprovalRepo'], 'save').mockResolvedValue({
        ...request,
        status: ApprovalStatus.CANCELLED,
      } as any);

      const result = await service.cancel(mockUser, 'request-1');

      expect(result.status).toBe(ApprovalStatus.CANCELLED);
    });

    it('should throw ForbiddenException if user is not requester', async () => {
      const request = {
        id: 'request-1',
        status: ApprovalStatus.PENDING,
        requestedBy: 'other-user',
        tenantId: mockUser.tenantId,
      };

      jest.spyOn(service['secureApprovalRepo'], 'findOne').mockResolvedValue(request as any);

      await expect(service.cancel(mockUser, 'request-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyRequests', () => {
    it('should return requests created by user', async () => {
      const requests = [
        {
          id: 'request-1',
          requestedBy: mockUser.id,
          status: ApprovalStatus.PENDING,
          tenantId: 'tenant-1',
        },
        {
          id: 'request-2',
          requestedBy: mockUser.id,
          status: ApprovalStatus.APPROVED,
          tenantId: 'tenant-1',
        },
      ];

      jest.spyOn(service['secureApprovalRepo'], 'find').mockResolvedValue(requests as any);

      const result = await service.getMyRequests(mockUser);

      expect(result).toHaveLength(2);
      expect(service['secureApprovalRepo'].find).toHaveBeenCalledWith(mockUser, {
        where: { requestedBy: mockUser.id },
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
          tenantId: 'tenant-1',
        },
      ];

      const workflows = [
        {
          id: 'workflow-1',
          tenantId: 'tenant-1',
          states: [{ name: 'pending_approval', allowedRoles: ['manager'] }],
        },
      ];

      jest.spyOn(service['secureApprovalRepo'], 'find').mockResolvedValue(requests as any);
      jest.spyOn(service['secureWorkflowRepo'], 'find').mockResolvedValue(workflows as any);

      const result = await service.getPendingApprovals(mockManager);

      expect(result).toHaveLength(1);
    });
  });
});

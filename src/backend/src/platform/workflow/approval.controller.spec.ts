import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { User } from '@/common/security/permission.service';
import { SubmitApprovalDto, RejectApprovalDto } from './dto/approval.dto';

describe('ApprovalController', () => {
  let controller: ApprovalController;
  let _service: ApprovalService;

  const mockUser: User = {
    id: 'user-1',
    email: 'user@test.com',
    tenantId: 'tenant-1',
    roles: ['user'],
  } as User;

  const mockManagerUser: User = {
    id: 'manager-1',
    email: 'manager@test.com',
    tenantId: 'tenant-1',
    roles: ['manager'],
  } as User;

  const mockApprovalService = {
    submitForApproval: jest.fn(),
    getMyRequests: jest.fn(),
    getPendingApprovals: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalController],
      providers: [
        {
          provide: ApprovalService,
          useValue: mockApprovalService,
        },
      ],
    }).compile();

    controller = module.get<ApprovalController>(ApprovalController);
    service = module.get<ApprovalService>(ApprovalService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /approvals', () => {
    it('should submit entity for approval successfully', async () => {
      const submitDto: SubmitApprovalDto = {
        entityType: 'PurchaseOrder',
        entityId: 'po-123',
      };

      const expectedResult = {
        id: 'approval-1',
        entityType: submitDto.entityType,
        entityId: submitDto.entityId,
        status: 'pending',
        requestedBy: mockUser.id,
        createdAt: new Date(),
      };

      mockApprovalService.submitForApproval.mockResolvedValue(expectedResult);

      const result = await controller.submitForApproval(mockUser, submitDto);

      expect(result).toEqual(expectedResult);
      expect(mockApprovalService.submitForApproval).toHaveBeenCalledWith(
        submitDto.entityType,
        submitDto.entityId,
        mockUser,
      );
      expect(mockApprovalService.submitForApproval).toHaveBeenCalledTimes(1);
    });

    it('should handle different entity types', async () => {
      const entityTypes = ['Invoice', 'Expense', 'LeaveRequest', 'TimeOff'];

      for (const entityType of entityTypes) {
        const submitDto: SubmitApprovalDto = {
          entityType,
          entityId: `${entityType.toLowerCase()}-123`,
        };

        mockApprovalService.submitForApproval.mockResolvedValue({
          id: 'approval-1',
          entityType,
          status: 'pending',
        });

        const result = await controller.submitForApproval(mockUser, submitDto);

        expect(result.entityType).toBe(entityType);
        expect(mockApprovalService.submitForApproval).toHaveBeenCalledWith(
          entityType,
          submitDto.entityId,
          mockUser,
        );
      }
    });

    it('should handle invalid entity type', async () => {
      const submitDto: SubmitApprovalDto = {
        entityType: 'InvalidType',
        entityId: 'invalid-123',
      };

      const error = new Error('Invalid entity type');
      mockApprovalService.submitForApproval.mockRejectedValue(error);

      await expect(controller.submitForApproval(mockUser, submitDto)).rejects.toThrow(error);
    });

    it('should handle non-existent entity', async () => {
      const submitDto: SubmitApprovalDto = {
        entityType: 'Invoice',
        entityId: 'non-existent',
      };

      const error = new Error('Entity not found');
      mockApprovalService.submitForApproval.mockRejectedValue(error);

      await expect(controller.submitForApproval(mockUser, submitDto)).rejects.toThrow(error);
    });

    it('should handle already submitted approval', async () => {
      const submitDto: SubmitApprovalDto = {
        entityType: 'Invoice',
        entityId: 'inv-123',
      };

      const error = new Error('Approval already exists for this entity');
      mockApprovalService.submitForApproval.mockRejectedValue(error);

      await expect(controller.submitForApproval(mockUser, submitDto)).rejects.toThrow(error);
    });

    it('should handle empty entity id', async () => {
      const submitDto: SubmitApprovalDto = {
        entityType: 'Invoice',
        entityId: '',
      };

      const error = new Error('Entity ID is required');
      mockApprovalService.submitForApproval.mockRejectedValue(error);

      await expect(controller.submitForApproval(mockUser, submitDto)).rejects.toThrow(error);
    });
  });

  describe('GET /approvals/my-requests', () => {
    it('should get user approval requests successfully', async () => {
      const expectedRequests = [
        {
          id: 'approval-1',
          entityType: 'Invoice',
          entityId: 'inv-123',
          status: 'pending',
          requestedBy: mockUser.id,
        },
        {
          id: 'approval-2',
          entityType: 'Expense',
          entityId: 'exp-456',
          status: 'approved',
          requestedBy: mockUser.id,
        },
      ];

      mockApprovalService.getMyRequests.mockResolvedValue(expectedRequests);

      const result = await controller.getMyRequests(mockUser);

      expect(result).toEqual(expectedRequests);
      expect(mockApprovalService.getMyRequests).toHaveBeenCalledWith(mockUser);
      expect(mockApprovalService.getMyRequests).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no requests', async () => {
      mockApprovalService.getMyRequests.mockResolvedValue([]);

      const result = await controller.getMyRequests(mockUser);

      expect(result).toEqual([]);
      expect(mockApprovalService.getMyRequests).toHaveBeenCalledWith(mockUser);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockApprovalService.getMyRequests.mockRejectedValue(error);

      await expect(controller.getMyRequests(mockUser)).rejects.toThrow(error);
    });

    it('should return requests with different statuses', async () => {
      const expectedRequests = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'approved' },
        { id: '3', status: 'rejected' },
        { id: '4', status: 'cancelled' },
      ];

      mockApprovalService.getMyRequests.mockResolvedValue(expectedRequests);

      const result = await controller.getMyRequests(mockUser);

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.status)).toEqual(['pending', 'approved', 'rejected', 'cancelled']);
    });
  });

  describe('GET /approvals/pending', () => {
    it('should get pending approvals for manager successfully', async () => {
      const expectedApprovals = [
        {
          id: 'approval-1',
          entityType: 'Invoice',
          status: 'pending',
          requestedBy: 'user-1',
        },
        {
          id: 'approval-2',
          entityType: 'Expense',
          status: 'pending',
          requestedBy: 'user-2',
        },
      ];

      mockApprovalService.getPendingApprovals.mockResolvedValue(expectedApprovals);

      const result = await controller.getPendingApprovals(mockManagerUser);

      expect(result).toEqual(expectedApprovals);
      expect(mockApprovalService.getPendingApprovals).toHaveBeenCalledWith(mockManagerUser);
      expect(mockApprovalService.getPendingApprovals).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no pending approvals', async () => {
      mockApprovalService.getPendingApprovals.mockResolvedValue([]);

      const result = await controller.getPendingApprovals(mockManagerUser);

      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Failed to fetch pending approvals');
      mockApprovalService.getPendingApprovals.mockRejectedValue(error);

      await expect(controller.getPendingApprovals(mockManagerUser)).rejects.toThrow(error);
    });

    it('should only return pending status approvals', async () => {
      const expectedApprovals = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'pending' },
      ];

      mockApprovalService.getPendingApprovals.mockResolvedValue(expectedApprovals);

      const result = await controller.getPendingApprovals(mockManagerUser);

      expect(result.every((a) => a.status === 'pending')).toBe(true);
    });
  });

  describe('PATCH /approvals/:id/approve', () => {
    it('should approve a request successfully', async () => {
      const approvalId = 'approval-1';
      const expectedResult = {
        id: approvalId,
        status: 'approved',
        approvedBy: mockManagerUser.id,
        approvedAt: new Date(),
      };

      mockApprovalService.approve.mockResolvedValue(expectedResult);

      const result = await controller.approve(mockManagerUser, approvalId);

      expect(result).toEqual(expectedResult);
      expect(mockApprovalService.approve).toHaveBeenCalledWith(approvalId, mockManagerUser);
      expect(mockApprovalService.approve).toHaveBeenCalledTimes(1);
    });

    it('should handle non-existent approval', async () => {
      const approvalId = 'non-existent';
      const error = new Error('Approval not found');
      mockApprovalService.approve.mockRejectedValue(error);

      await expect(controller.approve(mockManagerUser, approvalId)).rejects.toThrow(error);
    });

    it('should handle already approved request', async () => {
      const approvalId = 'approval-1';
      const error = new Error('Approval already processed');
      mockApprovalService.approve.mockRejectedValue(error);

      await expect(controller.approve(mockManagerUser, approvalId)).rejects.toThrow(error);
    });

    it('should handle unauthorized approval attempt', async () => {
      const approvalId = 'approval-1';
      const error = new Error('Unauthorized to approve this request');
      mockApprovalService.approve.mockRejectedValue(error);

      await expect(controller.approve(mockUser, approvalId)).rejects.toThrow(error);
    });

    it('should handle invalid approval id format', async () => {
      const approvalId = 'invalid-id';
      const error = new Error('Invalid approval ID format');
      mockApprovalService.approve.mockRejectedValue(error);

      await expect(controller.approve(mockManagerUser, approvalId)).rejects.toThrow(error);
    });
  });

  describe('PATCH /approvals/:id/reject', () => {
    it('should reject a request successfully with reason', async () => {
      const approvalId = 'approval-1';
      const rejectDto: RejectApprovalDto = {
        reason: 'Budget exceeded',
      };

      const expectedResult = {
        id: approvalId,
        status: 'rejected',
        rejectedBy: mockManagerUser.id,
        rejectedAt: new Date(),
        reason: rejectDto.reason,
      };

      mockApprovalService.reject.mockResolvedValue(expectedResult);

      const result = await controller.reject(approvalId, mockManagerUser, rejectDto);

      expect(result).toEqual(expectedResult);
      expect(mockApprovalService.reject).toHaveBeenCalledWith(
        approvalId,
        mockManagerUser,
        rejectDto.reason,
      );
      expect(mockApprovalService.reject).toHaveBeenCalledTimes(1);
    });

    it('should reject with empty reason', async () => {
      const approvalId = 'approval-1';
      const rejectDto: RejectApprovalDto = {
        reason: '',
      };

      const expectedResult = {
        id: approvalId,
        status: 'rejected',
        reason: '',
      };

      mockApprovalService.reject.mockResolvedValue(expectedResult);

      const result = await controller.reject(approvalId, mockManagerUser, rejectDto);

      expect(result).toEqual(expectedResult);
    });

    it('should handle non-existent approval', async () => {
      const approvalId = 'non-existent';
      const rejectDto: RejectApprovalDto = { reason: 'Test' };
      const error = new Error('Approval not found');

      mockApprovalService.reject.mockRejectedValue(error);

      await expect(controller.reject(approvalId, mockManagerUser, rejectDto)).rejects.toThrow(
        error,
      );
    });

    it('should handle already rejected request', async () => {
      const approvalId = 'approval-1';
      const rejectDto: RejectApprovalDto = { reason: 'Test' };
      const error = new Error('Approval already processed');

      mockApprovalService.reject.mockRejectedValue(error);

      await expect(controller.reject(approvalId, mockManagerUser, rejectDto)).rejects.toThrow(
        error,
      );
    });

    it('should handle unauthorized rejection attempt', async () => {
      const approvalId = 'approval-1';
      const rejectDto: RejectApprovalDto = { reason: 'Test' };
      const error = new Error('Unauthorized to reject this request');

      mockApprovalService.reject.mockRejectedValue(error);

      await expect(controller.reject(approvalId, mockUser, rejectDto)).rejects.toThrow(error);
    });

    it('should handle long rejection reason', async () => {
      const approvalId = 'approval-1';
      const longReason = 'A'.repeat(1000);
      const rejectDto: RejectApprovalDto = { reason: longReason };

      const expectedResult = {
        id: approvalId,
        status: 'rejected',
        rejectionReason: longReason,
      };

      mockApprovalService.reject.mockResolvedValue(expectedResult);

      const result = await controller.reject(approvalId, mockManagerUser, rejectDto);

      expect(result.rejectionReason).toBe(longReason);
    });
  });

  describe('PATCH /approvals/:id/cancel', () => {
    it('should cancel own approval request successfully', async () => {
      const approvalId = 'approval-1';
      const expectedResult = {
        id: approvalId,
        status: 'cancelled',
        cancelledBy: mockUser.id,
        cancelledAt: new Date(),
      };

      mockApprovalService.cancel.mockResolvedValue(expectedResult);

      const result = await controller.cancel(mockUser, approvalId);

      expect(result).toEqual(expectedResult);
      expect(mockApprovalService.cancel).toHaveBeenCalledWith(mockUser, approvalId);
      expect(mockApprovalService.cancel).toHaveBeenCalledTimes(1);
    });

    it('should handle non-existent approval', async () => {
      const approvalId = 'non-existent';
      const error = new Error('Approval not found');
      mockApprovalService.cancel.mockRejectedValue(error);

      await expect(controller.cancel(mockUser, approvalId)).rejects.toThrow(error);
    });

    it('should handle cancelling other user request', async () => {
      const approvalId = 'approval-1';
      const error = new Error('Cannot cancel approval request of another user');
      mockApprovalService.cancel.mockRejectedValue(error);

      await expect(controller.cancel(mockUser, approvalId)).rejects.toThrow(error);
    });

    it('should handle already processed approval', async () => {
      const approvalId = 'approval-1';
      const error = new Error('Cannot cancel already processed approval');
      mockApprovalService.cancel.mockRejectedValue(error);

      await expect(controller.cancel(mockUser, approvalId)).rejects.toThrow(error);
    });

    it('should handle invalid approval id', async () => {
      const approvalId = 'invalid-id';
      const error = new Error('Invalid approval ID format');
      mockApprovalService.cancel.mockRejectedValue(error);

      await expect(controller.cancel(mockUser, approvalId)).rejects.toThrow(error);
    });

    it('should allow manager to cancel any request', async () => {
      const approvalId = 'approval-1';
      const expectedResult = {
        id: approvalId,
        status: 'cancelled',
        cancelledBy: mockManagerUser.id,
      };

      mockApprovalService.cancel.mockResolvedValue(expectedResult);

      const result = await controller.cancel(mockManagerUser, approvalId);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null user', async () => {
      const submitDto: SubmitApprovalDto = {
        entityType: 'Invoice',
        entityId: 'inv-123',
      };

      mockApprovalService.submitForApproval.mockRejectedValue(new Error('User is required'));

      await expect(controller.submitForApproval(null as any, submitDto)).rejects.toThrow();
    });

    it('should handle undefined approval id', async () => {
      mockApprovalService.approve.mockRejectedValue(new Error('Approval ID is required'));

      await expect(controller.approve(mockManagerUser, undefined as any)).rejects.toThrow();
    });

    it('should handle service timeout', async () => {
      const error = new Error('Service timeout');
      mockApprovalService.getMyRequests.mockRejectedValue(error);

      await expect(controller.getMyRequests(mockUser)).rejects.toThrow('Service timeout');
    });

    it('should handle concurrent approval attempts', async () => {
      const approvalId = 'approval-1';
      mockApprovalService.approve.mockResolvedValue({
        id: approvalId,
        status: 'approved',
      });

      const promises = Array(5)
        .fill(null)
        .map(() => controller.approve(mockManagerUser, approvalId));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockApprovalService.approve).toHaveBeenCalledTimes(5);
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection lost');
      mockApprovalService.getPendingApprovals.mockRejectedValue(error);

      await expect(controller.getPendingApprovals(mockManagerUser)).rejects.toThrow(error);
    });

    it('should handle malformed request data', async () => {
      const submitDto = {
        entityType: null,
        entityId: undefined,
      } as any;

      mockApprovalService.submitForApproval.mockRejectedValue(new Error('Invalid request data'));

      await expect(controller.submitForApproval(mockUser, submitDto)).rejects.toThrow();
    });

    it('should handle special characters in entity id', async () => {
      const submitDto: SubmitApprovalDto = {
        entityType: 'Invoice',
        entityId: 'inv-123-@#$%',
      };

      const expectedResult = {
        id: 'approval-1',
        entityType: submitDto.entityType,
        entityId: submitDto.entityId,
        status: 'pending',
      };

      mockApprovalService.submitForApproval.mockResolvedValue(expectedResult);

      const result = await controller.submitForApproval(mockUser, submitDto);

      expect(result.entityId).toBe(submitDto.entityId);
    });

    it('should handle very long rejection reasons', async () => {
      const approvalId = 'approval-1';
      const veryLongReason = 'A'.repeat(10000);
      const rejectDto: RejectApprovalDto = { reason: veryLongReason };

      mockApprovalService.reject.mockResolvedValue({
        id: approvalId,
        status: 'rejected',
        rejectionReason: veryLongReason,
      });

      const result = await controller.reject(approvalId, mockManagerUser, rejectDto);

      expect(result.rejectionReason).toBe(veryLongReason);
    });
  });
});

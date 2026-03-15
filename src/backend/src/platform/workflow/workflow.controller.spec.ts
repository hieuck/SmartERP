import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { User } from '@/common/security/permission.service';
import { Workflow, WorkflowStatus } from './entities/workflow.entity';
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';

describe('WorkflowController', () => {
  let _result: unknown;
  let _service: jest.Mocked<WorkflowService>;
  let controller: WorkflowController;
  let __service: WorkflowService;

  const mockUser: User = {
    id: 'user-1',
    email: 'user@test.com',
    tenantId: 'tenant-1',
    roles: ['user'],
  } as User;

  const mockWorkflowService = {
    findAllWorkflows: jest.fn(),
    findWorkflowById: jest.fn(),
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    deleteWorkflow: jest.fn(),
    activateWorkflow: jest.fn(),
    findAllInstances: jest.fn(),
    findInstanceById: jest.fn(),
    startWorkflow: jest.fn(),
    approveStep: jest.fn(),
    rejectStep: jest.fn(),
    cancelInstance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    controller = module.get<WorkflowController>(WorkflowController);
    service = module.get<WorkflowService>(WorkflowService) as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Workflow Definition Endpoints', () => {
    describe('GET /workflows', () => {
      it('should get all workflows successfully', async () => {
        const expectedWorkflows: Partial<Workflow>[] = [
          {
            id: 'workflow-1',
            name: 'Purchase Order Approval',
            description: 'Approval workflow for purchase orders',
            status: WorkflowStatus.ACTIVE,
          },
          {
            id: 'workflow-2',
            name: 'Invoice Approval',
            description: 'Approval workflow for invoices',
            status: WorkflowStatus.ACTIVE,
          },
        ];

        mockWorkflowService.findAllWorkflows.mockResolvedValue(expectedWorkflows);

        const result = await controller.findAllWorkflows(mockUser);

        expect(result).toEqual(expectedWorkflows);
        expect(mockWorkflowService.findAllWorkflows).toHaveBeenCalledWith(mockUser);
        expect(mockWorkflowService.findAllWorkflows).toHaveBeenCalledTimes(1);
      });

      it('should return empty array when no workflows exist', async () => {
        mockWorkflowService.findAllWorkflows.mockResolvedValue([]);

        const result = await controller.findAllWorkflows(mockUser);

        expect(result).toEqual([]);
        expect(mockWorkflowService.findAllWorkflows).toHaveBeenCalledWith(mockUser);
      });

      it('should handle service errors', async () => {
        const error = new Error('Database connection failed');
        mockWorkflowService.findAllWorkflows.mockRejectedValue(error);

        await expect(controller.findAllWorkflows(mockUser)).rejects.toThrow(error);
      });
    });

    describe('GET /workflows/:id', () => {
      it('should get workflow by id successfully', async () => {
        const workflowId = 'workflow-1';
        const expectedWorkflow: Partial<Workflow> = {
          id: workflowId,
          name: 'Purchase Order Approval',
          description: 'Approval workflow for purchase orders',
          steps: [
            { order: 1, name: 'Manager Approval', approverRole: 'manager' },
            { order: 2, name: 'Director Approval', approverRole: 'director' },
          ],
          status: WorkflowStatus.ACTIVE,
        };

        mockWorkflowService.findWorkflowById.mockResolvedValue(expectedWorkflow);

        const result = await controller.findWorkflowById(mockUser, workflowId);

        expect(result).toEqual(expectedWorkflow);
        expect(mockWorkflowService.findWorkflowById).toHaveBeenCalledWith(mockUser, workflowId);
        expect(mockWorkflowService.findWorkflowById).toHaveBeenCalledTimes(1);
      });

      it('should handle non-existent workflow', async () => {
        const workflowId = 'non-existent';
        const error = new Error('Workflow not found');
        mockWorkflowService.findWorkflowById.mockRejectedValue(error);

        await expect(controller.findWorkflowById(mockUser, workflowId)).rejects.toThrow(error);
      });

      it('should handle invalid workflow id format', async () => {
        const workflowId = 'invalid-id';
        const error = new Error('Invalid workflow ID format');
        mockWorkflowService.findWorkflowById.mockRejectedValue(error);

        await expect(controller.findWorkflowById(mockUser, workflowId)).rejects.toThrow(error);
      });
    });

    describe('POST /workflows', () => {
      it('should create workflow successfully', async () => {
        const workflowData: Partial<Workflow> = {
          name: 'New Workflow',
          description: 'Test workflow',
          entityType: 'PurchaseOrder',
          steps: [{ order: 1, name: 'Step 1', approverRole: 'manager' }],
        };

        const expectedWorkflow: Partial<Workflow> = {
          id: 'workflow-1',
          ...workflowData,
          status: WorkflowStatus.DRAFT,
          createdAt: new Date(),
        };

        mockWorkflowService.createWorkflow.mockResolvedValue(expectedWorkflow);

        const result = await controller.createWorkflow(mockUser, workflowData);

        expect(result).toEqual(expectedWorkflow);
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(mockUser, workflowData);
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledTimes(1);
      });

      it('should create workflow with multiple steps', async () => {
        const workflowData: Partial<Workflow> = {
          name: 'Multi-step Workflow',
          steps: [
            { order: 1, name: 'Manager', approverRole: 'manager' },
            { order: 2, name: 'Director', approverRole: 'director' },
            { order: 3, name: 'CEO', approverRole: 'ceo' },
          ],
        };

        const expectedWorkflow = { id: 'workflow-1', ...workflowData };
        mockWorkflowService.createWorkflow.mockResolvedValue(expectedWorkflow);

        const result = await controller.createWorkflow(mockUser, workflowData);

        expect(result.steps).toHaveLength(3);
      });

      it('should handle empty workflow data', async () => {
        const workflowData: Partial<Workflow> = {};
        const error = new Error('Workflow name is required');
        mockWorkflowService.createWorkflow.mockRejectedValue(error);

        await expect(controller.createWorkflow(mockUser, workflowData)).rejects.toThrow(error);
      });

      it('should handle duplicate workflow name', async () => {
        const workflowData: Partial<Workflow> = {
          name: 'Existing Workflow',
        };
        const error = new Error('Workflow name already exists');
        mockWorkflowService.createWorkflow.mockRejectedValue(error);

        await expect(controller.createWorkflow(mockUser, workflowData)).rejects.toThrow(error);
      });
    });

    describe('PUT /workflows/:id', () => {
      it('should update workflow successfully', async () => {
        const workflowId = 'workflow-1';
        const updateData: Partial<Workflow> = {
          name: 'Updated Workflow',
          description: 'Updated description',
        };

        const expectedWorkflow: Partial<Workflow> = {
          id: workflowId,
          ...updateData,
          updatedAt: new Date(),
        };

        mockWorkflowService.updateWorkflow.mockResolvedValue(expectedWorkflow);

        const result = await controller.updateWorkflow(mockUser, workflowId, updateData);

        expect(result).toEqual(expectedWorkflow);
        expect(mockWorkflowService.updateWorkflow).toHaveBeenCalledWith(
          mockUser,
          workflowId,
          updateData,
        );
      });

      it('should update workflow steps', async () => {
        const workflowId = 'workflow-1';
        const updateData: Partial<Workflow> = {
          steps: [{ order: 1, name: 'New Step', approverRole: 'admin' }],
        };

        const expectedWorkflow = { id: workflowId, ...updateData };
        mockWorkflowService.updateWorkflow.mockResolvedValue(expectedWorkflow);

        const result = await controller.updateWorkflow(mockUser, workflowId, updateData);

        expect(result.steps).toEqual(updateData.steps);
      });

      it('should handle non-existent workflow', async () => {
        const workflowId = 'non-existent';
        const updateData: Partial<Workflow> = { name: 'Test' };
        const error = new Error('Workflow not found');

        mockWorkflowService.updateWorkflow.mockRejectedValue(error);

        await expect(controller.updateWorkflow(mockUser, workflowId, updateData)).rejects.toThrow(
          error,
        );
      });

      it('should handle updating active workflow', async () => {
        const workflowId = 'workflow-1';
        const updateData: Partial<Workflow> = { name: 'Updated' };
        const error = new Error('Cannot update active workflow');

        mockWorkflowService.updateWorkflow.mockRejectedValue(error);

        await expect(controller.updateWorkflow(mockUser, workflowId, updateData)).rejects.toThrow(
          error,
        );
      });
    });

    describe('DELETE /workflows/:id', () => {
      it('should delete workflow successfully', async () => {
        const workflowId = 'workflow-1';
        mockWorkflowService.deleteWorkflow.mockResolvedValue(undefined);

        await controller.deleteWorkflow(mockUser, workflowId);

        expect(mockWorkflowService.deleteWorkflow).toHaveBeenCalledWith(mockUser, workflowId);
        expect(mockWorkflowService.deleteWorkflow).toHaveBeenCalledTimes(1);
      });

      it('should handle non-existent workflow', async () => {
        const workflowId = 'non-existent';
        const error = new Error('Workflow not found');
        mockWorkflowService.deleteWorkflow.mockRejectedValue(error);

        await expect(controller.deleteWorkflow(mockUser, workflowId)).rejects.toThrow(error);
      });

      it('should handle deleting active workflow', async () => {
        const workflowId = 'workflow-1';
        const error = new Error('Cannot delete active workflow');
        mockWorkflowService.deleteWorkflow.mockRejectedValue(error);

        await expect(controller.deleteWorkflow(mockUser, workflowId)).rejects.toThrow(error);
      });

      it('should handle deleting workflow with instances', async () => {
        const workflowId = 'workflow-1';
        const error = new Error('Cannot delete workflow with active instances');
        mockWorkflowService.deleteWorkflow.mockRejectedValue(error);

        await expect(controller.deleteWorkflow(mockUser, workflowId)).rejects.toThrow(error);
      });
    });

    describe('POST /workflows/:id/activate', () => {
      it('should activate workflow successfully', async () => {
        const workflowId = 'workflow-1';
        const expectedWorkflow: Partial<Workflow> = {
          id: workflowId,
          name: 'Test Workflow',
          status: WorkflowStatus.ACTIVE,
        };

        mockWorkflowService.activateWorkflow.mockResolvedValue(expectedWorkflow);

        const result = await controller.activateWorkflow(mockUser, workflowId);

        expect(result).toEqual(expectedWorkflow);
        expect(result.status).toBe(WorkflowStatus.ACTIVE);
        expect(mockWorkflowService.activateWorkflow).toHaveBeenCalledWith(mockUser, workflowId);
      });

      it('should handle non-existent workflow', async () => {
        const workflowId = 'non-existent';
        const error = new Error('Workflow not found');
        mockWorkflowService.activateWorkflow.mockRejectedValue(error);

        await expect(controller.activateWorkflow(mockUser, workflowId)).rejects.toThrow(error);
      });

      it('should handle already active workflow', async () => {
        const workflowId = 'workflow-1';
        const error = new Error('Workflow is already active');
        mockWorkflowService.activateWorkflow.mockRejectedValue(error);

        await expect(controller.activateWorkflow(mockUser, workflowId)).rejects.toThrow(error);
      });

      it('should handle invalid workflow configuration', async () => {
        const workflowId = 'workflow-1';
        const error = new Error('Workflow has no steps defined');
        mockWorkflowService.activateWorkflow.mockRejectedValue(error);

        await expect(controller.activateWorkflow(mockUser, workflowId)).rejects.toThrow(error);
      });
    });
  });

  describe('Workflow Instance Endpoints', () => {
    describe('GET /workflows/instances/all', () => {
      it('should get all workflow instances successfully', async () => {
        const expectedInstances: Partial<WorkflowInstance>[] = [
          {
            id: 'instance-1',
            workflowId: 'workflow-1',
            entityType: 'PurchaseOrder',
            entityId: 'po-123',
            status: WorkflowInstanceStatus.PENDING,
            currentStep: 1,
          },
          {
            id: 'instance-2',
            workflowId: 'workflow-1',
            entityType: 'Invoice',
            entityId: 'inv-456',
            status: WorkflowInstanceStatus.APPROVED,
            currentStep: 2,
          },
        ];

        mockWorkflowService.findAllInstances.mockResolvedValue(expectedInstances);

        const result = await controller.findAllInstances(mockUser);

        expect(result).toEqual(expectedInstances);
        expect(mockWorkflowService.findAllInstances).toHaveBeenCalledWith(mockUser);
      });

      it('should return empty array when no instances exist', async () => {
        mockWorkflowService.findAllInstances.mockResolvedValue([]);

        const result = await controller.findAllInstances(mockUser);

        expect(result).toEqual([]);
      });

      it('should handle service errors', async () => {
        const error = new Error('Database error');
        mockWorkflowService.findAllInstances.mockRejectedValue(error);

        await expect(controller.findAllInstances(mockUser)).rejects.toThrow(error);
      });
    });

    describe('GET /workflows/instances/:id', () => {
      it('should get workflow instance by id successfully', async () => {
        const instanceId = 'instance-1';
        const expectedInstance: Partial<WorkflowInstance> = {
          id: instanceId,
          workflowId: 'workflow-1',
          entityType: 'PurchaseOrder',
          entityId: 'po-123',
          status: WorkflowInstanceStatus.PENDING,
          currentStep: 1,
          stepHistory: [{ step: 1, action: 'started', timestamp: new Date() }],
        };

        mockWorkflowService.findInstanceById.mockResolvedValue(expectedInstance);

        const result = await controller.findInstanceById(mockUser, instanceId);

        expect(result).toEqual(expectedInstance);
        expect(mockWorkflowService.findInstanceById).toHaveBeenCalledWith(mockUser, instanceId);
      });

      it('should handle non-existent instance', async () => {
        const instanceId = 'non-existent';
        const error = new Error('Workflow instance not found');
        mockWorkflowService.findInstanceById.mockRejectedValue(error);

        await expect(controller.findInstanceById(mockUser, instanceId)).rejects.toThrow(error);
      });
    });

    describe('POST /workflows/instances/start', () => {
      it('should start workflow successfully', async () => {
        const workflowId = 'workflow-1';
        const entityType = 'PurchaseOrder';
        const entityId = 'po-123';
        const initiatedBy = mockUser.id;

        const expectedInstance: Partial<WorkflowInstance> = {
          id: 'instance-1',
          workflowId,
          entityType,
          entityId,
          status: WorkflowInstanceStatus.PENDING,
          currentStep: 1,
          initiatedBy,
        };

        mockWorkflowService.startWorkflow.mockResolvedValue(expectedInstance);

        const result = await controller.startWorkflow(
          mockUser,
          workflowId,
          entityType,
          entityId,
          initiatedBy,
        );

        expect(result).toEqual(expectedInstance);
        expect(mockWorkflowService.startWorkflow).toHaveBeenCalledWith(
          mockUser,
          workflowId,
          entityType,
          entityId,
        );
      });

      it('should handle non-existent workflow', async () => {
        const error = new Error('Workflow not found');
        mockWorkflowService.startWorkflow.mockRejectedValue(error);

        await expect(
          controller.startWorkflow(mockUser, 'non-existent', 'Invoice', 'inv-1', mockUser.id),
        ).rejects.toThrow(error);
      });

      it('should handle inactive workflow', async () => {
        const error = new Error('Workflow is not active');
        mockWorkflowService.startWorkflow.mockRejectedValue(error);

        await expect(
          controller.startWorkflow(mockUser, 'workflow-1', 'Invoice', 'inv-1', mockUser.id),
        ).rejects.toThrow(error);
      });

      it('should handle already started workflow for entity', async () => {
        const error = new Error('Workflow already started for this entity');
        mockWorkflowService.startWorkflow.mockRejectedValue(error);

        await expect(
          controller.startWorkflow(mockUser, 'workflow-1', 'Invoice', 'inv-1', mockUser.id),
        ).rejects.toThrow(error);
      });
    });

    describe('POST /workflows/instances/:id/approve', () => {
      it('should approve workflow step successfully', async () => {
        const instanceId = 'instance-1';
        const approvedBy = mockUser.id;
        const notes = 'Approved';

        const expectedInstance: Partial<WorkflowInstance> = {
          id: instanceId,
          status: WorkflowInstanceStatus.PENDING,
          currentStep: 2,
          stepHistory: [{ step: 1, action: 'approved', approvedBy, notes, timestamp: new Date() }],
        };

        mockWorkflowService.approveStep.mockResolvedValue(expectedInstance);

        const result = await controller.approveStep(mockUser, instanceId, approvedBy, notes);

        expect(result).toEqual(expectedInstance);
        expect(mockWorkflowService.approveStep).toHaveBeenCalledWith(mockUser, instanceId, notes);
      });

      it('should approve without notes', async () => {
        const instanceId = 'instance-1';
        const approvedBy = mockUser.id;

        const expectedInstance = { id: instanceId, currentStep: 2 };
        mockWorkflowService.approveStep.mockResolvedValue(expectedInstance);

        const result = await controller.approveStep(mockUser, instanceId, approvedBy);

        expect(result).toEqual(expectedInstance);
        expect(mockWorkflowService.approveStep).toHaveBeenCalledWith(
          mockUser,
          instanceId,
          undefined,
        );
      });

      it('should handle non-existent instance', async () => {
        const error = new Error('Workflow instance not found');
        mockWorkflowService.approveStep.mockRejectedValue(error);

        await expect(controller.approveStep(mockUser, 'non-existent', mockUser.id)).rejects.toThrow(
          error,
        );
      });

      it('should handle unauthorized approval', async () => {
        const error = new Error('User not authorized to approve this step');
        mockWorkflowService.approveStep.mockRejectedValue(error);

        await expect(controller.approveStep(mockUser, 'instance-1', mockUser.id)).rejects.toThrow(
          error,
        );
      });

      it('should complete workflow on final approval', async () => {
        const instanceId = 'instance-1';
        const expectedInstance: Partial<WorkflowInstance> = {
          id: instanceId,
          status: WorkflowInstanceStatus.APPROVED,
          currentStep: 3,
        };

        mockWorkflowService.approveStep.mockResolvedValue(expectedInstance);

        const result = await controller.approveStep(mockUser, instanceId, mockUser.id);

        expect(result.status).toBe(WorkflowInstanceStatus.APPROVED);
      });
    });

    describe('POST /workflows/instances/:id/reject', () => {
      it('should reject workflow step successfully', async () => {
        const instanceId = 'instance-1';
        const rejectedBy = mockUser.id;
        const notes = 'Budget exceeded';

        const expectedInstance: Partial<WorkflowInstance> = {
          id: instanceId,
          status: WorkflowInstanceStatus.REJECTED,
          stepHistory: [{ step: 1, action: 'rejected', rejectedBy, notes, timestamp: new Date() }],
        };

        mockWorkflowService.rejectStep.mockResolvedValue(expectedInstance);

        const result = await controller.rejectStep(mockUser, instanceId, rejectedBy, notes);

        expect(result).toEqual(expectedInstance);
        expect(result.status).toBe(WorkflowInstanceStatus.REJECTED);
        expect(mockWorkflowService.rejectStep).toHaveBeenCalledWith(mockUser, instanceId, notes);
      });

      it('should reject without notes', async () => {
        const instanceId = 'instance-1';
        const rejectedBy = mockUser.id;

        const expectedInstance = { id: instanceId, status: WorkflowInstanceStatus.REJECTED };
        mockWorkflowService.rejectStep.mockResolvedValue(expectedInstance);

        const result = await controller.rejectStep(mockUser, instanceId, rejectedBy);

        expect(result.status).toBe(WorkflowInstanceStatus.REJECTED);
      });

      it('should handle non-existent instance', async () => {
        const error = new Error('Workflow instance not found');
        mockWorkflowService.rejectStep.mockRejectedValue(error);

        await expect(controller.rejectStep(mockUser, 'non-existent', mockUser.id)).rejects.toThrow(
          error,
        );
      });

      it('should handle unauthorized rejection', async () => {
        const error = new Error('User not authorized to reject this step');
        mockWorkflowService.rejectStep.mockRejectedValue(error);

        await expect(controller.rejectStep(mockUser, 'instance-1', mockUser.id)).rejects.toThrow(
          error,
        );
      });
    });

    describe('POST /workflows/instances/:id/cancel', () => {
      it('should cancel workflow instance successfully', async () => {
        const instanceId = 'instance-1';
        const expectedInstance: Partial<WorkflowInstance> = {
          id: instanceId,
          status: WorkflowInstanceStatus.CANCELLED,
        };

        mockWorkflowService.cancelInstance.mockResolvedValue(expectedInstance);

        const result = await controller.cancelInstance(mockUser, instanceId);

        expect(result).toEqual(expectedInstance);
        expect(result.status).toBe(WorkflowInstanceStatus.CANCELLED);
        expect(mockWorkflowService.cancelInstance).toHaveBeenCalledWith(mockUser, instanceId);
      });

      it('should handle non-existent instance', async () => {
        const error = new Error('Workflow instance not found');
        mockWorkflowService.cancelInstance.mockRejectedValue(error);

        await expect(controller.cancelInstance(mockUser, 'non-existent')).rejects.toThrow(error);
      });

      it('should handle already completed instance', async () => {
        const error = new Error('Cannot cancel completed workflow');
        mockWorkflowService.cancelInstance.mockRejectedValue(error);

        await expect(controller.cancelInstance(mockUser, 'instance-1')).rejects.toThrow(error);
      });

      it('should handle unauthorized cancellation', async () => {
        const error = new Error('User not authorized to cancel this workflow');
        mockWorkflowService.cancelInstance.mockRejectedValue(error);

        await expect(controller.cancelInstance(mockUser, 'instance-1')).rejects.toThrow(error);
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null user', async () => {
      mockWorkflowService.findAllWorkflows.mockRejectedValue(new Error('User is required'));

      await expect(controller.findAllWorkflows(null as any)).rejects.toThrow();
    });

    it('should handle undefined workflow id', async () => {
      mockWorkflowService.findWorkflowById.mockRejectedValue(new Error('Workflow ID is required'));

      await expect(controller.findWorkflowById(mockUser, undefined as any)).rejects.toThrow();
    });

    it('should handle concurrent workflow starts', async () => {
      mockWorkflowService.startWorkflow.mockResolvedValue({
        id: 'instance-1',
        status: WorkflowInstanceStatus.PENDING,
      } as any);

      const promises = Array(5)
        .fill(null)
        .map(() =>
          controller.startWorkflow(mockUser, 'workflow-1', 'Invoice', 'inv-1', mockUser.id),
        );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockWorkflowService.startWorkflow).toHaveBeenCalledTimes(5);
    });

    it('should handle service timeout', async () => {
      const error = new Error('Service timeout');
      mockWorkflowService.findAllWorkflows.mockRejectedValue(error);

      await expect(controller.findAllWorkflows(mockUser)).rejects.toThrow('Service timeout');
    });

    it('should handle malformed workflow data', async () => {
      const workflowData = {
        name: null,
        steps: undefined,
      } as any;

      mockWorkflowService.createWorkflow.mockRejectedValue(new Error('Invalid workflow data'));

      await expect(controller.createWorkflow(mockUser, workflowData)).rejects.toThrow();
    });

    it('should handle very long notes', async () => {
      const instanceId = 'instance-1';
      const longNotes = 'A'.repeat(10000);

      mockWorkflowService.approveStep.mockResolvedValue({
        id: instanceId,
        stepHistory: [{ notes: longNotes }],
      } as any);

      const result = await controller.approveStep(mockUser, instanceId, mockUser.id, longNotes);

      expect(result.stepHistory[0].notes).toBe(longNotes);
    });

    it('should handle special characters in entity id', async () => {
      const entityId = 'po-123-@#$%';
      mockWorkflowService.startWorkflow.mockResolvedValue({
        id: 'instance-1',
        entityId,
      } as any);

      const result = await controller.startWorkflow(
        mockUser,
        'workflow-1',
        'PurchaseOrder',
        entityId,
        mockUser.id,
      );

      expect(result.entityId).toBe(entityId);
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection lost');
      mockWorkflowService.findAllInstances.mockRejectedValue(error);

      await expect(controller.findAllInstances(mockUser)).rejects.toThrow(error);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { Workflow, WorkflowStatus } from './entities/workflow.entity';
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('WorkflowController', () => {
  let controller: WorkflowController;
  let service: WorkflowService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  const mockWorkflow: Workflow = {
    id: 'workflow-123',
    tenantId: mockTenantId,
    name: 'Purchase Approval',
    description: 'Approval workflow for purchases',
    status: WorkflowStatus.ACTIVE,
    entityType: 'purchase',
    steps: [
      { name: 'Manager Approval', approvers: ['manager-1'] },
      { name: 'Finance Approval', approvers: ['finance-1'] },
    ],
    createdBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockInstance: WorkflowInstance = {
    id: 'instance-123',
    tenantId: mockTenantId,
    workflowId: mockWorkflow.id,
    entityType: 'purchase',
    entityId: 'purchase-123',
    status: WorkflowInstanceStatus.IN_PROGRESS,
    currentStep: 0,
    stepHistory: [],
    initiatedBy: mockUserId,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  const mockUser = createMockUser();

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
    service = module.get<WorkflowService>(WorkflowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllWorkflows', () => {
    it('should return all workflows for tenant', async () => {
      mockWorkflowService.findAllWorkflows.mockResolvedValue([mockWorkflow]);

      const result = await controller.findAllWorkflows(mockUser);

      expect(result).toEqual([mockWorkflow]);
      expect(service.findAllWorkflows).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findWorkflowById', () => {
    it('should return workflow by id', async () => {
      mockWorkflowService.findWorkflowById.mockResolvedValue(mockWorkflow);

      const result = await controller.findWorkflowById(mockUser, mockWorkflow.id);

      expect(result).toEqual(mockWorkflow);
      expect(service.findWorkflowById).toHaveBeenCalledWith(mockUser, mockWorkflow.id);
    });
  });

  describe('createWorkflow', () => {
    it('should create a workflow', async () => {
      const createData = {
        name: 'New Workflow',
        entityType: 'order',
        steps: [{ name: 'Step 1', approvers: ['user-1'] }],
      };
      mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

      const result = await controller.createWorkflow(mockUser, createData);

      expect(result).toEqual(mockWorkflow);
      expect(service.createWorkflow).toHaveBeenCalledWith(mockUser, createData);
    });
  });

  describe('updateWorkflow', () => {
    it('should update a workflow', async () => {
      const updateData = { name: 'Updated Workflow' };
      mockWorkflowService.updateWorkflow.mockResolvedValue(mockWorkflow);

      const result = await controller.updateWorkflow(mockUser, mockWorkflow.id, updateData);

      expect(result).toEqual(mockWorkflow);
      expect(service.updateWorkflow).toHaveBeenCalledWith(mockUser, mockWorkflow.id, updateData);
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete a workflow', async () => {
      mockWorkflowService.deleteWorkflow.mockResolvedValue(undefined);

      await controller.deleteWorkflow(mockUser, mockWorkflow.id);

      expect(service.deleteWorkflow).toHaveBeenCalledWith(mockUser, mockWorkflow.id);
    });
  });

  describe('activateWorkflow', () => {
    it('should activate a workflow', async () => {
      mockWorkflowService.activateWorkflow.mockResolvedValue(mockWorkflow);

      const result = await controller.activateWorkflow(mockUser, mockWorkflow.id);

      expect(result).toEqual(mockWorkflow);
      expect(service.activateWorkflow).toHaveBeenCalledWith(mockUser, mockWorkflow.id);
    });
  });

  describe('findAllInstances', () => {
    it('should return all workflow instances for tenant', async () => {
      mockWorkflowService.findAllInstances.mockResolvedValue([mockInstance]);

      const result = await controller.findAllInstances(mockUser);

      expect(result).toEqual([mockInstance]);
      expect(service.findAllInstances).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findInstanceById', () => {
    it('should return workflow instance by id', async () => {
      mockWorkflowService.findInstanceById.mockResolvedValue(mockInstance);

      const result = await controller.findInstanceById(mockUser, mockInstance.id);

      expect(result).toEqual(mockInstance);
      expect(service.findInstanceById).toHaveBeenCalledWith(mockUser, mockInstance.id);
    });
  });

  describe('startWorkflow', () => {
    it('should start a workflow instance', async () => {
      mockWorkflowService.startWorkflow.mockResolvedValue(mockInstance);

      const result = await controller.startWorkflow(
        mockUser,
        mockWorkflow.id,
        'purchase',
        'purchase-123',
        mockUserId,
      );

      expect(result).toEqual(mockInstance);
      expect(service.startWorkflow).toHaveBeenCalledWith(
        mockUser,
        mockWorkflow.id,
        'purchase',
        'purchase-123',
      );
    });
  });

  describe('approveStep', () => {
    it('should approve a workflow step', async () => {
      mockWorkflowService.approveStep.mockResolvedValue(mockInstance);

      const result = await controller.approveStep(mockUser, mockInstance.id, mockUserId, 'Approved');

      expect(result).toEqual(mockInstance);
      expect(service.approveStep).toHaveBeenCalledWith(mockUser, mockInstance.id, 'Approved');
    });
  });

  describe('rejectStep', () => {
    it('should reject a workflow step', async () => {
      mockWorkflowService.rejectStep.mockResolvedValue(mockInstance);

      const result = await controller.rejectStep(mockUser, mockInstance.id, mockUserId, 'Rejected');

      expect(result).toEqual(mockInstance);
      expect(service.rejectStep).toHaveBeenCalledWith(mockUser, mockInstance.id, 'Rejected');
    });
  });

  describe('cancelInstance', () => {
    it('should cancel a workflow instance', async () => {
      mockWorkflowService.cancelInstance.mockResolvedValue(mockInstance);

      const result = await controller.cancelInstance(mockUser, mockInstance.id);

      expect(result).toEqual(mockInstance);
      expect(service.cancelInstance).toHaveBeenCalledWith(mockUser, mockInstance.id);
    });
  });
});

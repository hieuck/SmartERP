import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Workflow } from './entities/workflow.entity';
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';
import { WorkflowStatus } from './enums';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';

describe('WorkflowService', () => {
  let permissionService: jest.Mocked<PermissionService>;
  let service: WorkflowService;
  let workflowRepository: jest.Mocked<Repository<Workflow>>;
  let instanceRepository: jest.Mocked<Repository<WorkflowInstance>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['admin'],
  } as User;

  const mockWorkflow: Workflow = {
    id: 'workflow-1',
    name: 'Approval Workflow',
    description: 'Test workflow',
    entityType: 'PurchaseOrder',
    status: WorkflowStatus.ACTIVE,
    steps: [
      { step: 0, name: 'Manager Approval', approvers: ['manager-1'] },
      { step: 1, name: 'Director Approval', approvers: ['director-1'] },
    ],
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as Workflow;

  const mockInstance: WorkflowInstance = {
    id: 'instance-1',
    workflowId: 'workflow-1',
    entityType: 'PurchaseOrder',
    entityId: 'po-1',
    initiatedBy: 'user-1',
    status: WorkflowInstanceStatus.IN_PROGRESS,
    currentStep: 0,
    stepHistory: [],
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as WorkflowInstance;

  beforeEach(async () => {
    const mockWorkflowRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockInstanceRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getOrSet: jest.fn(),
    };

    const mockPermission = {
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, baseWhere) => ({
        ...baseWhere,
        tenantId: user.tenantId,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockWorkflowRepo,
        },
        {
          provide: getRepositoryToken(WorkflowInstance),
          useValue: mockInstanceRepo,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: PermissionService,
          useValue: mockPermission,
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    workflowRepository = module.get(getRepositoryToken(Workflow));
    instanceRepository = module.get(getRepositoryToken(WorkflowInstance));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllWorkflows', () => {
    it('should return all workflows for user', async () => {
      const workflows = [mockWorkflow];
      workflowRepository.find.mockResolvedValue(workflows);

      const result = await service.findAllWorkflows(mockUser);

      expect(result).toEqual(workflows);
      expect(workflowRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no workflows exist', async () => {
      workflowRepository.find.mockResolvedValue([]);

      const result = await service.findAllWorkflows(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findWorkflowById', () => {
    it('should return workflow from cache if exists', async () => {
      cacheService.getOrSet.mockResolvedValue(mockWorkflow);

      const result = await service.findWorkflowById(mockUser, 'workflow-1');

      expect(result).toEqual(mockWorkflow);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when workflow not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        return fn();
      });
      workflowRepository.findOne.mockResolvedValue(null);

      await expect(service.findWorkflowById(mockUser, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createWorkflow', () => {
    it('should create new workflow', async () => {
      const createData = {
        name: 'New Workflow',
        description: 'Test',
        status: WorkflowStatus.DRAFT,
      };
      workflowRepository.save.mockResolvedValue({ ...mockWorkflow, ...createData });

      const result = await service.createWorkflow(mockUser, createData);

      expect(result.name).toBe(createData.name);
      expect(workflowRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow and invalidate cache', async () => {
      cacheService.getOrSet.mockResolvedValue(mockWorkflow);
      workflowRepository.save.mockResolvedValue({
        ...mockWorkflow,
        name: 'Updated Name',
      });

      const result = await service.updateWorkflow(mockUser, 'workflow-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow and invalidate cache', async () => {
      cacheService.getOrSet.mockResolvedValue(mockWorkflow);
      workflowRepository.findOne.mockResolvedValue(mockWorkflow);
      workflowRepository.remove.mockResolvedValue(mockWorkflow);

      await service.deleteWorkflow(mockUser, 'workflow-1');

      expect(workflowRepository.remove).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('activateWorkflow', () => {
    it('should activate workflow', async () => {
      const draftWorkflow = { ...mockWorkflow, status: WorkflowStatus.DRAFT };
      cacheService.getOrSet.mockResolvedValue(draftWorkflow);
      workflowRepository.save.mockResolvedValue({
        ...draftWorkflow,
        status: WorkflowStatus.ACTIVE,
      });

      const result = await service.activateWorkflow(mockUser, 'workflow-1');

      expect(result.status).toBe(WorkflowStatus.ACTIVE);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('findAllInstances', () => {
    it('should return all workflow instances', async () => {
      const instances = [mockInstance];
      instanceRepository.find.mockResolvedValue(instances);

      const result = await service.findAllInstances(mockUser);

      expect(result).toEqual(instances);
    });
  });

  describe('findInstanceById', () => {
    it('should return instance from cache', async () => {
      cacheService.getOrSet.mockResolvedValue(mockInstance);

      const result = await service.findInstanceById(mockUser, 'instance-1');

      expect(result).toEqual(mockInstance);
    });

    it('should throw NotFoundException when instance not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      instanceRepository.findOne.mockResolvedValue(null);

      await expect(service.findInstanceById(mockUser, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('startWorkflow', () => {
    it('should start workflow instance', async () => {
      cacheService.getOrSet.mockResolvedValue(mockWorkflow);
      instanceRepository.create.mockReturnValue(mockInstance);
      instanceRepository.save.mockResolvedValue(mockInstance);

      const result = await service.startWorkflow(mockUser, 'workflow-1', 'PurchaseOrder', 'po-1');

      expect(result.status).toBe(WorkflowInstanceStatus.IN_PROGRESS);
      expect(instanceRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when workflow not active', async () => {
      const inactiveWorkflow = { ...mockWorkflow, status: WorkflowStatus.DRAFT };
      cacheService.getOrSet.mockResolvedValue(inactiveWorkflow);

      await expect(
        service.startWorkflow(mockUser, 'workflow-1', 'PurchaseOrder', 'po-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveStep', () => {
    it('should approve current step and move to next', async () => {
      cacheService.getOrSet.mockResolvedValueOnce(mockInstance).mockResolvedValueOnce(mockWorkflow);
      instanceRepository.save.mockResolvedValue({
        ...mockInstance,
        currentStep: 1,
        stepHistory: [
          {
            step: 0,
            action: 'approved',
            approvedBy: 'user-1',
            timestamp: expect.any(Date),
          },
        ],
      });

      const result = await service.approveStep(mockUser, 'instance-1', 'Looks good');

      expect(result.currentStep).toBe(1);
      expect(result.stepHistory).toHaveLength(1);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should mark as approved when all steps completed', async () => {
      const lastStepInstance = { ...mockInstance, currentStep: 1 };
      cacheService.getOrSet
        .mockResolvedValueOnce(lastStepInstance)
        .mockResolvedValueOnce(mockWorkflow);
      instanceRepository.save.mockResolvedValue({
        ...lastStepInstance,
        status: WorkflowInstanceStatus.APPROVED,
        currentStep: 2,
      });

      const result = await service.approveStep(mockUser, 'instance-1');

      expect(result.status).toBe(WorkflowInstanceStatus.APPROVED);
    });
  });

  describe('rejectStep', () => {
    it('should reject workflow instance', async () => {
      cacheService.getOrSet.mockResolvedValue(mockInstance);
      instanceRepository.save.mockResolvedValue({
        ...mockInstance,
        status: WorkflowInstanceStatus.REJECTED,
        stepHistory: [
          {
            step: 0,
            action: 'rejected',
            rejectedBy: 'user-1',
            notes: 'Not approved',
            timestamp: expect.any(Date),
          },
        ],
      });

      const result = await service.rejectStep(mockUser, 'instance-1', 'Not approved');

      expect(result.status).toBe(WorkflowInstanceStatus.REJECTED);
      expect(result.stepHistory).toHaveLength(1);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('cancelInstance', () => {
    it('should cancel workflow instance', async () => {
      cacheService.getOrSet.mockResolvedValue(mockInstance);
      instanceRepository.save.mockResolvedValue({
        ...mockInstance,
        status: WorkflowInstanceStatus.CANCELLED,
      });

      const result = await service.cancelInstance(mockUser, 'instance-1');

      expect(result.status).toBe(WorkflowInstanceStatus.CANCELLED);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });
});

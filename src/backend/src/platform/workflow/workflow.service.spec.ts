import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';
import { Workflow, WorkflowStatus } from './entities/workflow.entity';
import { WorkflowService } from './workflow.service';

const mockUser = {
  id: 'user1',
  tenantId: 'tenant1',
  roles: ['admin'],
};

describe('WorkflowService', () => {
  let service: WorkflowService;
  let workflowRepository: Repository<Workflow>;
  let instanceRepository: Repository<WorkflowInstance>;
  let cacheService: CacheService;

  const mockWorkflow: Partial<Workflow> = {
    id: 'workflow-1',
    tenantId: 'tenant-1',
    name: 'Approval Workflow',
    description: 'Test workflow',
    status: WorkflowStatus.ACTIVE,
    entityType: 'order',
    steps: [
      { name: 'Manager Approval', approvers: ['manager-1'] },
      { name: 'Director Approval', approvers: ['director-1'] },
    ],
  };

  const mockInstance: Partial<WorkflowInstance> = {
    id: 'instance-1',
    tenantId: 'tenant-1',
    workflowId: 'workflow-1',
    entityType: 'order',
    entityId: 'order-1',
    status: WorkflowInstanceStatus.IN_PROGRESS,
    currentStep: 0,
    initiatedBy: 'user-1',
    stepHistory: [],
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(WorkflowInstance),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, where) => where),
          },
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    workflowRepository = module.get<Repository<Workflow>>(getRepositoryToken(Workflow));
    instanceRepository = module.get<Repository<WorkflowInstance>>(
      getRepositoryToken(WorkflowInstance),
    );
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllWorkflows', () => {
    it('should return all workflows for tenant', async () => {
      jest.spyOn(workflowRepository, 'find').mockResolvedValue([mockWorkflow as Workflow]);

      const result = await service.findAllWorkflows(mockUser);

      expect(result).toEqual([mockWorkflow]);
      expect(workflowRepository.find).toHaveBeenCalled();
    });
  });

  describe('findWorkflowById', () => {
    it('should return workflow from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);

      const result = await service.findWorkflowById(mockUser, 'workflow-1');

      expect(result).toEqual(mockWorkflow);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when workflow not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fn) => fn());
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findWorkflowById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createWorkflow', () => {
    it('should create and save workflow', async () => {
      jest.spyOn(workflowRepository, 'save').mockResolvedValue(mockWorkflow as Workflow);

      const result = await service.createWorkflow(mockUser, {
        name: 'New Workflow',
        entityType: 'order',
      });

      expect(result).toEqual(mockWorkflow);
      expect(workflowRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.updateWorkflow(mockUser, 'workflow-1', {
        name: 'Updated Workflow',
      });

      expect(workflowRepository.save).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteWorkflow', () => {
    it('should soft delete workflow and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(workflowRepository, 'remove').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.deleteWorkflow(mockUser, 'workflow-1');

      expect(workflowRepository.remove).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('activateWorkflow', () => {
    it('should activate workflow and invalidate cache', async () => {
      const updatedWorkflow = { ...mockWorkflow, status: WorkflowStatus.ACTIVE };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue(updatedWorkflow as Workflow);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.activateWorkflow(mockUser, 'workflow-1');

      expect(workflowRepository.save).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('findAllInstances', () => {
    it('should return all workflow instances for tenant', async () => {
      jest.spyOn(instanceRepository, 'find').mockResolvedValue([mockInstance as WorkflowInstance]);

      const result = await service.findAllInstances(mockUser);

      expect(result).toEqual([mockInstance]);
      expect(instanceRepository.find).toHaveBeenCalled();
    });
  });

  describe('findInstanceById', () => {
    it('should return instance from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockInstance as WorkflowInstance);

      const result = await service.findInstanceById(mockUser, 'instance-1');

      expect(result).toEqual(mockInstance);
    });

    it('should throw NotFoundException when instance not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (key, fn) => fn());
      jest.spyOn(instanceRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findInstanceById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('startWorkflow', () => {
    it('should start workflow instance', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(instanceRepository, 'save').mockResolvedValue(mockInstance as WorkflowInstance);

      const result = await service.startWorkflow(mockUser, 'workflow-1', 'order', 'order-1');

      expect(result).toEqual(mockInstance);
      expect(instanceRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when workflow is not active', async () => {
      const inactiveWorkflow = { ...mockWorkflow, status: WorkflowStatus.DRAFT };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(inactiveWorkflow as Workflow);

      await expect(
        service.startWorkflow(mockUser, 'workflow-1', 'order', 'order-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveStep', () => {
    it('should approve current step and move to next', async () => {
      const updatedInstance = { ...mockInstance, currentStep: 1 };
      jest
        .spyOn(cacheService, 'getOrSet')
        .mockResolvedValueOnce(mockInstance as WorkflowInstance)
        .mockResolvedValueOnce(mockWorkflow as Workflow);
      jest.spyOn(instanceRepository, 'save').mockResolvedValue(updatedInstance as WorkflowInstance);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.approveStep(mockUser, 'instance-1', 'Approved');

      expect(instanceRepository.save).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should mark instance as approved when all steps completed', async () => {
      const lastStepInstance = { ...mockInstance, currentStep: 1 };
      const approvedInstance = {
        ...lastStepInstance,
        status: WorkflowInstanceStatus.APPROVED,
        currentStep: 2,
      };
      jest
        .spyOn(cacheService, 'getOrSet')
        .mockResolvedValueOnce(lastStepInstance as WorkflowInstance)
        .mockResolvedValueOnce(mockWorkflow as Workflow);
      jest
        .spyOn(instanceRepository, 'save')
        .mockResolvedValue(approvedInstance as WorkflowInstance);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.approveStep(mockUser, 'instance-1', 'director-1');

      expect(instanceRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(WorkflowInstanceStatus.APPROVED);
    });
  });

  describe('rejectStep', () => {
    it('should reject workflow instance', async () => {
      const rejectedInstance = {
        ...mockInstance,
        status: WorkflowInstanceStatus.REJECTED,
      };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockInstance as WorkflowInstance);
      jest
        .spyOn(instanceRepository, 'save')
        .mockResolvedValue(rejectedInstance as WorkflowInstance);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.rejectStep(mockUser, 'instance-1', 'Not approved');

      expect(instanceRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(WorkflowInstanceStatus.REJECTED);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('cancelInstance', () => {
    it('should cancel workflow instance', async () => {
      const cancelledInstance = {
        ...mockInstance,
        status: WorkflowInstanceStatus.CANCELLED,
      };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockInstance as WorkflowInstance);
      jest
        .spyOn(instanceRepository, 'save')
        .mockResolvedValue(cancelledInstance as WorkflowInstance);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.cancelInstance(mockUser, 'instance-1');

      expect(instanceRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(WorkflowInstanceStatus.CANCELLED);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });
});

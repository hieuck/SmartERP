import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Workflow, WorkflowStatus } from './entities/workflow.entity';
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';
import { CacheService } from '@/common/cache/cache.service';

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
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(WorkflowInstance),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
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
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    workflowRepository = module.get<Repository<Workflow>>(getRepositoryToken(Workflow));
    instanceRepository = module.get<Repository<WorkflowInstance>>(getRepositoryToken(WorkflowInstance));
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllWorkflows', () => {
    it('should return all workflows for tenant', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockWorkflow]);

      const result = await service.findAllWorkflows('tenant-1');

      expect(result).toEqual([mockWorkflow]);
      expect(workflowRepository.createQueryBuilder).toHaveBeenCalledWith('workflow');
    });
  });

  describe('findWorkflowById', () => {
    it('should return workflow from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);

      const result = await service.findWorkflowById('tenant-1', 'workflow-1');

      expect(result).toEqual(mockWorkflow);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when workflow not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fn) => fn());
      jest.spyOn(workflowRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findWorkflowById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createWorkflow', () => {
    it('should create and save workflow', async () => {
      jest.spyOn(workflowRepository, 'create').mockReturnValue(mockWorkflow as Workflow);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue(mockWorkflow as Workflow);

      const result = await service.createWorkflow('tenant-1', {
        name: 'New Workflow',
        entityType: 'order',
      });

      expect(result).toEqual(mockWorkflow);
      expect(workflowRepository.create).toHaveBeenCalledWith({
        name: 'New Workflow',
        entityType: 'order',
        tenantId: 'tenant-1',
      });
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(workflowRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.updateWorkflow('tenant-1', 'workflow-1', {
        name: 'Updated Workflow',
      });

      expect(workflowRepository.update).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteWorkflow', () => {
    it('should soft delete workflow and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(workflowRepository, 'softDelete').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.deleteWorkflow('tenant-1', 'workflow-1');

      expect(workflowRepository.softDelete).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        id: 'workflow-1',
      });
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('activateWorkflow', () => {
    it('should activate workflow and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(workflowRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.activateWorkflow('tenant-1', 'workflow-1');

      expect(workflowRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: 'workflow-1' },
        { status: WorkflowStatus.ACTIVE },
      );
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('findAllInstances', () => {
    it('should return all workflow instances for tenant', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockInstance]);

      const result = await service.findAllInstances('tenant-1');

      expect(result).toEqual([mockInstance]);
      expect(instanceRepository.createQueryBuilder).toHaveBeenCalledWith('instance');
    });
  });

  describe('findInstanceById', () => {
    it('should return instance from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockInstance as WorkflowInstance);

      const result = await service.findInstanceById('tenant-1', 'instance-1');

      expect(result).toEqual(mockInstance);
    });

    it('should throw NotFoundException when instance not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (key, fn) => fn());
      jest.spyOn(instanceRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findInstanceById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('startWorkflow', () => {
    it('should start workflow instance', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockWorkflow as Workflow);
      jest.spyOn(instanceRepository, 'create').mockReturnValue(mockInstance as WorkflowInstance);
      jest.spyOn(instanceRepository, 'save').mockResolvedValue(mockInstance as WorkflowInstance);

      const result = await service.startWorkflow('tenant-1', 'workflow-1', 'order', 'order-1', 'user-1');

      expect(result).toEqual(mockInstance);
      expect(instanceRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        workflowId: 'workflow-1',
        entityType: 'order',
        entityId: 'order-1',
        initiatedBy: 'user-1',
        status: WorkflowInstanceStatus.IN_PROGRESS,
        currentStep: 0,
        stepHistory: [],
      });
    });

    it('should throw BadRequestException when workflow is not active', async () => {
      const inactiveWorkflow = { ...mockWorkflow, status: WorkflowStatus.DRAFT };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(inactiveWorkflow as Workflow);

      await expect(
        service.startWorkflow('tenant-1', 'workflow-1', 'order', 'order-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveStep', () => {
    it('should approve current step and move to next', async () => {
      jest.spyOn(cacheService, 'getOrSet')
        .mockResolvedValueOnce(mockInstance as WorkflowInstance)
        .mockResolvedValueOnce(mockWorkflow as Workflow)
        .mockResolvedValueOnce({ ...mockInstance, currentStep: 1 } as WorkflowInstance);
      jest.spyOn(instanceRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.approveStep('tenant-1', 'instance-1', 'manager-1', 'Approved');

      expect(instanceRepository.update).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should mark instance as approved when all steps completed', async () => {
      const lastStepInstance = { ...mockInstance, currentStep: 1 };
      jest.spyOn(cacheService, 'getOrSet')
        .mockResolvedValueOnce(lastStepInstance as WorkflowInstance)
        .mockResolvedValueOnce(mockWorkflow as Workflow)
        .mockResolvedValueOnce({ ...lastStepInstance, status: WorkflowInstanceStatus.APPROVED } as WorkflowInstance);
      jest.spyOn(instanceRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.approveStep('tenant-1', 'instance-1', 'director-1');

      expect(instanceRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: 'instance-1' },
        expect.objectContaining({
          status: WorkflowInstanceStatus.APPROVED,
        }),
      );
    });
  });

  describe('rejectStep', () => {
    it('should reject workflow instance', async () => {
      jest.spyOn(cacheService, 'getOrSet')
        .mockResolvedValueOnce(mockInstance as WorkflowInstance)
        .mockResolvedValueOnce({ ...mockInstance, status: WorkflowInstanceStatus.REJECTED } as WorkflowInstance);
      jest.spyOn(instanceRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.rejectStep('tenant-1', 'instance-1', 'manager-1', 'Not approved');

      expect(instanceRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: 'instance-1' },
        expect.objectContaining({
          status: WorkflowInstanceStatus.REJECTED,
        }),
      );
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('cancelInstance', () => {
    it('should cancel workflow instance', async () => {
      jest.spyOn(cacheService, 'getOrSet')
        .mockResolvedValueOnce(mockInstance as WorkflowInstance)
        .mockResolvedValueOnce({ ...mockInstance, status: WorkflowInstanceStatus.CANCELLED } as WorkflowInstance);
      jest.spyOn(instanceRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.cancelInstance('tenant-1', 'instance-1');

      expect(instanceRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: 'instance-1' },
        { status: WorkflowInstanceStatus.CANCELLED },
      );
      expect(cacheService.del).toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkflowService } from './workflow.service';
import { Workflow, WorkflowStatus } from './entities/workflow.entity';
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';
import { BadRequestException } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';

describe('WorkflowService', () => {
  let service: WorkflowService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockWorkflowRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockInstanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    getOrSet: jest.fn((key, factory) => factory()),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockWorkflowRepository,
        },
        {
          provide: getRepositoryToken(WorkflowInstance),
          useValue: mockInstanceRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Workflow Management', () => {
    it('should find all workflows', async () => {
      const mockWorkflows = [{ id: '1', name: 'Approval Workflow' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockWorkflows);

      const result = await service.findAllWorkflows('tenant-1');

      expect(result).toEqual(mockWorkflows);
      expect(mockWorkflowRepository.createQueryBuilder).toHaveBeenCalledWith('workflow');
    });

    it('should activate workflow', async () => {
      const mockWorkflow = { id: '1', status: WorkflowStatus.DRAFT };
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);
      mockWorkflowRepository.update.mockResolvedValue({ affected: 1 });
      mockWorkflowRepository.findOne.mockResolvedValue({
        ...mockWorkflow,
        status: WorkflowStatus.ACTIVE,
      });

      await service.activateWorkflow('tenant-1', '1');

      expect(mockWorkflowRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: '1' },
        { status: WorkflowStatus.ACTIVE },
      );
    });
  });

  describe('Workflow Instance Management', () => {
    it('should start workflow', async () => {
      const mockWorkflow = {
        id: 'wf-1',
        status: WorkflowStatus.ACTIVE,
        steps: [{ name: 'Step 1' }, { name: 'Step 2' }],
      };
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);
      mockInstanceRepository.create.mockReturnValue({
        workflowId: 'wf-1',
        status: WorkflowInstanceStatus.IN_PROGRESS,
      });
      mockInstanceRepository.save.mockResolvedValue({
        workflowId: 'wf-1',
        status: WorkflowInstanceStatus.IN_PROGRESS,
      });

      const result = await service.startWorkflow('tenant-1', 'wf-1', 'Order', 'order-1', 'user-1');

      expect(result.status).toBe(WorkflowInstanceStatus.IN_PROGRESS);
    });

    it('should throw error if workflow not active', async () => {
      const mockWorkflow = { id: 'wf-1', status: WorkflowStatus.DRAFT };
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);

      await expect(
        service.startWorkflow('tenant-1', 'wf-1', 'Order', 'order-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve step', async () => {
      const mockInstance = {
        id: 'inst-1',
        workflowId: 'wf-1',
        currentStep: 0,
        stepHistory: [],
      };
      const mockWorkflow = {
        id: 'wf-1',
        steps: [{ name: 'Step 1' }, { name: 'Step 2' }],
      };
      mockInstanceRepository.findOne.mockResolvedValue(mockInstance);
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);
      mockInstanceRepository.update.mockResolvedValue({ affected: 1 });
      mockInstanceRepository.findOne.mockResolvedValue({
        ...mockInstance,
        currentStep: 1,
      });

      await service.approveStep('tenant-1', 'inst-1', 'user-1', 'Approved');

      expect(mockInstanceRepository.update).toHaveBeenCalled();
    });

    it('should complete workflow when all steps approved', async () => {
      const mockInstance = {
        id: 'inst-1',
        workflowId: 'wf-1',
        currentStep: 1,
        stepHistory: [],
      };
      const mockWorkflow = {
        id: 'wf-1',
        steps: [{ name: 'Step 1' }, { name: 'Step 2' }],
      };
      mockInstanceRepository.findOne.mockResolvedValue(mockInstance);
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);
      mockInstanceRepository.update.mockResolvedValue({ affected: 1 });
      mockInstanceRepository.findOne.mockResolvedValue({
        ...mockInstance,
        status: WorkflowInstanceStatus.APPROVED,
      });

      await service.approveStep('tenant-1', 'inst-1', 'user-1');

      expect(mockInstanceRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: 'inst-1' },
        expect.objectContaining({
          status: WorkflowInstanceStatus.APPROVED,
        }),
      );
    });

    it('should reject step', async () => {
      const mockInstance = {
        id: 'inst-1',
        currentStep: 0,
        stepHistory: [],
      };
      mockInstanceRepository.findOne.mockResolvedValue(mockInstance);
      mockInstanceRepository.update.mockResolvedValue({ affected: 1 });
      mockInstanceRepository.findOne.mockResolvedValue({
        ...mockInstance,
        status: WorkflowInstanceStatus.REJECTED,
      });

      await service.rejectStep('tenant-1', 'inst-1', 'user-1', 'Not approved');

      expect(mockInstanceRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: 'inst-1' },
        expect.objectContaining({
          status: WorkflowInstanceStatus.REJECTED,
        }),
      );
    });
  });
});

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow, WorkflowStatus } from './entities/workflow.entity';
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowInstance)
    private instanceRepository: Repository<WorkflowInstance>,
    private readonly cacheService: CacheService,
  ) {}

  // Workflow Definition Management
  async findAllWorkflows(tenantId: string): Promise<Workflow[]> {
    return this.workflowRepository
      .createQueryBuilder('workflow')
      .select([
        'workflow.id',
        'workflow.name',
        'workflow.description',
        'workflow.status',
        'workflow.entityType',
        'workflow.createdAt',
      ])
      .where('workflow.tenantId = :tenantId', { tenantId })
      .andWhere('workflow.deletedAt IS NULL')
      .orderBy('workflow.createdAt', 'DESC')
      .getMany();
  }

  async findWorkflowById(tenantId: string, id: string): Promise<Workflow> {
    const cacheKey = generateCacheKey('workflow', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const workflow = await this.workflowRepository.findOne({
          where: { tenantId, id },
        });
        if (!workflow) {
          throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        return workflow;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createWorkflow(tenantId: string, data: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflowRepository.create({
      ...data,
      tenantId,
    });
    return this.workflowRepository.save(workflow);
  }

  async updateWorkflow(tenantId: string, id: string, data: Partial<Workflow>): Promise<Workflow> {
    await this.findWorkflowById(tenantId, id);
    await this.workflowRepository.update({ tenantId, id }, data);

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow', tenantId, id));

    return this.findWorkflowById(tenantId, id);
  }

  async deleteWorkflow(tenantId: string, id: string): Promise<void> {
    await this.findWorkflowById(tenantId, id);
    await this.workflowRepository.softDelete({ tenantId, id });

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow', tenantId, id));
  }

  async activateWorkflow(tenantId: string, id: string): Promise<Workflow> {
    await this.findWorkflowById(tenantId, id);
    await this.workflowRepository.update({ tenantId, id }, { status: WorkflowStatus.ACTIVE });

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow', tenantId, id));

    return this.findWorkflowById(tenantId, id);
  }

  // Workflow Instance Management
  async findAllInstances(tenantId: string): Promise<WorkflowInstance[]> {
    return this.instanceRepository
      .createQueryBuilder('instance')
      .select([
        'instance.id',
        'instance.workflowId',
        'instance.entityType',
        'instance.entityId',
        'instance.status',
        'instance.currentStep',
        'instance.initiatedBy',
        'instance.createdAt',
      ])
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('instance.deletedAt IS NULL')
      .orderBy('instance.createdAt', 'DESC')
      .getMany();
  }

  async findInstanceById(tenantId: string, id: string): Promise<WorkflowInstance> {
    const cacheKey = generateCacheKey('workflow-instance', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const instance = await this.instanceRepository.findOne({
          where: { tenantId, id },
        });
        if (!instance) {
          throw new NotFoundException(`Workflow instance with ID ${id} not found`);
        }
        return instance;
      },
      CacheTTL.MEDIUM,
    );
  }

  async startWorkflow(
    tenantId: string,
    workflowId: string,
    entityType: string,
    entityId: string,
    initiatedBy: string,
  ): Promise<WorkflowInstance> {
    const workflow = await this.findWorkflowById(tenantId, workflowId);

    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Workflow is not active');
    }

    const instance = this.instanceRepository.create({
      tenantId,
      workflowId,
      entityType,
      entityId,
      initiatedBy,
      status: WorkflowInstanceStatus.IN_PROGRESS,
      currentStep: 0,
      stepHistory: [],
    });

    return this.instanceRepository.save(instance);
  }

  async approveStep(
    tenantId: string,
    instanceId: string,
    approvedBy: string,
    notes?: string,
  ): Promise<WorkflowInstance> {
    const instance = await this.findInstanceById(tenantId, instanceId);
    const workflow = await this.findWorkflowById(tenantId, instance.workflowId);

    const stepHistory = instance.stepHistory || [];
    stepHistory.push({
      step: instance.currentStep,
      action: 'approved',
      approvedBy,
      notes,
      timestamp: new Date(),
    });

    const nextStep = instance.currentStep + 1;
    const isComplete = nextStep >= workflow.steps.length;

    await this.instanceRepository.update(
      { tenantId, id: instanceId },
      {
        currentStep: nextStep,
        stepHistory,
        status: isComplete ? WorkflowInstanceStatus.APPROVED : WorkflowInstanceStatus.IN_PROGRESS,
        notes,
      },
    );

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow-instance', tenantId, instanceId));

    return this.findInstanceById(tenantId, instanceId);
  }

  async rejectStep(
    tenantId: string,
    instanceId: string,
    rejectedBy: string,
    notes?: string,
  ): Promise<WorkflowInstance> {
    const instance = await this.findInstanceById(tenantId, instanceId);

    const stepHistory = instance.stepHistory || [];
    stepHistory.push({
      step: instance.currentStep,
      action: 'rejected',
      rejectedBy,
      notes,
      timestamp: new Date(),
    });

    await this.instanceRepository.update(
      { tenantId, id: instanceId },
      {
        stepHistory,
        status: WorkflowInstanceStatus.REJECTED,
        notes,
      },
    );

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow-instance', tenantId, instanceId));

    return this.findInstanceById(tenantId, instanceId);
  }

  async cancelInstance(tenantId: string, instanceId: string): Promise<WorkflowInstance> {
    await this.findInstanceById(tenantId, instanceId);
    await this.instanceRepository.update(
      { tenantId, id: instanceId },
      { status: WorkflowInstanceStatus.CANCELLED },
    );

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow-instance', tenantId, instanceId));

    return this.findInstanceById(tenantId, instanceId);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowInstance, WorkflowInstanceStatus } from './entities/workflow-instance.entity';
import { WorkflowStatus } from './enums';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';

@Injectable()
export class WorkflowService {
  private secureWorkflowRepo: SecureRepository<Workflow>;
  private secureInstanceRepo: SecureRepository<WorkflowInstance>;

  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowInstance)
    private instanceRepository: Repository<WorkflowInstance>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureWorkflowRepo = new SecureRepository(
      workflowRepository,
      permissionService,
      'Workflow',
    );
    this.secureInstanceRepo = new SecureRepository(
      instanceRepository,
      permissionService,
      'WorkflowInstance',
    );
  }

  // Workflow Definition Management
  async findAllWorkflows(user: User): Promise<Workflow[]> {
    return this.secureWorkflowRepo.find(user, {
      order: { createdAt: 'DESC' },
    });
  }

  async findWorkflowById(user: User, id: string): Promise<Workflow> {
    const cacheKey = generateCacheKey('workflow', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const workflow = await this.secureWorkflowRepo.findOne(user, {
          where: { id },
        });
        if (!workflow) {
          throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        return workflow;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createWorkflow(user: User, data: Partial<Workflow>): Promise<Workflow> {
    return this.secureWorkflowRepo.save(user, data);
  }

  async updateWorkflow(user: User, id: string, data: Partial<Workflow>): Promise<Workflow> {
    const workflow = await this.findWorkflowById(user, id);
    Object.assign(workflow, data);
    const updated = await this.secureWorkflowRepo.save(user, workflow);

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow', user.tenantId, id));

    return updated;
  }

  async deleteWorkflow(user: User, id: string): Promise<void> {
    const workflow = await this.findWorkflowById(user, id);
    await this.secureWorkflowRepo.remove(user, workflow);

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow', user.tenantId, id));
  }

  async activateWorkflow(user: User, id: string): Promise<Workflow> {
    const workflow = await this.findWorkflowById(user, id);
    workflow.status = WorkflowStatus.ACTIVE;
    const updated = await this.secureWorkflowRepo.save(user, workflow);

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow', user.tenantId, id));

    return updated;
  }

  // Workflow Instance Management
  async findAllInstances(user: User): Promise<WorkflowInstance[]> {
    return this.secureInstanceRepo.find(user, {
      order: { createdAt: 'DESC' },
    });
  }

  async findInstanceById(user: User, id: string): Promise<WorkflowInstance> {
    const cacheKey = generateCacheKey('workflow-instance', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const instance = await this.secureInstanceRepo.findOne(user, {
          where: { id },
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
    user: User,
    workflowId: string,
    entityType: string,
    entityId: string,
  ): Promise<WorkflowInstance> {
    const workflow = await this.findWorkflowById(user, workflowId);

    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Workflow is not active');
    }

    const instance = this.instanceRepository.create({
      workflowId,
      entityType,
      entityId,
      initiatedBy: user.id,
      status: WorkflowInstanceStatus.IN_PROGRESS,
      currentStep: 0,
      stepHistory: [],
      tenantId: user.tenantId,
    });

    return this.secureInstanceRepo.save(user, instance);
  }

  async approveStep(user: User, instanceId: string, notes?: string): Promise<WorkflowInstance> {
    const instance = await this.findInstanceById(user, instanceId);
    const workflow = await this.findWorkflowById(user, instance.workflowId);

    const stepHistory = instance.stepHistory || [];
    stepHistory.push({
      step: instance.currentStep,
      action: 'approved',
      approvedBy: user.id,
      notes,
      timestamp: new Date(),
    });

    const nextStep = instance.currentStep + 1;
    const isComplete = nextStep >= workflow.steps.length;

    instance.currentStep = nextStep;
    instance.stepHistory = stepHistory;
    instance.status = isComplete
      ? WorkflowInstanceStatus.APPROVED
      : WorkflowInstanceStatus.IN_PROGRESS;
    instance.notes = notes;

    const updated = await this.secureInstanceRepo.save(user, instance);

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow-instance', user.tenantId, instanceId));

    return updated;
  }

  async rejectStep(user: User, instanceId: string, notes?: string): Promise<WorkflowInstance> {
    const instance = await this.findInstanceById(user, instanceId);

    const stepHistory = instance.stepHistory || [];
    stepHistory.push({
      step: instance.currentStep,
      action: 'rejected',
      rejectedBy: user.id,
      notes,
      timestamp: new Date(),
    });

    instance.stepHistory = stepHistory;
    instance.status = WorkflowInstanceStatus.REJECTED;
    instance.notes = notes;

    const updated = await this.secureInstanceRepo.save(user, instance);

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow-instance', user.tenantId, instanceId));

    return updated;
  }

  async cancelInstance(user: User, instanceId: string): Promise<WorkflowInstance> {
    const instance = await this.findInstanceById(user, instanceId);
    instance.status = WorkflowInstanceStatus.CANCELLED;

    const updated = await this.secureInstanceRepo.save(user, instance);

    // Invalidate cache
    await this.cacheService.del(generateCacheKey('workflow-instance', user.tenantId, instanceId));

    return updated;
  }
}

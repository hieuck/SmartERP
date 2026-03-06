import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Workflow } from './entities/workflow.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // Workflow Definition Endpoints
  @Get()
  async findAllWorkflows(@TenantId() tenantId: string): Promise<Workflow[]> {
    return this.workflowService.findAllWorkflows(tenantId);
  }

  @Get(':id')
  async findWorkflowById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Workflow> {
    return this.workflowService.findWorkflowById(tenantId, id);
  }

  @Post()
  async createWorkflow(
    @TenantId() tenantId: string,
    @Body() data: Partial<Workflow>,
  ): Promise<Workflow> {
    return this.workflowService.createWorkflow(tenantId, data);
  }

  @Put(':id')
  async updateWorkflow(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: Partial<Workflow>,
  ): Promise<Workflow> {
    return this.workflowService.updateWorkflow(tenantId, id, data);
  }

  @Delete(':id')
  async deleteWorkflow(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.workflowService.deleteWorkflow(tenantId, id);
  }

  @Post(':id/activate')
  async activateWorkflow(@TenantId() tenantId: string, @Param('id') id: string): Promise<Workflow> {
    return this.workflowService.activateWorkflow(tenantId, id);
  }

  // Workflow Instance Endpoints
  @Get('instances/all')
  async findAllInstances(@TenantId() tenantId: string): Promise<WorkflowInstance[]> {
    return this.workflowService.findAllInstances(tenantId);
  }

  @Get('instances/:id')
  async findInstanceById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.findInstanceById(tenantId, id);
  }

  @Post('instances/start')
  async startWorkflow(
    @TenantId() tenantId: string,
    @Body('workflowId') workflowId: string,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
    @Body('initiatedBy') initiatedBy: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.startWorkflow(
      tenantId,
      workflowId,
      entityType,
      entityId,
      initiatedBy,
    );
  }

  @Post('instances/:id/approve')
  async approveStep(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
    @Body('notes') notes?: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.approveStep(tenantId, id, approvedBy, notes);
  }

  @Post('instances/:id/reject')
  async rejectStep(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('rejectedBy') rejectedBy: string,
    @Body('notes') notes?: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.rejectStep(tenantId, id, rejectedBy, notes);
  }

  @Post('instances/:id/cancel')
  async cancelInstance(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.cancelInstance(tenantId, id);
  }
}

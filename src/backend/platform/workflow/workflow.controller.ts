import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Workflow } from './entities/workflow.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';

import { User } from '@/common/security/permission.service';
@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // Workflow Definition Endpoints
  @Get()
  async findAllWorkflows(@CurrentUser() user: User): Promise<Workflow[]> {
    return this.workflowService.findAllWorkflows(user);
  }

  @Get(':id')
  async findWorkflowById(@CurrentUser() user: User, @Param('id') id: string): Promise<Workflow> {
    return this.workflowService.findWorkflowById(user, id);
  }

  @Post()
  async createWorkflow(
    @CurrentUser() user: User,
    @Body() data: Partial<Workflow>,
  ): Promise<Workflow> {
    return this.workflowService.createWorkflow(user, data);
  }

  @Put(':id')
  async updateWorkflow(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() data: Partial<Workflow>,
  ): Promise<Workflow> {
    return this.workflowService.updateWorkflow(user, id, data);
  }

  @Delete(':id')
  async deleteWorkflow(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.workflowService.deleteWorkflow(user, id);
  }

  @Post(':id/activate')
  async activateWorkflow(@CurrentUser() user: User, @Param('id') id: string): Promise<Workflow> {
    return this.workflowService.activateWorkflow(user, id);
  }

  // Workflow Instance Endpoints
  @Get('instances/all')
  async findAllInstances(@CurrentUser() user: User): Promise<WorkflowInstance[]> {
    return this.workflowService.findAllInstances(user);
  }

  @Get('instances/:id')
  async findInstanceById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.findInstanceById(user, id);
  }

  @Post('instances/start')
  async startWorkflow(
    @CurrentUser() user: User,
    @Body('workflowId') workflowId: string,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
    @Body('initiatedBy') initiatedBy: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.startWorkflow(
      user,
      workflowId,
      entityType,
      entityId,
    );
  }

  @Post('instances/:id/approve')
  async approveStep(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
    @Body('notes') notes?: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.approveStep(user, id, notes);
  }

  @Post('instances/:id/reject')
  async rejectStep(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('rejectedBy') rejectedBy: string,
    @Body('notes') notes?: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.rejectStep(user, id, notes);
  }

  @Post('instances/:id/cancel')
  async cancelInstance(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<WorkflowInstance> {
    return this.workflowService.cancelInstance(user, id);
  }
}

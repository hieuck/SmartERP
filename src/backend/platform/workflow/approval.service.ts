import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalRequest, ApprovalStatus } from './entities/approval-request.entity';
import { Workflow } from './entities/workflow.entity';
import { User } from '@/common/security/permission.service';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalRequest)
    private readonly approvalRepository: Repository<ApprovalRequest>,
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
  ) {}

  async submitForApproval(
    entityType: string,
    entityId: string,
    user: User,
  ): Promise<ApprovalRequest> {
    // Get workflow for entity type
    const workflow = await this.getWorkflow(entityType, user.tenantId);

    if (!workflow) {
      throw new NotFoundException(`Workflow not found for ${entityType}`);
    }

    // Create approval request
    const request = this.approvalRepository.create({
      entityType,
      entityId,
      workflowId: workflow.id,
      currentState: 'pending_approval',
      requestedBy: user.id,
      requestedAt: new Date(),
      status: ApprovalStatus.PENDING,
      tenantId: user.tenantId,
    });

    const savedRequest = await this.approvalRepository.save(request);

    // Notify approvers
    await this.notifyApprovers(workflow, savedRequest);

    return savedRequest;
  }

  async approve(requestId: string, user: User): Promise<ApprovalRequest> {
    const request = await this.findOne(requestId, user.tenantId);

    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    const workflow = await this.getWorkflow(request.entityType, user.tenantId);

    if (!this.canApprove(workflow, user)) {
      throw new ForbiddenException('You do not have permission to approve this request');
    }

    // Update request
    request.status = ApprovalStatus.APPROVED;
    request.approvedBy = user.id;
    request.approvedAt = new Date();

    await this.approvalRepository.save(request);

    // Update entity state
    await this.updateEntityState(request.entityType, request.entityId, 'approved');

    // Notify requester
    await this.notifyRequester(request);

    return request;
  }

  async reject(
    requestId: string,
    user: User,
    reason: string,
  ): Promise<ApprovalRequest> {
    const request = await this.findOne(requestId, user.tenantId);

    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const workflow = await this.getWorkflow(request.entityType, user.tenantId);

    if (!this.canApprove(workflow, user)) {
      throw new ForbiddenException('You do not have permission to reject this request');
    }

    // Update request
    request.status = ApprovalStatus.REJECTED;
    request.approvedBy = user.id;
    request.approvedAt = new Date();
    request.rejectionReason = reason;

    await this.approvalRepository.save(request);

    // Update entity state
    await this.updateEntityState(request.entityType, request.entityId, 'rejected');

    // Notify requester
    await this.notifyRequester(request);

    return request;
  }

  async cancel(user: User, requestId: string): Promise<ApprovalRequest> {
    const request = await this.findOne(requestId, user.tenantId);

    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    if (request.requestedBy !== user.id) {
      throw new ForbiddenException('Only the requester can cancel this request');
    }

    request.status = ApprovalStatus.CANCELLED;
    return this.approvalRepository.save(request);
  }

  async getMyRequests(user: User): Promise<ApprovalRequest[]> {
    return this.approvalRepository.find({
      where: {
        requestedBy: user.id,
        tenantId: user.tenantId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingApprovals(user: User): Promise<ApprovalRequest[]> {
    // Get all pending requests
    const requests = await this.approvalRepository.find({
      where: {
        status: ApprovalStatus.PENDING,
        tenantId: user.tenantId,
      },
      order: { createdAt: 'DESC' },
    });

    // Filter by user's approval permissions
    const workflows = await this.workflowRepository.find({
      where: { tenantId: user.tenantId },
    });

    const workflowMap = new Map(workflows.map((w) => [w.id, w]));

    return requests.filter((request) => {
      const workflow = workflowMap.get(request.workflowId);
      return workflow && this.canApprove(workflow, user);
    });
  }

  private async findOne(id: string, tenantId: string): Promise<ApprovalRequest> {
    const request = await this.approvalRepository.findOne({
      where: { id, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Approval request not found');
    }

    return request;
  }

  private async getWorkflow(entityType: string, tenantId: string): Promise<Workflow> {
    return this.workflowRepository.findOne({
      where: { entityType, tenantId },
    });
  }

  private canApprove(workflow: Workflow, user: User): boolean {
    // Check if user has any of the allowed roles for approval
    const states = (workflow as any).states || (workflow as any).transitions || [];
    const approvalState = states.find(
      (s: any) => s.name === 'pending_approval' || s.name === 'approved',
    );

    if (!approvalState) {
      return false;
    }

    return user.roles.some((role) => approvalState.allowedRoles.includes(role));
  }

  private async updateEntityState(
    entityType: string,
    entityId: string,
    newState: string,
  ): Promise<void> {
    // This would update the actual entity's state
    // Implementation depends on entity type
    // For now, this is a placeholder
    // In real implementation, this would use a registry of entity services
  }

  private async notifyApprovers(
    workflow: Workflow,
    request: ApprovalRequest,
  ): Promise<void> {
    // Send notifications to users who can approve
    // Implementation would use NotificationService
  }

  private async notifyRequester(request: ApprovalRequest): Promise<void> {
    // Send notification to requester about approval/rejection
    // Implementation would use NotificationService
  }
}

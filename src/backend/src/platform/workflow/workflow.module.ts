import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ApprovalRequest } from './entities/approval-request.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, WorkflowInstance, ApprovalRequest]),
    CacheModule,
    SecurityModule,
  ],
  controllers: [WorkflowController, ApprovalController],
  providers: [WorkflowService, ApprovalService],
  exports: [WorkflowService, ApprovalService],
})
export class WorkflowModule {}

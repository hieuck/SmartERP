import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { Workflow } from './entities/workflow.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { ApprovalRequest } from './entities/approval-request.entity';
import { CacheModule } from '../../common/cache/cache.module';
import { SecurityModule } from '../../common/security/security.module';

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

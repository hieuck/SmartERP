import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueTrackingController } from './issue-tracking.controller';
import { IssueTrackingService } from './issue-tracking.service';
import { Issue } from './entities/issue.entity';
import { IssueComment } from './entities/issue-comment.entity';
import { IssueAttachment } from './entities/issue-attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Issue, IssueComment, IssueAttachment])],
  controllers: [IssueTrackingController],
  providers: [IssueTrackingService],
  exports: [IssueTrackingService],
})
export class IssueTrackingModule {}

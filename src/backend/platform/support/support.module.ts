import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { Ticket } from './entities/ticket.entity';
import { SLA } from './entities/sla.entity';
import { AssignmentRule } from './entities/assignment-rule.entity';
import { KnowledgeBaseArticle } from './entities/knowledge-base-article.entity';
import { CannedResponse } from './entities/canned-response.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      SLA,
      AssignmentRule,
      KnowledgeBaseArticle,
      CannedResponse,
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}

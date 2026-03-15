import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportTemplateService } from './report-template.service';
import { ReportController } from './report.controller';
import { Report } from './entities/report.entity';
import { ReportColumn } from './entities/report-column.entity';
import { ReportExecution } from './entities/report-execution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportColumn, ReportExecution])],
  controllers: [ReportController],
  providers: [ReportService, ReportTemplateService],
  exports: [ReportService, ReportTemplateService],
})
export class ReportModule {}

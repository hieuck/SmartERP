import { Module } from '@nestjs/common';
import { AccountingModule as AccountModule } from './account/accounting.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [AccountModule, ReportsModule],
  exports: [AccountModule, ReportsModule],
})
export class AccountingDomainModule {}

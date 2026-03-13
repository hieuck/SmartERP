import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [AccountModule, ReportsModule],
  exports: [AccountModule, ReportsModule],
})
export class AccountingDomainModule {}

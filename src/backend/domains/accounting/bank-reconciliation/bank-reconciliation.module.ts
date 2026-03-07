import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankReconciliationController } from './bank-reconciliation.controller';
import { BankReconciliationService } from './bank-reconciliation.service';
import { BankStatement } from './entities/bank-statement.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { JournalEntry } from '../journal-entry/entities/journal-entry.entity';
import { Account } from '../account/entities/account.entity';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankStatement,
      BankTransaction,
      JournalEntry,
      Account,
    ]),
    SecurityModule,
  ],
  controllers: [BankReconciliationController],
  providers: [BankReconciliationService],
  exports: [BankReconciliationService],
})
export class BankReconciliationModule {}

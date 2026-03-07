import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../account/entities/account.entity';
import { JournalLine } from '../account/entities/journal-line.entity';
import { JournalEntryStatus } from '../account/entities/journal-entry.entity';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';

export interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  asOfDate: Date;
  accounts: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface GeneralLedgerTransaction {
  date: Date;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerReport {
  account: {
    code: string;
    name: string;
    type: AccountType;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  openingBalance: number;
  transactions: GeneralLedgerTransaction[];
  closingBalance: number;
}

@Injectable()
export class ReportsService {
  private secureAccountRepo: SecureRepository<Account>;
  private secureJournalLineRepo: SecureRepository<JournalLine>;

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(JournalLine)
    private readonly journalLineRepository: Repository<JournalLine>,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize secure repositories
    this.secureAccountRepo = new SecureRepository(
      accountRepository,
      permissionService,
      'Account',
    );
    this.secureJournalLineRepo = new SecureRepository(
      journalLineRepository,
      permissionService,
      'JournalLine',
    );
  }

  async getTrialBalance(user: User, asOfDate: Date): Promise<TrialBalanceReport> {
    const accounts = await this.secureAccountRepo.find(user, {
      where: {
        isGroup: false,
        isActive: true,
      },
      order: { code: 'ASC' },
    });

    const rows: TrialBalanceRow[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const account of accounts) {
      const balance = Number(account.balance) || 0;
      let debit = 0;
      let credit = 0;

      // Assets & Expenses: debit normal balance
      if (
        account.type === AccountType.ASSET ||
        account.type === AccountType.EXPENSE
      ) {
        if (balance >= 0) {
          debit = balance;
        } else {
          credit = Math.abs(balance);
        }
      } else {
        // Liabilities, Equity, Income: credit normal balance
        if (balance >= 0) {
          credit = balance;
        } else {
          debit = Math.abs(balance);
        }
      }

      rows.push({
        code: account.code,
        name: account.name,
        debit,
        credit,
      });

      totalDebit += debit;
      totalCredit += credit;
    }

    return {
      asOfDate,
      accounts: rows,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  async getGeneralLedger(
    user: User,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GeneralLedgerReport> {
    const account = await this.secureAccountRepo.findOne(user, {
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Query journal lines with security filtering
    const lines = await this.journalLineRepository
      .createQueryBuilder('line')
      .leftJoinAndSelect('line.journalEntry', 'entry')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('line.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('entry.status = :status', { status: JournalEntryStatus.POSTED })
      .andWhere('entry.entryDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('entry.entryDate', 'ASC')
      .addOrderBy('entry.number', 'ASC')
      .getMany();

    const openingBalance = 0;
    const transactions: GeneralLedgerTransaction[] = [];
    let runningBalance = openingBalance;

    for (const line of lines) {
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      // Calculate running balance based on account type
      if (
        account.type === AccountType.ASSET ||
        account.type === AccountType.EXPENSE
      ) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      transactions.push({
        date: line.journalEntry.entryDate,
        reference: line.journalEntry.number,
        description: line.description || '',
        debit,
        credit,
        balance: runningBalance,
      });
    }

    return {
      account: {
        code: account.code,
        name: account.name,
        type: account.type,
      },
      period: {
        startDate,
        endDate,
      },
      openingBalance,
      transactions,
      closingBalance: runningBalance,
    };
  }

  async getCashFlowStatement(
    user: User,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // TODO: Implement cash flow statement logic
    return {
      period: { startDate, endDate },
      operating: { activities: [], total: 0 },
      investing: { activities: [], total: 0 },
      financing: { activities: [], total: 0 },
      netCashFlow: 0,
    };
  }
}

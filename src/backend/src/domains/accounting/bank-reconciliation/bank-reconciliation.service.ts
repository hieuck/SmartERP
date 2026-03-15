// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { BankStatement } from './entities/bank-statement.entity';
import { BankStatementStatus } from './enums/bank-statement-status.enum';
import { BankTransaction } from './entities/bank-transaction.entity';
import { JournalEntry } from '../account/entities/journal-entry.entity';
import { Account } from '../account/entities/account.entity';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';
import { CreateBankStatementDto } from './dto/create-bank-statement.dto';

@Injectable()
export class BankReconciliationService {
  private secureStatementRepo: SecureRepository<BankStatement>;

  constructor(
    @InjectRepository(BankStatement)
    private readonly statementRepository: Repository<BankStatement>,
    @InjectRepository(BankTransaction)
    private readonly transactionRepository: Repository<BankTransaction>,
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureStatementRepo = new SecureRepository(
      statementRepository,
      permissionService,
      'BankStatement',
    );
  }

  async create(dto: CreateBankStatementDto, user: User): Promise<BankStatement> {
    // Generate statement number
    const number = await this.generateNumber(user.tenantId);

    // Create statement with transactions
    const statement = this.statementRepository.create({
      number,
      bankAccount: { id: dto.bankAccountId } as Account,
      statementDate: dto.statementDate,
      openingBalance: dto.openingBalance,
      closingBalance: dto.closingBalance,
      status: BankStatementStatus.DRAFT,
      transactions: dto.transactions.map((tx) => ({
        ...tx,
        tenantId: user.tenantId,
      })),
      tenantId: user.tenantId,
      createdBy: user.id,
    });

    return this.statementRepository.save(statement);
  }

  async findAll(user: User): Promise<BankStatement[]> {
    return this.secureStatementRepo.find(user, {
      order: { statementDate: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<BankStatement> {
    const statement = await this.secureStatementRepo.findOne(user, {
      where: { id },
      relations: ['bankAccount', 'transactions', 'transactions.matchedEntry'],
    });

    if (!statement) {
      throw new NotFoundException('Bank statement not found');
    }

    return statement;
  }

  async autoMatch(
    statementId: string,
    user: User,
  ): Promise<{ total: number; matched: number; unmatched: number }> {
    const statement = await this.findOne(statementId, user);

    // Get unreconciled journal entries for this bank account
    const entries = await this.getUnreconciledEntries(statement.bankAccount.id, user.tenantId);

    const matches: Array<{ transaction: BankTransaction; entry: JournalEntry }> = [];

    // Match by amount and date (within 3 days)
    for (const tx of statement.transactions) {
      if (tx.isReconciled) continue;

      const match = entries.find((entry) => {
        const amountMatch = Math.abs(entry.amount - Math.abs(tx.amount)) < 0.01;
        const dateMatch =
          Math.abs(entry.date.getTime() - tx.date.getTime()) < 3 * 24 * 60 * 60 * 1000; // 3 days

        return amountMatch && dateMatch;
      });

      if (match) {
        matches.push({ transaction: tx, entry: match });
      }
    }

    // Apply matches
    for (const { transaction, entry } of matches) {
      transaction.matchedEntry = entry;
      transaction.isReconciled = true;
      await this.transactionRepository.save(transaction);
    }

    return {
      total: statement.transactions.length,
      matched: matches.length,
      unmatched: statement.transactions.length - matches.length,
    };
  }

  async manualMatch(transactionId: string, entryId: string, user: User): Promise<BankTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, tenantId: user.tenantId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const entry = await this.journalEntryRepository.findOne({
      where: { id: entryId, tenantId: user.tenantId },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    transaction.matchedEntry = entry;
    transaction.isReconciled = true;

    return this.transactionRepository.save(transaction);
  }

  async unmatch(transactionId: string, user: User): Promise<BankTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, tenantId: user.tenantId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!transaction.isReconciled) {
      throw new BadRequestException('Transaction is not reconciled');
    }

    transaction.matchedEntry = null;
    transaction.isReconciled = false;

    return this.transactionRepository.save(transaction);
  }

  async getReconciliationReport(statementId: string, user: User) {
    const statement = await this.findOne(statementId, user);

    const reconciled = statement.transactions.filter((tx) => tx.isReconciled);
    const unreconciled = statement.transactions.filter((tx) => !tx.isReconciled);

    const bookBalance = await this.getBookBalance(
      statement.bankAccount.id,
      statement.statementDate,
      user.tenantId,
    );

    const reconciledAmount = reconciled.reduce((sum, tx) => sum + tx.amount, 0);
    const unreconciledAmount = unreconciled.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      statement: {
        date: statement.statementDate,
        openingBalance: statement.openingBalance,
        closingBalance: statement.closingBalance,
      },
      book: {
        balance: bookBalance,
      },
      reconciliation: {
        reconciled: reconciled.length,
        unreconciled: unreconciled.length,
        reconciledAmount,
        unreconciledAmount,
        difference: statement.closingBalance - (bookBalance + unreconciledAmount),
      },
      unreconciledTransactions: unreconciled,
    };
  }

  private async generateNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.statementRepository.count({
      where: {
        tenantId,
        number: Like(`BS-${year}-%`),
      },
    });

    return `BS-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async getUnreconciledEntries(
    bankAccountId: string,
    tenantId: string,
  ): Promise<unknown[]> {
    // Get journal entries for this bank account that are not yet reconciled
    const query = this.journalEntryRepository
      .createQueryBuilder('je')
      .leftJoin('je.lines', 'line')
      .leftJoin('bank_transactions', 'bt', 'bt.matched_entry_id = je.id')
      .where('line.account_id = :bankAccountId', { bankAccountId })
      .andWhere('je.tenantId = :tenantId', { tenantId })
      .andWhere('je.status = :status', { status: 'posted' })
      .andWhere('bt.id IS NULL') // Not matched yet
      .select(['je.id as id', 'je.date as date', 'SUM(line.debit - line.credit) as amount'])
      .groupBy('je.id')
      .addGroupBy('je.date');

    return query.getRawMany();
  }

  private async getBookBalance(
    bankAccountId: string,
    asOfDate: Date,
    tenantId: string,
  ): Promise<number> {
    const account = await this.accountRepository.findOne({
      where: { id: bankAccountId, tenantId },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    return account.balance;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { Invoice, InvoiceType } from './entities/invoice.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly cacheService: CacheService,
  ) {}

  // Chart of Accounts
  async findAllAccounts(tenantId: string, type?: AccountType): Promise<Account[]> {
    const where: { tenantId: string; type?: AccountType } = { tenantId };
    if (type) {
      where.type = type;
    }
    return this.accountRepository.find({ where, order: { code: 'ASC' } });
  }

  async findAccountById(id: string, tenantId: string): Promise<Account> {
    const cacheKey = generateCacheKey('account', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.accountRepository.findOne({ where: { id, tenantId } });
      },
      CacheTTL.MEDIUM,
    );
  }

  async createAccount(data: Partial<Account>, tenantId: string): Promise<Account> {
    const account = this.accountRepository.create({ ...data, tenantId });
    return this.accountRepository.save(account);
  }

  async updateAccount(id: string, data: Partial<Account>, tenantId: string): Promise<Account> {
    await this.accountRepository.update({ id, tenantId }, data);

    // Invalidate cache
    const cacheKey = generateCacheKey('account', tenantId, id);
    await this.cacheService.del(cacheKey);

    return this.findAccountById(id, tenantId);
  }

  async deleteAccount(id: string, tenantId: string): Promise<void> {
    await this.accountRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('account', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  // Journal Entries
  async findAllJournalEntries(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<JournalEntry[]> {
    const where: Record<string, unknown> = { tenantId };
    if (startDate && endDate) {
      where.entryDate = Between(startDate, endDate);
    }
    return this.journalEntryRepository.find({ where, order: { entryDate: 'DESC' } });
  }

  async findJournalEntryById(id: string, tenantId: string): Promise<JournalEntry> {
    const cacheKey = generateCacheKey('journal-entry', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.journalEntryRepository.findOne({ where: { id, tenantId } });
      },
      CacheTTL.MEDIUM,
    );
  }

  async createJournalEntry(data: Partial<JournalEntry>, tenantId: string): Promise<JournalEntry> {
    const entry = this.journalEntryRepository.create({ ...data, tenantId });
    return this.journalEntryRepository.save(entry);
  }

  async postJournalEntry(id: string, tenantId: string): Promise<JournalEntry> {
    await this.journalEntryRepository.update({ id, tenantId }, { status: 'posted' });

    // Invalidate cache
    const cacheKey = generateCacheKey('journal-entry', tenantId, id);
    await this.cacheService.del(cacheKey);

    return this.findJournalEntryById(id, tenantId);
  }

  // Invoices
  async findAllInvoices(tenantId: string, type?: InvoiceType): Promise<Invoice[]> {
    const where: { tenantId: string; type?: InvoiceType } = { tenantId };
    if (type) {
      where.type = type;
    }
    return this.invoiceRepository.find({ where, order: { invoiceDate: 'DESC' } });
  }

  async findInvoiceById(id: string, tenantId: string): Promise<Invoice> {
    const cacheKey = generateCacheKey('accounting-invoice', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.invoiceRepository.findOne({ where: { id, tenantId } });
      },
      CacheTTL.MEDIUM,
    );
  }

  async createInvoice(data: Partial<Invoice>, tenantId: string): Promise<Invoice> {
    const invoice = this.invoiceRepository.create({ ...data, tenantId });
    return this.invoiceRepository.save(invoice);
  }

  async updateInvoice(id: string, data: Partial<Invoice>, tenantId: string): Promise<Invoice> {
    await this.invoiceRepository.update({ id, tenantId }, data);

    // Invalidate cache
    const cacheKey = generateCacheKey('accounting-invoice', tenantId, id);
    await this.cacheService.del(cacheKey);

    return this.findInvoiceById(id, tenantId);
  }

  async deleteInvoice(id: string, tenantId: string): Promise<void> {
    await this.invoiceRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('accounting-invoice', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  // Financial Reports
  async getBalanceSheet(
    tenantId: string,
    asOfDate: Date,
  ): Promise<{
    asOfDate: Date;
    assets: { accounts: Account[]; total: number };
    liabilities: { accounts: Account[]; total: number };
    equity: { accounts: Account[]; total: number };
  }> {
    const accounts = await this.accountRepository.find({ where: { tenantId } });

    const assets = accounts.filter((a) => a.type === AccountType.ASSET);
    const liabilities = accounts.filter((a) => a.type === AccountType.LIABILITY);
    const equity = accounts.filter((a) => a.type === AccountType.EQUITY);

    return {
      asOfDate,
      assets: {
        accounts: assets,
        total: assets.reduce((sum, a) => sum + Number(a.balance), 0),
      },
      liabilities: {
        accounts: liabilities,
        total: liabilities.reduce((sum, a) => sum + Number(a.balance), 0),
      },
      equity: {
        accounts: equity,
        total: equity.reduce((sum, a) => sum + Number(a.balance), 0),
      },
    };
  }

  async getProfitAndLoss(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    period: { startDate: Date; endDate: Date };
    revenue: { accounts: Account[]; total: number };
    expenses: { accounts: Account[]; total: number };
    netIncome: number;
  }> {
    const accounts = await this.accountRepository.find({ where: { tenantId } });

    const revenue = accounts.filter((a) => a.type === AccountType.REVENUE);
    const expenses = accounts.filter((a) => a.type === AccountType.EXPENSE);

    const totalRevenue = revenue.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + Number(a.balance), 0);

    return {
      period: { startDate, endDate },
      revenue: {
        accounts: revenue,
        total: totalRevenue,
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses,
      },
      netIncome: totalRevenue - totalExpenses,
    };
  }
}

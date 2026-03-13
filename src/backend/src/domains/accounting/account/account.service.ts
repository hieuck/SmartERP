import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Account } from './entities/account.entity';
import { AccountType } from './enums/account-type.enum';
import { JournalEntry } from './entities/journal-entry.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceType } from './enums/invoice-type.enum';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { CacheService } from '@common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@common/cache/cache.config';
import { SecureRepository } from '@common/security/secure-repository';
import { PermissionService, User } from '@common/security/permission.service';

@Injectable()
export class AccountService {
  private secureAccountRepo: SecureRepository<Account>;
  private secureJournalRepo: SecureRepository<JournalEntry>;
  private secureInvoiceRepo: SecureRepository<Invoice>;

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize secure repositories
    this.secureAccountRepo = new SecureRepository(
      accountRepository,
      permissionService,
      'Account',
    );
    this.secureJournalRepo = new SecureRepository(
      journalEntryRepository,
      permissionService,
      'JournalEntry',
    );
    this.secureInvoiceRepo = new SecureRepository(
      invoiceRepository,
      permissionService,
      'Invoice',
    );
  }

  // ==================== CHART OF ACCOUNTS ====================

  async findAllAccounts(user: User, type?: AccountType): Promise<Account[]> {
    const where: { type?: AccountType } = {};
    if (type) {
      where.type = type;
    }
    return this.secureAccountRepo.find(user, { where, order: { code: 'ASC' } });
  }

  async findAccountById(user: User, id: string): Promise<Account> {
    const cacheKey = generateCacheKey('account', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const account = await this.secureAccountRepo.findOne(user, { where: { id } });
        if (!account) {
          throw new NotFoundException('Account not found');
        }
        return account;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createAccount(user: User, data: Partial<Account>): Promise<Account> {
    return this.secureAccountRepo.save(user, data);
  }

  async updateAccount(user: User, id: string, data: Partial<Account>): Promise<Account> {
    const account = await this.findAccountById(user, id);
    Object.assign(account, data);
    
    const updated = await this.secureAccountRepo.save(user, account);

    // Invalidate cache
    const cacheKey = generateCacheKey('account', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteAccount(user: User, id: string): Promise<void> {
    const account = await this.findAccountById(user, id);
    await this.secureAccountRepo.remove(user, account);

    // Invalidate cache
    const cacheKey = generateCacheKey('account', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async createDefaultCOA(user: User): Promise<void> {
    const coaTemplate = [
      // Assets (1000-1999)
      { code: '1000', name: 'Assets', type: AccountType.ASSET, isGroup: true, parentId: null },
      { code: '1100', name: 'Current Assets', type: AccountType.ASSET, isGroup: true, parentCode: '1000' },
      { code: '1110', name: 'Cash', type: AccountType.ASSET, isGroup: false, parentCode: '1100' },
      { code: '1120', name: 'Bank', type: AccountType.ASSET, isGroup: false, parentCode: '1100' },
      { code: '1130', name: 'Accounts Receivable', type: AccountType.ASSET, isGroup: false, parentCode: '1100' },
      { code: '1140', name: 'Inventory', type: AccountType.ASSET, isGroup: false, parentCode: '1100' },

      // Liabilities (2000-2999)
      { code: '2000', name: 'Liabilities', type: AccountType.LIABILITY, isGroup: true, parentId: null },
      { code: '2100', name: 'Current Liabilities', type: AccountType.LIABILITY, isGroup: true, parentCode: '2000' },
      { code: '2110', name: 'Accounts Payable', type: AccountType.LIABILITY, isGroup: false, parentCode: '2100' },
      { code: '2120', name: 'Tax Payable', type: AccountType.LIABILITY, isGroup: false, parentCode: '2100' },

      // Equity (3000-3999)
      { code: '3000', name: 'Equity', type: AccountType.EQUITY, isGroup: true, parentId: null },
      { code: '3100', name: 'Capital', type: AccountType.EQUITY, isGroup: false, parentCode: '3000' },
      { code: '3200', name: 'Retained Earnings', type: AccountType.EQUITY, isGroup: false, parentCode: '3000' },

      // Income (4000-4999)
      { code: '4000', name: 'Income', type: AccountType.INCOME, isGroup: true, parentId: null },
      { code: '4100', name: 'Sales Revenue', type: AccountType.INCOME, isGroup: false, parentCode: '4000' },
      { code: '4200', name: 'Service Revenue', type: AccountType.INCOME, isGroup: false, parentCode: '4000' },

      // Expenses (5000-5999)
      { code: '5000', name: 'Expenses', type: AccountType.EXPENSE, isGroup: true, parentId: null },
      { code: '5100', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, isGroup: false, parentCode: '5000' },
      { code: '5200', name: 'Operating Expenses', type: AccountType.EXPENSE, isGroup: true, parentCode: '5000' },
      { code: '5210', name: 'Salaries', type: AccountType.EXPENSE, isGroup: false, parentCode: '5200' },
      { code: '5220', name: 'Rent', type: AccountType.EXPENSE, isGroup: false, parentCode: '5200' },
      { code: '5230', name: 'Utilities', type: AccountType.EXPENSE, isGroup: false, parentCode: '5200' },
    ];

    // Create accounts with parent relationships
    const accountMap = new Map<string, string>(); // code -> id mapping

    for (const template of coaTemplate) {
      const { parentCode, ...accountData } = template as typeof template & { parentCode?: string };

      const account = {
        ...accountData,
        parentId: parentCode ? accountMap.get(parentCode) : null,
        isActive: true,
      };

      const saved = await this.secureAccountRepo.save(user, account);
      accountMap.set(saved.code, saved.id);
    }
  }

  async getAccountHierarchy(user: User): Promise<Account[]> {
    const accounts = await this.secureAccountRepo.find(user, {
      order: { code: 'ASC' },
    });

    return this.buildTree(accounts);
  }

  private buildTree(accounts: Account[]): Account[] {
    const map = new Map<string, Account & { children: Account[] }>();
    const roots: Account[] = [];

    // First pass: create map
    accounts.forEach((acc) => map.set(acc.id, { ...acc, children: [] }));

    // Second pass: build tree
    accounts.forEach((acc) => {
      const node = map.get(acc.id);
      if (acc.parentId) {
        const parent = map.get(acc.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async validateAccountCode(user: User, code: string): Promise<boolean> {
    const existing = await this.accountRepository.findOne({
      where: { tenantId: user.tenantId, code },
    });
    return !existing;
  }

  async getAccountsByType(user: User, type: AccountType): Promise<Account[]> {
    return this.secureAccountRepo.find(user, {
      where: { type, isActive: true },
      order: { code: 'ASC' },
    });
  }

  async getLeafAccounts(user: User): Promise<Account[]> {
    return this.secureAccountRepo.find(user, {
      where: { isGroup: false, isActive: true },
      order: { code: 'ASC' },
    });
  }

  // ==================== JOURNAL ENTRIES ====================

  async findAllJournalEntries(
    user: User,
    startDate?: Date,
    endDate?: Date,
  ): Promise<JournalEntry[]> {
    const where: Record<string, unknown> = {};
    if (startDate && endDate) {
      where.entryDate = Between(startDate, endDate);
    }
    return this.secureJournalRepo.find(user, { where, order: { createdAt: 'DESC' } });
  }

  async findJournalEntryById(user: User, id: string): Promise<JournalEntry> {
    const cacheKey = generateCacheKey('journal-entry', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const entry = await this.secureJournalRepo.findOne(user, { where: { id } });
        if (!entry) {
          throw new NotFoundException('Journal entry not found');
        }
        return entry;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createJournalEntry(user: User, dto: CreateJournalEntryDto): Promise<JournalEntry> {
    // Generate auto number
    const number = await this.generateJournalNumber(user.tenantId);

    const entry = {
      ...dto,
      number,
      status: 'draft',
    };

    return this.secureJournalRepo.save(user, entry);
  }

  async postJournalEntry(user: User, id: string): Promise<JournalEntry> {
    const entry = await this.journalEntryRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['lines', 'lines.account'],
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    if (entry.status !== 'draft') {
      throw new BadRequestException('Only draft entries can be posted');
    }

    // Update status
    entry.status = 'posted' as any;
    entry.postedBy = user.id;
    entry.postedAt = new Date();

    await this.journalEntryRepository.save(entry);

    // Update account balances
    await this.updateAccountBalances(entry);

    // Invalidate cache
    const cacheKey = generateCacheKey('journal-entry', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return entry;
  }

  async generateJournalNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.journalEntryRepository.count({
      where: { tenantId },
    });

    const nextNumber = count + 1;
    return `JE-${year}-${String(nextNumber).padStart(4, '0')}`;
  }

  private async updateAccountBalances(entry: JournalEntry): Promise<void> {
    for (const line of entry.lines) {
      const account = await this.accountRepository.findOne({
        where: { id: line.accountId, tenantId: entry.tenantId },
      });

      if (!account) continue;

      // Update balance based on account type
      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
        account.balance = Number(account.balance) + Number(line.debit) - Number(line.credit);
      } else {
        account.balance = Number(account.balance) + Number(line.credit) - Number(line.debit);
      }

      await this.accountRepository.save(account);
    }
  }

  // ==================== INVOICES ====================

  async findAllInvoices(user: User, type?: InvoiceType): Promise<Invoice[]> {
    const where: { type?: InvoiceType } = {};
    if (type) {
      where.type = type;
    }
    return this.secureInvoiceRepo.find(user, { where, order: { invoiceDate: 'DESC' } });
  }

  async findInvoiceById(user: User, id: string): Promise<Invoice> {
    const cacheKey = generateCacheKey('accounting-invoice', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const invoice = await this.secureInvoiceRepo.findOne(user, { where: { id } });
        if (!invoice) {
          throw new NotFoundException('Invoice not found');
        }
        return invoice;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createInvoice(user: User, data: Partial<Invoice>): Promise<Invoice> {
    return this.secureInvoiceRepo.save(user, data);
  }

  async updateInvoice(user: User, id: string, data: Partial<Invoice>): Promise<Invoice> {
    const invoice = await this.findInvoiceById(user, id);
    Object.assign(invoice, data);
    
    const updated = await this.secureInvoiceRepo.save(user, invoice);

    // Invalidate cache
    const cacheKey = generateCacheKey('accounting-invoice', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteInvoice(user: User, id: string): Promise<void> {
    const invoice = await this.findInvoiceById(user, id);
    await this.secureInvoiceRepo.remove(user, invoice);

    // Invalidate cache
    const cacheKey = generateCacheKey('accounting-invoice', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  // ==================== FINANCIAL REPORTS ====================

  async getBalanceSheet(
    user: User,
    asOfDate: Date,
  ): Promise<{
    asOfDate: Date;
    assets: { accounts: Account[]; total: number };
    liabilities: { accounts: Account[]; total: number };
    equity: { accounts: Account[]; total: number };
  }> {
    const accounts = await this.secureAccountRepo.find(user, {});

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
    user: User,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    period: { startDate: Date; endDate: Date };
    revenue: { accounts: Account[]; total: number };
    expenses: { accounts: Account[]; total: number };
    netIncome: number;
  }> {
    const accounts = await this.secureAccountRepo.find(user, {});

    const revenue = accounts.filter((a) => a.type === AccountType.INCOME);
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

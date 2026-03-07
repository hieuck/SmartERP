# Implementation Recommendations: SmartERP Feature Gaps

**Date**: 2026-03-07  
**Purpose**: Hướng dẫn chi tiết implement các features còn thiếu trong SmartERP  
**Based on**: Odoo & ERPNext analysis

---

## 📋 Executive Summary

Sau khi phân tích Odoo và ERPNext, SmartERP hiện đạt **35%** so với full-featured ERP. Document này cung cấp roadmap chi tiết để đạt **80%+** trong 6-12 tháng.

### Key Gaps Identified

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| Accounting | 20% | 80% | 🔴 CRITICAL |
| Permissions | 40% | 90% | 🔴 CRITICAL |
| Inventory | 60% | 85% | 🟡 HIGH |
| HR | 15% | 70% | 🟡 HIGH |
| Workflow | 30% | 80% | 🟡 HIGH |
| Manufacturing | 40% | 75% | 🟢 MEDIUM |
| Reporting | 25% | 70% | 🟢 MEDIUM |

---

## 1. 💰 Accounting Module (CRITICAL)

### Current State
- ✅ Basic invoicing (order module)
- ✅ Payment tracking
- ❌ No General Ledger
- ❌ No Journal Entries
- ❌ No Financial Reports

### Target State
- ✅ Full double-entry accounting
- ✅ Chart of Accounts
- ✅ Journal Entries
- ✅ Financial Reports (Balance Sheet, P&L, Cash Flow)
- ✅ Bank Reconciliation
- ✅ Multi-currency support

---

### 1.1. Chart of Accounts

**Implementation Steps**:

```typescript
// 1. Create Account entity
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // e.g., "1000", "2000"

  @Column()
  name: string; // e.g., "Cash", "Accounts Receivable"

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type: AccountType; // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Account; // For hierarchical COA

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isGroup: boolean; // Group account (has children)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number; // Current balance

  @Column()
  tenantId: string;
}

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  INCOME = 'income',
  EXPENSE = 'expense',
}

// 2. Create Account service
@Injectable()
export class AccountService {
  async createCOA(tenantId: string) {
    // Create default chart of accounts
    const accounts = [
      // Assets
      { code: '1000', name: 'Assets', type: AccountType.ASSET, isGroup: true },
      { code: '1100', name: 'Current Assets', type: AccountType.ASSET, parent: '1000', isGroup: true },
      { code: '1110', name: 'Cash', type: AccountType.ASSET, parent: '1100' },
      { code: '1120', name: 'Bank', type: AccountType.ASSET, parent: '1100' },
      { code: '1130', name: 'Accounts Receivable', type: AccountType.ASSET, parent: '1100' },
      { code: '1140', name: 'Inventory', type: AccountType.ASSET, parent: '1100' },
      
      // Liabilities
      { code: '2000', name: 'Liabilities', type: AccountType.LIABILITY, isGroup: true },
      { code: '2100', name: 'Current Liabilities', type: AccountType.LIABILITY, parent: '2000', isGroup: true },
      { code: '2110', name: 'Accounts Payable', type: AccountType.LIABILITY, parent: '2100' },
      { code: '2120', name: 'Tax Payable', type: AccountType.LIABILITY, parent: '2100' },
      
      // Equity
      { code: '3000', name: 'Equity', type: AccountType.EQUITY, isGroup: true },
      { code: '3100', name: 'Capital', type: AccountType.EQUITY, parent: '3000' },
      { code: '3200', name: 'Retained Earnings', type: AccountType.EQUITY, parent: '3000' },
      
      // Income
      { code: '4000', name: 'Income', type: AccountType.INCOME, isGroup: true },
      { code: '4100', name: 'Sales Revenue', type: AccountType.INCOME, parent: '4000' },
      { code: '4200', name: 'Service Revenue', type: AccountType.INCOME, parent: '4000' },
      
      // Expenses
      { code: '5000', name: 'Expenses', type: AccountType.EXPENSE, isGroup: true },
      { code: '5100', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, parent: '5000' },
      { code: '5200', name: 'Operating Expenses', type: AccountType.EXPENSE, parent: '5000', isGroup: true },
      { code: '5210', name: 'Salaries', type: AccountType.EXPENSE, parent: '5200' },
      { code: '5220', name: 'Rent', type: AccountType.EXPENSE, parent: '5200' },
      { code: '5230', name: 'Utilities', type: AccountType.EXPENSE, parent: '5200' },
    ];

    // Create accounts with parent relationships
    for (const acc of accounts) {
      await this.create({ ...acc, tenantId });
    }
  }

  async getHierarchy(tenantId: string): Promise<Account[]> {
    // Return tree structure
    const accounts = await this.repository.find({
      where: { tenantId },
      order: { code: 'ASC' },
    });

    return this.buildTree(accounts);
  }

  private buildTree(accounts: Account[]): Account[] {
    const map = new Map<string, Account>();
    const roots: Account[] = [];

    // First pass: create map
    accounts.forEach(acc => map.set(acc.id, { ...acc, children: [] }));

    // Second pass: build tree
    accounts.forEach(acc => {
      const node = map.get(acc.id);
      if (acc.parent) {
        const parent = map.get(acc.parent.id);
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
}
```

**Estimated Time**: 1 week  
**Dependencies**: None  
**Testing**: Unit tests + E2E tests for COA creation

---

### 1.2. Journal Entries

**Implementation Steps**:

```typescript
// 1. Create JournalEntry entity
@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  number: string; // Auto-generated: JE-2026-0001

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  reference?: string; // External reference

  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Column({
    type: 'enum',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.DRAFT,
  })
  status: JournalEntryStatus;

  @OneToMany(() => JournalLine, line => line.entry, {
    cascade: true,
    eager: true,
  })
  lines: JournalLine[];

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalDebit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalCredit: number;

  @Column()
  createdBy: string;

  @Column({ nullable: true })
  postedBy?: string;

  @Column({ nullable: true })
  postedAt?: Date;

  @Column()
  tenantId: string;

  @BeforeInsert()
  @BeforeUpdate()
  computeTotals() {
    if (this.lines) {
      this.totalDebit = this.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      this.totalCredit = this.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    // Must have at least 2 lines
    if (!this.lines || this.lines.length < 2) {
      throw new Error('Journal entry must have at least 2 lines');
    }

    // Must be balanced
    if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
      throw new Error(
        `Entry must be balanced. Debit: ${this.totalDebit}, Credit: ${this.totalCredit}`
      );
    }

    // Each line must have either debit or credit (not both)
    this.lines.forEach((line, index) => {
      if (line.debit > 0 && line.credit > 0) {
        throw new Error(`Line ${index + 1}: Cannot have both debit and credit`);
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new Error(`Line ${index + 1}: Must have either debit or credit`);
      }
    });
  }
}

export enum JournalEntryStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  CANCELLED = 'cancelled',
}

// 2. Create JournalLine entity
@Entity('journal_lines')
export class JournalLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JournalEntry, entry => entry.lines)
  @JoinColumn({ name: 'entry_id' })
  entry: JournalEntry;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  tenantId: string;
}

// 3. Create JournalEntry service
@Injectable()
export class JournalEntryService {
  async create(dto: CreateJournalEntryDto, user: User) {
    // Generate number
    const number = await this.generateNumber(user.tenantId);

    // Create entry
    const entry = this.repository.create({
      ...dto,
      number,
      status: JournalEntryStatus.DRAFT,
      createdBy: user.id,
      tenantId: user.tenantId,
    });

    return this.repository.save(entry);
  }

  async post(id: string, user: User) {
    const entry = await this.findOne(id);

    // Validate
    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new BadRequestException('Only draft entries can be posted');
    }

    // Update status
    entry.status = JournalEntryStatus.POSTED;
    entry.postedBy = user.id;
    entry.postedAt = new Date();

    await this.repository.save(entry);

    // Create GL entries
    await this.createGLEntries(entry);

    // Update account balances
    await this.updateAccountBalances(entry);

    return entry;
  }

  private async createGLEntries(entry: JournalEntry) {
    const glEntries = entry.lines.map(line => ({
      date: entry.date,
      accountId: line.account.id,
      debit: line.debit,
      credit: line.credit,
      description: line.description || entry.memo,
      journalEntryId: entry.id,
      tenantId: entry.tenantId,
    }));

    await this.glRepository.save(glEntries);
  }

  private async updateAccountBalances(entry: JournalEntry) {
    for (const line of entry.lines) {
      const account = await this.accountRepository.findOne(line.account.id);
      
      // Update balance based on account type
      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
        // Debit increases, credit decreases
        account.balance += line.debit - line.credit;
      } else {
        // Credit increases, debit decreases
        account.balance += line.credit - line.debit;
      }

      await this.accountRepository.save(account);
    }
  }

  private async generateNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.repository.count({
      where: {
        tenantId,
        number: Like(`JE-${year}-%`),
      },
    });

    return `JE-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
```

**Estimated Time**: 2 weeks  
**Dependencies**: Chart of Accounts  
**Testing**: Unit tests + E2E tests for posting and GL entries

---


### 1.3. Financial Reports

**Implementation Steps**:

```typescript
// 1. Create Report service
@Injectable()
export class FinancialReportService {
  // Balance Sheet
  async getBalanceSheet(tenantId: string, date: Date) {
    const accounts = await this.accountRepository.find({
      where: { tenantId },
    });

    // Get balances at specific date
    const balances = await this.getAccountBalances(tenantId, date);

    // Group by type
    const assets = this.filterByType(accounts, balances, AccountType.ASSET);
    const liabilities = this.filterByType(accounts, balances, AccountType.LIABILITY);
    const equity = this.filterByType(accounts, balances, AccountType.EQUITY);

    const totalAssets = this.sumBalances(assets);
    const totalLiabilities = this.sumBalances(liabilities);
    const totalEquity = this.sumBalances(equity);

    return {
      date,
      assets: this.buildHierarchy(assets),
      liabilities: this.buildHierarchy(liabilities),
      equity: this.buildHierarchy(equity),
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  // Profit & Loss (Income Statement)
  async getProfitAndLoss(tenantId: string, startDate: Date, endDate: Date) {
    const accounts = await this.accountRepository.find({
      where: { tenantId },
    });

    // Get period balances
    const balances = await this.getPeriodBalances(tenantId, startDate, endDate);

    // Group by type
    const income = this.filterByType(accounts, balances, AccountType.INCOME);
    const expenses = this.filterByType(accounts, balances, AccountType.EXPENSE);

    const totalIncome = this.sumBalances(income);
    const totalExpenses = this.sumBalances(expenses);
    const netProfit = totalIncome - totalExpenses;

    return {
      period: { startDate, endDate },
      income: this.buildHierarchy(income),
      expenses: this.buildHierarchy(expenses),
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    };
  }

  // Cash Flow Statement
  async getCashFlow(tenantId: string, startDate: Date, endDate: Date) {
    // Operating activities
    const operating = await this.getOperatingCashFlow(tenantId, startDate, endDate);
    
    // Investing activities
    const investing = await this.getInvestingCashFlow(tenantId, startDate, endDate);
    
    // Financing activities
    const financing = await this.getFinancingCashFlow(tenantId, startDate, endDate);

    const netCashFlow = operating + investing + financing;

    return {
      period: { startDate, endDate },
      operatingActivities: operating,
      investingActivities: investing,
      financingActivities: financing,
      netCashFlow,
    };
  }

  // Trial Balance
  async getTrialBalance(tenantId: string, date: Date) {
    const accounts = await this.accountRepository.find({
      where: { tenantId, isGroup: false },
    });

    const balances = await this.getAccountBalances(tenantId, date);

    const lines = accounts.map(account => {
      const balance = balances.get(account.id) || 0;
      const isDebitBalance = 
        account.type === AccountType.ASSET || 
        account.type === AccountType.EXPENSE;

      return {
        account: account.name,
        code: account.code,
        debit: isDebitBalance && balance > 0 ? balance : 0,
        credit: !isDebitBalance && balance > 0 ? balance : 0,
      };
    });

    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    return {
      date,
      lines,
      totalDebit,
      totalCredit,
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  // General Ledger
  async getGeneralLedger(
    tenantId: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const account = await this.accountRepository.findOne(accountId);
    
    const entries = await this.glRepository.find({
      where: {
        tenantId,
        accountId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC', createdAt: 'ASC' },
    });

    let runningBalance = await this.getAccountBalance(accountId, startDate);

    const lines = entries.map(entry => {
      runningBalance += entry.debit - entry.credit;
      return {
        date: entry.date,
        description: entry.description,
        debit: entry.debit,
        credit: entry.credit,
        balance: runningBalance,
      };
    });

    return {
      account: account.name,
      code: account.code,
      period: { startDate, endDate },
      openingBalance: await this.getAccountBalance(accountId, startDate),
      lines,
      closingBalance: runningBalance,
    };
  }

  // Aged Receivables
  async getAgedReceivables(tenantId: string, asOfDate: Date) {
    const receivables = await this.getReceivableInvoices(tenantId, asOfDate);

    const aged = receivables.map(invoice => {
      const daysOverdue = this.getDaysOverdue(invoice.dueDate, asOfDate);
      const aging = this.getAgingBucket(daysOverdue);

      return {
        customer: invoice.customer.name,
        invoiceNumber: invoice.number,
        invoiceDate: invoice.date,
        dueDate: invoice.dueDate,
        amount: invoice.outstandingAmount,
        daysOverdue,
        aging,
      };
    });

    // Group by aging bucket
    const summary = {
      current: aged.filter(a => a.aging === 'current').reduce((sum, a) => sum + a.amount, 0),
      '1-30': aged.filter(a => a.aging === '1-30').reduce((sum, a) => sum + a.amount, 0),
      '31-60': aged.filter(a => a.aging === '31-60').reduce((sum, a) => sum + a.amount, 0),
      '61-90': aged.filter(a => a.aging === '61-90').reduce((sum, a) => sum + a.amount, 0),
      '90+': aged.filter(a => a.aging === '90+').reduce((sum, a) => sum + a.amount, 0),
    };

    return {
      asOfDate,
      details: aged,
      summary,
      total: Object.values(summary).reduce((sum, val) => sum + val, 0),
    };
  }

  private getAgingBucket(daysOverdue: number): string {
    if (daysOverdue <= 0) return 'current';
    if (daysOverdue <= 30) return '1-30';
    if (daysOverdue <= 60) return '31-60';
    if (daysOverdue <= 90) return '61-90';
    return '90+';
  }
}
```

**Estimated Time**: 2 weeks  
**Dependencies**: Journal Entries, GL Entries  
**Testing**: Unit tests + E2E tests for each report

---

### 1.4. Bank Reconciliation

**Implementation Steps**:

```typescript
// 1. Create BankStatement entity
@Entity('bank_statements')
export class BankStatement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount: Account;

  @Column({ type: 'date' })
  statementDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  closingBalance: number;

  @OneToMany(() => BankTransaction, tx => tx.statement, { cascade: true })
  transactions: BankTransaction[];

  @Column({
    type: 'enum',
    enum: ['draft', 'reconciled'],
    default: 'draft',
  })
  status: string;

  @Column()
  tenantId: string;
}

@Entity('bank_transactions')
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BankStatement, stmt => stmt.transactions)
  @JoinColumn({ name: 'statement_id' })
  statement: BankStatement;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // Positive = deposit, Negative = withdrawal

  @Column({ nullable: true })
  reference?: string;

  @ManyToOne(() => JournalEntry, { nullable: true })
  @JoinColumn({ name: 'matched_entry_id' })
  matchedEntry?: JournalEntry;

  @Column({ default: false })
  isReconciled: boolean;

  @Column()
  tenantId: string;
}

// 2. Create Reconciliation service
@Injectable()
export class BankReconciliationService {
  async importStatement(
    bankAccountId: string,
    file: Express.Multer.File,
    user: User,
  ) {
    // Parse CSV/OFX file
    const transactions = await this.parseStatementFile(file);

    // Create statement
    const statement = this.statementRepository.create({
      bankAccountId,
      statementDate: new Date(),
      openingBalance: transactions[0].balance,
      closingBalance: transactions[transactions.length - 1].balance,
      transactions: transactions.map(tx => ({
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        reference: tx.reference,
        tenantId: user.tenantId,
      })),
      tenantId: user.tenantId,
    });

    return this.statementRepository.save(statement);
  }

  async autoMatch(statementId: string) {
    const statement = await this.statementRepository.findOne(statementId, {
      relations: ['transactions'],
    });

    // Get unreconciled journal entries for this bank account
    const entries = await this.getUnreconciledEntries(
      statement.bankAccount.id,
      statement.tenantId,
    );

    const matches: Array<{ transaction: BankTransaction; entry: JournalEntry }> = [];

    // Match by amount and date (within 3 days)
    for (const tx of statement.transactions) {
      if (tx.isReconciled) continue;

      const match = entries.find(entry => {
        const amountMatch = Math.abs(entry.amount - Math.abs(tx.amount)) < 0.01;
        const dateMatch = Math.abs(
          entry.date.getTime() - tx.date.getTime()
        ) < 3 * 24 * 60 * 60 * 1000; // 3 days

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

  async manualMatch(
    transactionId: string,
    entryId: string,
  ) {
    const transaction = await this.transactionRepository.findOne(transactionId);
    const entry = await this.journalEntryRepository.findOne(entryId);

    transaction.matchedEntry = entry;
    transaction.isReconciled = true;

    return this.transactionRepository.save(transaction);
  }

  async getReconciliationReport(statementId: string) {
    const statement = await this.statementRepository.findOne(statementId, {
      relations: ['transactions', 'transactions.matchedEntry'],
    });

    const reconciled = statement.transactions.filter(tx => tx.isReconciled);
    const unreconciled = statement.transactions.filter(tx => !tx.isReconciled);

    const bookBalance = await this.getBookBalance(
      statement.bankAccount.id,
      statement.statementDate,
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
}
```

**Estimated Time**: 2 weeks  
**Dependencies**: Journal Entries  
**Testing**: Unit tests + E2E tests for import and matching

---

### Summary: Accounting Module

**Total Estimated Time**: 7 weeks

| Feature | Time | Priority |
|---------|------|----------|
| Chart of Accounts | 1 week | 🔴 CRITICAL |
| Journal Entries | 2 weeks | 🔴 CRITICAL |
| Financial Reports | 2 weeks | 🔴 CRITICAL |
| Bank Reconciliation | 2 weeks | 🔴 CRITICAL |

**Next Steps**:
1. Create specs for each feature
2. Implement in order (COA → JE → Reports → Bank Rec)
3. Write comprehensive tests
4. Update frontend to display reports

---

## 2. 🔐 Permissions Module (CRITICAL)

### Current State
- ✅ Role-based access (RBAC)
- ✅ JWT authentication
- ✅ Tenant isolation
- ❌ No record-level security
- ❌ No field-level permissions

### Target State
- ✅ Record-level security (row-level)
- ✅ Field-level permissions
- ✅ Permission queries
- ✅ Dynamic permission rules

---

### 2.1. Record-Level Security

**Implementation Steps**:

```typescript
// 1. Create Permission service
@Injectable()
export class PermissionService {
  applyRecordLevelSecurity<T>(
    query: SelectQueryBuilder<T>,
    user: User,
    entityName: string,
  ): SelectQueryBuilder<T> {
    // Get permission rules for this entity
    const rules = this.getPermissionRules(entityName, user.roles);

    // Apply each rule
    for (const rule of rules) {
      if (rule.type === 'owner') {
        query.andWhere('entity.createdBy = :userId', { userId: user.id });
      } else if (rule.type === 'department') {
        query.andWhere('entity.departmentId = :deptId', { 
          deptId: user.departmentId 
        });
      } else if (rule.type === 'custom') {
        // Apply custom SQL condition
        query.andWhere(rule.condition, rule.params);
      }
    }

    return query;
  }

  private getPermissionRules(entityName: string, roles: string[]) {
    // Define rules per entity and role
    const RULES = {
      'SalesOrder': {
        'sales_user': [
          { type: 'owner' }, // Can only see own orders
        ],
        'sales_manager': [
          { type: 'department' }, // Can see department orders
        ],
        'admin': [], // Can see all
      },
      'JournalEntry': {
        'accountant': [
          { type: 'custom', condition: 'entity.status != :status', params: { status: 'cancelled' } },
        ],
        'manager': [], // Can see all
      },
    };

    // Get rules for highest role
    const entityRules = RULES[entityName] || {};
    for (const role of ['admin', 'manager', ...roles]) {
      if (entityRules[role]) {
        return entityRules[role];
      }
    }

    return [{ type: 'owner' }]; // Default: owner only
  }
}

// 2. Create base repository with permissions
export class SecureRepository<T> extends Repository<T> {
  constructor(
    private permissionService: PermissionService,
  ) {
    super();
  }

  async findAllSecure(user: User, options?: FindManyOptions<T>) {
    let query = this.createQueryBuilder('entity');

    // Apply record-level security
    query = this.permissionService.applyRecordLevelSecurity(
      query,
      user,
      this.metadata.name,
    );

    // Apply user options
    if (options?.where) {
      query.andWhere(options.where);
    }

    return query.getMany();
  }

  async findOneSecure(id: string, user: User) {
    let query = this.createQueryBuilder('entity')
      .where('entity.id = :id', { id });

    // Apply record-level security
    query = this.permissionService.applyRecordLevelSecurity(
      query,
      user,
      this.metadata.name,
    );

    const result = await query.getOne();
    if (!result) {
      throw new NotFoundException();
    }

    return result;
  }
}

// 3. Use in service
@Injectable()
export class SalesOrderService {
  constructor(
    @InjectRepository(SalesOrder)
    private repository: SecureRepository<SalesOrder>,
    private permissionService: PermissionService,
  ) {}

  async findAll(user: User, filters: any) {
    return this.repository.findAllSecure(user, { where: filters });
  }

  async findOne(id: string, user: User) {
    return this.repository.findOneSecure(id, user);
  }
}
```

**Estimated Time**: 2 weeks  
**Dependencies**: None  
**Testing**: Unit tests + E2E tests with different user roles

---


### 2.2. Field-Level Permissions

**Implementation Steps**:

```typescript
// 1. Define field permissions
export const FIELD_PERMISSIONS = {
  'SalesOrder.discountAmount': ['sales_manager', 'admin'],
  'SalesOrder.approvedBy': ['admin'],
  'JournalEntry.postedBy': ['accountant', 'manager', 'admin'],
  'Employee.salary': ['hr_manager', 'admin'],
};

// 2. Create field filter interceptor
@Injectable()
export class FieldPermissionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      map(data => this.filterFields(data, user)),
    );
  }

  private filterFields(data: any, user: User): any {
    if (Array.isArray(data)) {
      return data.map(item => this.filterFields(item, user));
    }

    if (typeof data === 'object' && data !== null) {
      const filtered = {};
      const entityName = data.constructor.name;

      for (const [key, value] of Object.entries(data)) {
        const permKey = `${entityName}.${key}`;
        const requiredRoles = FIELD_PERMISSIONS[permKey];

        // If no permission defined or user has required role, include field
        if (!requiredRoles || user.roles.some(r => requiredRoles.includes(r))) {
          filtered[key] = value;
        }
      }

      return filtered;
    }

    return data;
  }
}

// 3. Apply to controllers
@Controller('sales-orders')
@UseInterceptors(FieldPermissionInterceptor)
export class SalesOrderController {
  // All responses will be filtered
}
```

**Estimated Time**: 1 week  
**Dependencies**: None  
**Testing**: Unit tests for field filtering

---

### Summary: Permissions Module

**Total Estimated Time**: 3 weeks

| Feature | Time | Priority |
|---------|------|----------|
| Record-Level Security | 2 weeks | 🔴 CRITICAL |
| Field-Level Permissions | 1 week | 🟡 HIGH |

---

## 3. 📦 Inventory Module (HIGH)

### Current State
- ✅ Multi-warehouse
- ✅ Stock transfer
- ✅ Stock adjustment
- ❌ No serial/batch tracking
- ❌ No FIFO valuation

### Target State
- ✅ Serial number tracking
- ✅ Batch/lot tracking
- ✅ FIFO/LIFO valuation
- ✅ Expiry tracking

---

### 3.1. Serial/Batch Tracking

**Implementation Steps**:

```typescript
// 1. Add tracking fields to Product
@Entity('products')
export class Product {
  // ... existing fields

  @Column({
    type: 'enum',
    enum: TrackingType,
    default: TrackingType.NONE,
  })
  trackingType: TrackingType;

  @Column({ default: false })
  hasExpiry: boolean;
}

export enum TrackingType {
  NONE = 'none',
  SERIAL = 'serial',
  BATCH = 'batch',
}

// 2. Create SerialNumber entity
@Entity('serial_numbers')
export class SerialNumber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  number: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse?: Warehouse;

  @Column({
    type: 'enum',
    enum: ['available', 'sold', 'damaged'],
    default: 'available',
  })
  status: string;

  @Column({ type: 'date', nullable: true })
  purchaseDate?: Date;

  @Column({ type: 'date', nullable: true })
  warrantyExpiry?: Date;

  @Column()
  tenantId: string;
}

// 3. Create Batch entity
@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  number: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'date', nullable: true })
  manufacturingDate?: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @OneToMany(() => BatchStock, stock => stock.batch)
  stocks: BatchStock[];

  @Column()
  tenantId: string;
}

@Entity('batch_stocks')
export class BatchStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Batch, batch => batch.stocks)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column()
  tenantId: string;
}

// 4. Update StockMove to include serial/batch
@Entity('stock_moves')
export class StockMove {
  // ... existing fields

  @ManyToOne(() => SerialNumber, { nullable: true })
  @JoinColumn({ name: 'serial_number_id' })
  serialNumber?: SerialNumber;

  @ManyToOne(() => Batch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch?: Batch;
}

// 5. Update InventoryService
@Injectable()
export class InventoryService {
  async transferStock(dto: TransferStockDto, user: User) {
    const product = await this.productRepository.findOne(dto.productId);

    // Validate serial/batch if required
    if (product.trackingType === TrackingType.SERIAL) {
      if (!dto.serialNumbers || dto.serialNumbers.length !== dto.quantity) {
        throw new BadRequestException('Serial numbers required');
      }

      // Validate serial numbers exist and available
      for (const sn of dto.serialNumbers) {
        const serial = await this.serialRepository.findOne({
          where: { number: sn, status: 'available' },
        });
        if (!serial) {
          throw new BadRequestException(`Serial ${sn} not available`);
        }
      }
    } else if (product.trackingType === TrackingType.BATCH) {
      if (!dto.batchId) {
        throw new BadRequestException('Batch required');
      }

      // Validate batch has enough quantity
      const batch = await this.batchRepository.findOne(dto.batchId);
      const batchStock = await this.batchStockRepository.findOne({
        where: { batchId: dto.batchId, warehouseId: dto.fromWarehouseId },
      });

      if (!batchStock || batchStock.quantity < dto.quantity) {
        throw new BadRequestException('Insufficient batch quantity');
      }
    }

    // Create stock move
    const move = await this.createStockMove({
      ...dto,
      type: 'transfer',
      userId: user.id,
    });

    // Update serial/batch locations
    if (product.trackingType === TrackingType.SERIAL) {
      await this.updateSerialLocations(dto.serialNumbers, dto.toWarehouseId);
    } else if (product.trackingType === TrackingType.BATCH) {
      await this.updateBatchStock(dto.batchId, dto.fromWarehouseId, dto.toWarehouseId, dto.quantity);
    }

    return move;
  }

  private async updateSerialLocations(serialNumbers: string[], warehouseId: string) {
    for (const sn of serialNumbers) {
      await this.serialRepository.update(
        { number: sn },
        { warehouseId },
      );
    }
  }

  private async updateBatchStock(
    batchId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
  ) {
    // Decrease from warehouse
    await this.batchStockRepository.decrement(
      { batchId, warehouseId: fromWarehouseId },
      'quantity',
      quantity,
    );

    // Increase to warehouse
    const toStock = await this.batchStockRepository.findOne({
      where: { batchId, warehouseId: toWarehouseId },
    });

    if (toStock) {
      await this.batchStockRepository.increment(
        { batchId, warehouseId: toWarehouseId },
        'quantity',
        quantity,
      );
    } else {
      await this.batchStockRepository.save({
        batchId,
        warehouseId: toWarehouseId,
        quantity,
      });
    }
  }
}
```

**Estimated Time**: 3 weeks  
**Dependencies**: None  
**Testing**: Unit tests + E2E tests for serial/batch tracking

---

### 3.2. FIFO Valuation

**Implementation Steps**:

```typescript
// 1. Create StockValuation entity
@Entity('stock_valuations')
export class StockValuation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalCost: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  referenceType: string; // 'purchase', 'production', 'adjustment'

  @Column()
  referenceId: string;

  @Column()
  tenantId: string;
}

// 2. Create ValuationService
@Injectable()
export class ValuationService {
  async calculateFIFO(
    productId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<{ cost: number; valuations: StockValuation[] }> {
    // Get available stock valuations (FIFO order)
    const valuations = await this.valuationRepository.find({
      where: {
        productId,
        warehouseId,
        quantity: MoreThan(0),
      },
      order: { date: 'ASC', createdAt: 'ASC' },
    });

    let remainingQty = quantity;
    let totalCost = 0;
    const usedValuations: StockValuation[] = [];

    for (const valuation of valuations) {
      if (remainingQty <= 0) break;

      const qtyToUse = Math.min(remainingQty, valuation.quantity);
      const cost = qtyToUse * valuation.unitCost;

      totalCost += cost;
      remainingQty -= qtyToUse;

      usedValuations.push({
        ...valuation,
        quantity: qtyToUse,
        totalCost: cost,
      });

      // Update valuation quantity
      valuation.quantity -= qtyToUse;
      await this.valuationRepository.save(valuation);
    }

    if (remainingQty > 0) {
      throw new BadRequestException('Insufficient stock for FIFO calculation');
    }

    return {
      cost: totalCost,
      valuations: usedValuations,
    };
  }

  async addStockValuation(
    productId: string,
    warehouseId: string,
    quantity: number,
    unitCost: number,
    referenceType: string,
    referenceId: string,
    tenantId: string,
  ) {
    const valuation = this.valuationRepository.create({
      productId,
      warehouseId,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      date: new Date(),
      referenceType,
      referenceId,
      tenantId,
    });

    return this.valuationRepository.save(valuation);
  }

  async getAverageCost(productId: string, warehouseId: string): Promise<number> {
    const result = await this.valuationRepository
      .createQueryBuilder('v')
      .select('SUM(v.totalCost) / SUM(v.quantity)', 'avgCost')
      .where('v.productId = :productId', { productId })
      .andWhere('v.warehouseId = :warehouseId', { warehouseId })
      .andWhere('v.quantity > 0')
      .getRawOne();

    return result?.avgCost || 0;
  }
}
```

**Estimated Time**: 2 weeks  
**Dependencies**: None  
**Testing**: Unit tests for FIFO calculation

---

### Summary: Inventory Module

**Total Estimated Time**: 5 weeks

| Feature | Time | Priority |
|---------|------|----------|
| Serial/Batch Tracking | 3 weeks | 🔴 HIGH |
| FIFO Valuation | 2 weeks | 🟡 MEDIUM |

---

## 4. 👥 HR Module (HIGH)

### Current State
- ✅ Basic employee records
- ✅ Department management
- ❌ No attendance tracking
- ❌ No leave management
- ❌ No payroll

### Target State
- ✅ Attendance tracking
- ✅ Leave management
- ✅ Payroll processing
- ✅ Salary structure

---

### 4.1. Attendance & Leave (Quick Implementation)

**Estimated Time**: 3 weeks

```typescript
// Attendance entity
@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  employee: Employee;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  checkIn: string;

  @Column({ type: 'time', nullable: true })
  checkOut?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hoursWorked: number;

  @Column()
  tenantId: string;
}

// Leave entity
@Entity('leaves')
export class Leave {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  employee: Employee;

  @Column()
  leaveType: string; // 'annual', 'sick', 'unpaid'

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  days: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Column()
  tenantId: string;
}
```

---

### 4.2. Payroll (Quick Implementation)

**Estimated Time**: 3 weeks

```typescript
// Salary structure
@Entity('salary_structures')
export class SalaryStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  basicSalary: number;

  @Column({ type: 'jsonb' })
  allowances: Array<{ name: string; amount: number }>;

  @Column({ type: 'jsonb' })
  deductions: Array<{ name: string; amount: number }>;

  @Column()
  tenantId: string;
}

// Payslip
@Entity('payslips')
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  employee: Employee;

  @Column()
  month: number;

  @Column()
  year: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  netSalary: number;

  @Column({ type: 'jsonb' })
  breakdown: any;

  @Column()
  tenantId: string;
}
```

---

### Summary: HR Module

**Total Estimated Time**: 6 weeks

| Feature | Time | Priority |
|---------|------|----------|
| Attendance & Leave | 3 weeks | 🔴 HIGH |
| Payroll | 3 weeks | 🔴 HIGH |

---

## 5. 🔄 Workflow Module (HIGH)

### Current State
- ✅ Basic workflow (workflow module)
- ❌ No approval flows
- ❌ No state machine

### Target State
- ✅ Approval workflow engine
- ✅ Multi-level approvals
- ✅ State machine pattern

**Estimated Time**: 4 weeks

(Implementation details in TECHNICAL-PATTERNS-GUIDE.md section 3.2)

---

## 📊 Overall Implementation Roadmap

### Phase 1: Foundation (Months 1-3) - CRITICAL

| Module | Features | Time | Status |
|--------|----------|------|--------|
| **Accounting** | COA, Journal Entries, Reports, Bank Rec | 7 weeks | ⏳ TODO |
| **Permissions** | Record-level, Field-level | 3 weeks | ⏳ TODO |
| **Workflow** | Approval flows, State machine | 4 weeks | ⏳ TODO |

**Total**: 14 weeks (~3.5 months)

---

### Phase 2: Core Business (Months 4-6) - HIGH

| Module | Features | Time | Status |
|--------|----------|------|--------|
| **Inventory** | Serial/Batch, FIFO | 5 weeks | ⏳ TODO |
| **HR** | Attendance, Leave, Payroll | 6 weeks | ⏳ TODO |
| **Manufacturing** | BOM costing, Scheduling | 4 weeks | ⏳ TODO |

**Total**: 15 weeks (~4 months)

---

### Phase 3: Advanced (Months 7-12) - MEDIUM

| Module | Features | Time | Status |
|--------|----------|------|--------|
| **Reporting** | Report builder, Custom reports | 4 weeks | ⏳ TODO |
| **eCommerce** | Catalog, Cart, Checkout | 6 weeks | ⏳ TODO |
| **Project** | Tasks, Gantt, Time tracking | 6 weeks | ⏳ TODO |

**Total**: 16 weeks (~4 months)

---

## 🎯 Success Metrics

### After Phase 1 (Month 3)
- ✅ Full accounting module (80% of Odoo/ERPNext)
- ✅ Record-level security implemented
- ✅ Approval workflows working
- ✅ Financial reports available
- **Target**: 50% feature parity

### After Phase 2 (Month 6)
- ✅ Serial/batch tracking
- ✅ HR attendance and payroll
- ✅ Manufacturing enhancements
- **Target**: 65% feature parity

### After Phase 3 (Month 12)
- ✅ Report builder
- ✅ eCommerce module
- ✅ Project management
- **Target**: 80% feature parity

---

## 📝 Implementation Best Practices

### 1. Test-Driven Development
- Write tests first
- Aim for 80%+ coverage
- Test business logic thoroughly

### 2. Incremental Delivery
- Ship features weekly
- Get user feedback early
- Iterate based on feedback

### 3. Documentation
- Update API docs
- Create user guides
- Document business processes

### 4. Code Quality
- Follow steering files
- Code reviews mandatory
- Refactor as you go

### 5. Performance
- Optimize queries
- Add indexes
- Cache where appropriate

---

## 🚀 Quick Wins (Can Start Immediately)

### Week 1-2: Chart of Accounts
- Simple entity structure
- No complex dependencies
- High business value

### Week 3-4: Record-Level Security
- Improves security posture
- Enables multi-user scenarios
- Foundation for other features

### Week 5-6: Journal Entries
- Core accounting feature
- Enables financial reports
- High business value

---

## 📚 References

- [ODOO-ARCHITECTURE-ANALYSIS.md](./ODOO-ARCHITECTURE-ANALYSIS.md)
- [ERPNEXT-ARCHITECTURE-ANALYSIS.md](./ERPNEXT-ARCHITECTURE-ANALYSIS.md)
- [FEATURE-COMPARISON-MATRIX.md](./FEATURE-COMPARISON-MATRIX.md)
- [TECHNICAL-PATTERNS-GUIDE.md](./TECHNICAL-PATTERNS-GUIDE.md)

---

**Next Steps**:
1. Review this document with team
2. Prioritize features based on business needs
3. Create detailed specs for Phase 1 features
4. Start implementation with Chart of Accounts

---

**Created**: 2026-03-07  
**Status**: ✅ Complete  
**Next Document**: `SMARTERP-REFACTORING-ROADMAP.md`


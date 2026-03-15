import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../account/entities/account.entity';
import { AccountType } from '../account/enums/account-type.enum';
import { JournalLine } from '../account/entities/journal-line.entity';
import { JournalEntryStatus } from '../account/enums/journal-entry-status.enum';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Invoice } from '../account/entities/invoice.entity';
import { Payment } from '../payment/entities/payment.entity';
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

export interface SalesSummary {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalSales: number;
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  averageOrderValue: number;
  salesByCustomer: {
    customerId: string;
    customerName: string;
    totalSales: number;
    invoiceCount: number;
  }[];
}

export interface InventorySummary {
  products: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    cost: number;
    value: number;
    minLevel: number;
    maxLevel: number;
    status: string;
  }[];
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
}

export interface InventoryValuation {
  products: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    cost: number;
    totalValue: number;
  }[];
  totalValue: number;
}

export interface InventoryMovement {
  movements: {
    productId: string;
    sku: string;
    name: string;
    movementType: string;
    quantity: number;
    date: Date;
    reference: string;
  }[];
  totalMovements: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
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
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize secure repositories
    this.secureAccountRepo = new SecureRepository(accountRepository, permissionService, 'Account');
    this.secureJournalLineRepo = new SecureRepository(
      journalLineRepository,
      permissionService,
      'JournalLine',
    );
    this.productRepository = productRepository;
    this.customerRepository = customerRepository;
    this.invoiceRepository = invoiceRepository;
    this.paymentRepository = paymentRepository;
  }

  async getTrialBalance(_user: User, asOfDate: Date): Promise<TrialBalanceReport> {
    const accounts = await this.secureAccountRepo.find(_user, {
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
      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
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
    _user: User,
    accountId: string,
    _startDate: Date,
    _endDate: Date,
  ): Promise<GeneralLedgerReport> {
    const account = await this.secureAccountRepo.findOne(_user, {
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
      .andWhere('line.tenantId = :tenantId', { tenantId: _user.tenantId })
      .andWhere('entry.status = :status', { status: JournalEntryStatus.POSTED })
      .andWhere('entry.entryDate BETWEEN :startDate AND :endDate', {
        startDate: _startDate,
        endDate: _endDate,
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
      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      transactions.push({
        date: line.entry.date,
        reference: line.entry.number,
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
        startDate: _startDate,
        endDate: _endDate,
      },
      openingBalance,
      transactions,
      closingBalance: runningBalance,
    };
  }

  async getCashFlowStatement(_user: User, _startDate: Date, _endDate: Date): Promise<unknown> {
    // TODO: Implement cash flow statement logic
    return {
      period: { startDate: _startDate, endDate: _endDate },
      operating: { activities: [], total: 0 },
      investing: { activities: [], total: 0 },
      financing: { activities: [], total: 0 },
      netCashFlow: 0,
    };
  }

  async getSalesSummary(
    _user: User,
    _startDate: Date,
    _endDate: Date,
    customerId?: string,
  ): Promise<SalesSummary> {
    // Query invoices within date range
    const invoiceQuery = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId: _user.tenantId })
      .andWhere('invoice.invoiceDate BETWEEN :startDate AND :endDate', {
        startDate: _startDate,
        endDate: _endDate,
      })
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: ['sent', 'paid', 'overdue'],
      });

    if (customerId) {
      invoiceQuery.andWhere('invoice.customerId = :customerId', { customerId });
    }

    const invoices = await invoiceQuery.getMany();

    let totalSales = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    const salesByCustomerMap = new Map<
      string,
      { customerId: string; customerName: string; totalSales: number; invoiceCount: number }
    >();

    for (const invoice of invoices) {
      totalSales += Number(invoice.totalAmount);
      totalPaid += Number(invoice.paidAmount);
      totalOutstanding += Number(invoice.totalAmount) - Number(invoice.paidAmount);

      const customerId = invoice.customerId;
      if (customerId) {
        const existing = salesByCustomerMap.get(customerId) || {
          customerId,
          customerName: 'Customer ' + customerId.substring(0, 8),
          totalSales: 0,
          invoiceCount: 0,
        };
        existing.totalSales += Number(invoice.totalAmount);
        existing.invoiceCount += 1;
        salesByCustomerMap.set(customerId, existing);
      }
    }

    const salesByCustomer = Array.from(salesByCustomerMap.values());

    return {
      period: { startDate: _startDate, endDate: _endDate },
      totalSales,
      totalInvoices: invoices.length,
      totalPaid,
      totalOutstanding,
      averageOrderValue: invoices.length > 0 ? totalSales / invoices.length : 0,
      salesByCustomer,
    };
  }

  async getInventorySummary(
    _user: User,
    productId?: string,
    categoryId?: string,
    lowStockOnly?: boolean,
  ): Promise<InventorySummary> {
    const productQuery = this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId: _user.tenantId });

    if (productId) {
      productQuery.andWhere('product.id = :productId', { productId });
    }

    if (categoryId) {
      productQuery.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (lowStockOnly) {
      productQuery.andWhere('product.stockQuantity <= product.minStockLevel');
    }

    const products = await productQuery.getMany();

    const productSummaries = products.map((product) => ({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: product.stockQuantity,
      cost: Number(product.cost) || 0,
      value: product.stockQuantity * (Number(product.cost) || 0),
      minLevel: product.minStockLevel,
      maxLevel: product.maxStockLevel,
      status: product.status,
    }));

    const totalValue = productSummaries.reduce((sum, p) => sum + p.value, 0);
    const lowStockCount = productSummaries.filter((p) => p.quantity <= p.minLevel).length;

    return {
      products: productSummaries,
      totalProducts: products.length,
      totalValue,
      lowStockCount,
    };
  }

  async getInventoryValuation(
    _user: User,
    productId?: string,
    warehouseId?: string,
  ): Promise<InventoryValuation> {
    const productQuery = this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId: _user.tenantId });

    if (productId) {
      productQuery.andWhere('product.id = :productId', { productId });
    }

    const products = await productQuery.getMany();

    const productValuations = products.map((product) => ({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: product.stockQuantity,
      cost: Number(product.cost) || 0,
      totalValue: product.stockQuantity * (Number(product.cost) || 0),
    }));

    const totalValue = productValuations.reduce((sum, p) => sum + p.totalValue, 0);

    return {
      products: productValuations,
      totalValue,
    };
  }

  async getInventoryMovement(
    _user: User,
    _startDate: Date,
    _endDate: Date,
    productId?: string,
    warehouseId?: string,
  ): Promise<InventoryMovement> {
    // TODO: Implement inventory movement tracking
    // This would require an inventory movement/transaction entity
    return {
      movements: [],
      totalMovements: 0,
      totalQuantityIn: 0,
      totalQuantityOut: 0,
    };
  }
}

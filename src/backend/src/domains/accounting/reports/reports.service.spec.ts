import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Account } from '../account/entities/account.entity';
import { JournalLine } from '../account/entities/journal-line.entity';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Invoice } from '../account/entities/invoice.entity';
import { Payment } from '../payment/entities/payment.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { AccountType } from '../account/enums/account-type.enum';
import { JournalEntryStatus } from '../account/enums/journal-entry-status.enum';

describe('ReportsService', () => {
  let service: ReportsService;
  let journalLineRepository: jest.Mocked<Repository<JournalLine>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['accountant'],
  };

  beforeEach(async () => {
    const mockAccountRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockJournalLineRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockProductRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockCustomerRepository = {
      find: jest.fn(),
    };

    const mockInvoiceRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockPaymentRepository = {
      find: jest.fn(),
    };

    const mockPermissionService = {
      hasPermission: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: mockJournalLineRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    journalLineRepository = module.get(getRepositoryToken(JournalLine));
    productRepository = module.get(getRepositoryToken(Product));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    // Mock SecureRepository methods
    const secureAccountRepo = (service as any).secureAccountRepo;
    secureAccountRepo.find = jest.fn();
    secureAccountRepo.findOne = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTrialBalance', () => {
    it('should return trial balance with balanced totals', async () => {
      const mockAccounts = [
        {
          code: '1000',
          name: 'Cash',
          type: AccountType.ASSET,
          balance: '10000',
          isGroup: false,
          isActive: true,
        },
        {
          code: '2000',
          name: 'Accounts Payable',
          type: AccountType.LIABILITY,
          balance: '5000',
          isGroup: false,
          isActive: true,
        },
        {
          code: '3000',
          name: 'Capital',
          type: AccountType.EQUITY,
          balance: '5000',
          isGroup: false,
          isActive: true,
        },
      ];

      const secureAccountRepo = (service as any).secureAccountRepo;
      secureAccountRepo.find.mockResolvedValue(mockAccounts);

      const asOfDate = new Date('2024-12-31');
      const result = await service.getTrialBalance(mockUser, asOfDate);

      expect(result.asOfDate).toEqual(asOfDate);
      expect(result.accounts).toHaveLength(3);
      expect(result.totalDebit).toBe(10000);
      expect(result.totalCredit).toBe(10000);
      expect(result.isBalanced).toBe(true);
    });

    it('should handle asset accounts with positive balance', async () => {
      const mockAccounts = [
        {
          code: '1000',
          name: 'Cash',
          type: AccountType.ASSET,
          balance: '10000',
          isGroup: false,
          isActive: true,
        },
      ];

      const secureAccountRepo = (service as any).secureAccountRepo;
      secureAccountRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getTrialBalance(mockUser, new Date());

      expect(result.accounts[0].debit).toBe(10000);
      expect(result.accounts[0].credit).toBe(0);
    });

    it('should handle empty accounts list', async () => {
      const secureAccountRepo = (service as any).secureAccountRepo;
      secureAccountRepo.find.mockResolvedValue([]);

      const result = await service.getTrialBalance(mockUser, new Date());

      expect(result.accounts).toHaveLength(0);
      expect(result.totalDebit).toBe(0);
      expect(result.totalCredit).toBe(0);
      expect(result.isBalanced).toBe(true);
    });
  });

  describe('getGeneralLedger', () => {
    it('should return general ledger for asset account', async () => {
      const mockAccount = {
        id: 'acc-1',
        code: '1000',
        name: 'Cash',
        type: AccountType.ASSET,
      };

      const mockLines = [
        {
          accountId: 'acc-1',
          debit: '1000',
          credit: '0',
          description: 'Initial deposit',
          tenantId: 'tenant-123',
          entry: {
            number: 'JE-001',
            date: new Date('2024-01-01'),
            status: JournalEntryStatus.POSTED,
            entryDate: new Date('2024-01-01'),
          },
        },
      ];

      const secureAccountRepo = (service as any).secureAccountRepo;
      secureAccountRepo.findOne.mockResolvedValue(mockAccount);

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLines),
      };

      journalLineRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getGeneralLedger(
        mockUser,
        'acc-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result.account.code).toBe('1000');
      expect(result.transactions).toHaveLength(1);
      expect(result.closingBalance).toBe(1000);
    });

    it('should throw error when account not found', async () => {
      const secureAccountRepo = (service as any).secureAccountRepo;
      secureAccountRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getGeneralLedger(mockUser, 'non-existent', new Date(), new Date()),
      ).rejects.toThrow('Account not found');
    });
  });

  describe('getCashFlowStatement', () => {
    it('should return cash flow statement structure', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = (await service.getCashFlowStatement(mockUser, startDate, endDate)) as {
        period: { startDate: Date; endDate: Date };
        netCashFlow: number;
      };

      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.netCashFlow).toBe(0);
    });
  });

  describe('getSalesSummary', () => {
    it('should return sales summary for period', async () => {
      const mockInvoices = [
        {
          invoiceNumber: 'INV-001',
          customerId: 'cust-1',
          totalAmount: '1000',
          paidAmount: '1000',
          status: 'paid',
          tenantId: 'tenant-123',
          invoiceDate: new Date('2024-01-15'),
        },
        {
          invoiceNumber: 'INV-002',
          customerId: 'cust-2',
          totalAmount: '2000',
          paidAmount: '500',
          status: 'sent',
          tenantId: 'tenant-123',
          invoiceDate: new Date('2024-01-20'),
        },
      ];

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockInvoices),
      };

      invoiceRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSalesSummary(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result.totalSales).toBe(3000);
      expect(result.totalInvoices).toBe(2);
      expect(result.totalPaid).toBe(1500);
      expect(result.totalOutstanding).toBe(1500);
    });

    it('should handle empty invoices', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      invoiceRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSalesSummary(mockUser, new Date(), new Date());

      expect(result.totalSales).toBe(0);
      expect(result.totalInvoices).toBe(0);
      expect(result.averageOrderValue).toBe(0);
    });
  });

  describe('getInventorySummary', () => {
    it('should return inventory summary', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          sku: 'SKU-001',
          name: 'Product 1',
          stockQuantity: 100,
          cost: '10',
          minStockLevel: 20,
          maxStockLevel: 200,
          status: 'active',
          tenantId: 'tenant-123',
        },
      ];

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getInventorySummary(mockUser);

      expect(result.totalProducts).toBe(1);
      expect(result.totalValue).toBe(1000);
    });

    it('should handle empty products', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getInventorySummary(mockUser);

      expect(result.totalProducts).toBe(0);
      expect(result.totalValue).toBe(0);
    });
  });

  describe('getInventoryValuation', () => {
    it('should return inventory valuation', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          sku: 'SKU-001',
          name: 'Product 1',
          stockQuantity: 100,
          cost: '10',
          tenantId: 'tenant-123',
        },
      ];

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getInventoryValuation(mockUser);

      expect(result.totalValue).toBe(1000);
      expect(result.products).toHaveLength(1);
    });
  });

  describe('getInventoryMovement', () => {
    it('should return inventory movement structure', async () => {
      const result = await service.getInventoryMovement(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result.movements).toEqual([]);
      expect(result.totalMovements).toBe(0);
    });
  });
});

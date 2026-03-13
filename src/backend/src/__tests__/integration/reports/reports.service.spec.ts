import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '@/domains/accounting/reports/reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from '@/domains/accounting/account/entities/account.entity';
import { AccountType } from '@/domains/accounting/account/enums/account-type.enum';
import { JournalLine } from '@/domains/accounting/journal/entities/journal-line.entity';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Invoice } from '@/domains/accounting/invoice/entities/invoice.entity';
import { Payment } from '@/domains/accounting/payment/entities/payment.entity';
import { PermissionService } from '@/common/security/permission.service';
import { Repository } from 'typeorm';

describe('ReportsService', () => {
  let service: ReportsService;
  let accountRepository: Repository<Account>;
  let journalLineRepository: Repository<JournalLine>;
  let productRepository: Repository<Product>;
  let customerRepository: Repository<Customer>;
  let invoiceRepository: Repository<Invoice>;
  let paymentRepository: Repository<Payment>;

  const mockUser = {
    id: 'test-user-id',
    tenantId: 'test-tenant-id',
    role: 'admin',
  };

  const mockAccountRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJournalLineRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockProductRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockCustomerRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockInvoiceRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockPaymentRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockPermissionService = {
    canAccess: jest.fn(),
  };

  beforeEach(async () => {
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
    accountRepository = module.get(getRepositoryToken(Account));
    journalLineRepository = module.get(getRepositoryToken(JournalLine));
    productRepository = module.get(getRepositoryToken(Product));
    customerRepository = module.get(getRepositoryToken(Customer));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    paymentRepository = module.get(getRepositoryToken(Payment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTrialBalance', () => {
    it('should calculate trial balance correctly', async () => {
      const mockAccounts = [
        { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET, balance: 1000, isGroup: false, isActive: true },
        { id: '2', code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, balance: 500, isGroup: false, isActive: true },
        { id: '3', code: '3000', name: 'Sales', type: AccountType.INCOME, balance: 2000, isGroup: false, isActive: true },
      ];

      mockAccountRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.getTrialBalance(mockUser, new Date());

      expect(result.totalDebit).toBe(1500);
      expect(result.totalCredit).toBe(2500);
      expect(result.isBalanced).toBe(false);
    });
  });

  describe('getSalesSummary', () => {
    it('should calculate sales summary correctly', async () => {
      const mockInvoices = [
        {
          id: '1',
          invoiceNumber: 'INV001',
          customerId: 'cust1',
          customer: { name: 'Customer A' },
          totalAmount: 1000,
          paidAmount: 500,
          invoiceDate: new Date('2026-03-01'),
          status: 'sent',
        },
        {
          id: '2',
          invoiceNumber: 'INV002',
          customerId: 'cust1',
          customer: { name: 'Customer A' },
          totalAmount: 2000,
          paidAmount: 1000,
          invoiceDate: new Date('2026-03-15'),
          status: 'paid',
        },
      ];

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockInvoices),
      };

      invoiceRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.getSalesSummary(
        mockUser,
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );

      expect(result.totalSales).toBe(3000);
      expect(result.totalPaid).toBe(1500);
      expect(result.totalOutstanding).toBe(1500);
      expect(result.totalInvoices).toBe(2);
    });
  });

  describe('getInventorySummary', () => {
    it('should return inventory summary correctly', async () => {
      const mockProducts = [
        {
          id: '1',
          sku: 'PROD001',
          name: 'Product A',
          stockQuantity: 100,
          cost: 10,
          minStockLevel: 20,
          maxStockLevel: 200,
          status: 'active',
        },
        {
          id: '2',
          sku: 'PROD002',
          name: 'Product B',
          stockQuantity: 15,
          cost: 20,
          minStockLevel: 25,
          maxStockLevel: 150,
          status: 'active',
        },
      ];

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.getInventorySummary(mockUser);

      expect(result.totalProducts).toBe(2);
      expect(result.totalValue).toBe(1400); // 100*10 + 15*20
      expect(result.lowStockCount).toBe(1);
    });
  });

  describe('getInventoryValuation', () => {
    it('should calculate inventory valuation correctly', async () => {
      const mockProducts = [
        {
          id: '1',
          sku: 'PROD001',
          name: 'Product A',
          stockQuantity: 100,
          cost: 10,
        },
        {
          id: '2',
          sku: 'PROD002',
          name: 'Product B',
          stockQuantity: 50,
          cost: 20,
        },
      ];

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.getInventoryValuation(mockUser);

      expect(result.totalValue).toBe(2000); // 100*10 + 50*20
      expect(result.products.length).toBe(2);
    });
  });
});

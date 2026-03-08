import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingService } from './accounting.service';
import { Account, AccountType } from './entities/account.entity';
import { Invoice, InvoiceType } from './entities/invoice.entity';
import { JournalEntry } from './entities/journal-entry.entity';

describe('AccountingService', () => {
  let service: AccountingService;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockAccountRepository = {
    remove: jest.fn().mockResolvedValue(undefined),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJournalEntryRepository = {
    remove: jest.fn().mockResolvedValue(undefined),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockInvoiceRepository = {
    remove: jest.fn().mockResolvedValue(undefined),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    del: jest.fn(),
  };

  const mockPermissionService = {
    canRead: jest.fn().mockResolvedValue(true),
    canWrite: jest.fn().mockResolvedValue(true),
    canDelete: jest.fn().mockResolvedValue(true),
    buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: mockJournalEntryRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    accountRepository = module.get(getRepositoryToken(Account));
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllAccounts', () => {
    it('should return all accounts for tenant', async () => {
      const accounts = [
        { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET, balance: 10000 },
        {
          id: '2',
          code: '2000',
          name: 'Accounts Payable',
          type: AccountType.LIABILITY,
          balance: 5000,
        },
      ];
      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.findAllAccounts(mockUser);

      expect(result).toEqual(accounts);
      expect(mockAccountRepository.find).toHaveBeenCalled();
    });

    it('should filter accounts by type', async () => {
      const type = AccountType.ASSET;
      const accounts = [
        { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET, balance: 10000 },
      ];
      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.findAllAccounts(mockUser, type);

      expect(result).toEqual(accounts);
      expect(mockAccountRepository.find).toHaveBeenCalled();
    });
  });

  describe('findAccountById', () => {
    it('should return cached account if exists', async () => {
      const id = 'account-123';
      const account = { id, code: '1000', name: 'Cash', type: AccountType.ASSET };
      mockCacheService.getOrSet.mockResolvedValue(account as Account);

      const result = await service.findAccountById(mockUser, id);

      expect(result).toEqual(account);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('createAccount', () => {
    it('should create new account', async () => {
      const data = { code: '1000', name: 'Cash', type: AccountType.ASSET };
      const account = { id: 'account-123', ...data, tenantId: mockUser.tenantId };
      mockAccountRepository.save.mockResolvedValue(account as Account);

      const result = await service.createAccount(mockUser, data);

      expect(result).toEqual(account);
      expect(mockAccountRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateAccount', () => {
    it('should update account and invalidate cache', async () => {
      const id = 'account-123';
      const data = { name: 'Updated Cash' };
      const existingAccount = { id, name: 'Cash', tenantId: mockUser.tenantId };
      const updatedAccount = { ...existingAccount, ...data };

      mockCacheService.getOrSet.mockResolvedValue(existingAccount as Account);
      mockAccountRepository.save.mockResolvedValue(updatedAccount as Account);

      const result = await service.updateAccount(mockUser, id, data);

      expect(mockAccountRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('should soft delete account and invalidate cache', async () => {
      const id = 'account-123';
      const account = { id, tenantId: mockUser.tenantId };

      mockCacheService.getOrSet.mockResolvedValue(account as Account);
      mockAccountRepository.remove.mockResolvedValue(undefined);

      await service.deleteAccount(mockUser, id);

      expect(mockAccountRepository.remove).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('findAllJournalEntries', () => {
    it('should return all journal entries for tenant', async () => {
      const entries = [{ id: '1', entryDate: new Date(), description: 'Entry 1' } as unknown];
      mockJournalEntryRepository.find.mockResolvedValue(entries as JournalEntry[]);

      const result = await service.findAllJournalEntries(mockUser);

      expect(result).toEqual(entries);
      expect(mockJournalEntryRepository.find).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockJournalEntryRepository.find.mockResolvedValue([]);

      await service.findAllJournalEntries(mockUser, startDate, endDate);

      expect(mockJournalEntryRepository.find).toHaveBeenCalled();
    });
  });

  describe('createJournalEntry', () => {
    it('should create new journal entry', async () => {
      const data = { entryDate: new Date(), description: 'Test Entry' };
      const entry = { id: 'entry-123', ...data, tenantId: mockUser.tenantId } as unknown;
      mockJournalEntryRepository.save.mockResolvedValue(entry as JournalEntry);

      const result = await service.createJournalEntry(mockUser, data);

      expect(result).toEqual(entry);
    });
  });

  describe('postJournalEntry', () => {
    it('should post journal entry and invalidate cache', async () => {
      const id = 'entry-123';
      const existingEntry = { id, status: 'draft', tenantId: mockUser.tenantId };
      const postedEntry = { id, status: 'posted', tenantId: mockUser.tenantId };

      mockJournalEntryRepository.findOne.mockResolvedValue(existingEntry as JournalEntry);
      mockJournalEntryRepository.save.mockResolvedValue(postedEntry as JournalEntry);

      const result = await service.postJournalEntry(mockUser, id);

      expect(mockJournalEntryRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('findAllInvoices', () => {
    it('should return all invoices for tenant', async () => {
      const invoices = [{ id: '1', invoiceNumber: 'INV-001', type: InvoiceType.SALES }];
      mockInvoiceRepository.find.mockResolvedValue(invoices as Invoice[]);

      const result = await service.findAllInvoices(mockUser);

      expect(result).toEqual(invoices);
    });

    it('should filter invoices by type', async () => {
      const type = InvoiceType.SALES;
      mockInvoiceRepository.find.mockResolvedValue([]);

      await service.findAllInvoices(mockUser, type);

      expect(mockInvoiceRepository.find).toHaveBeenCalled();
    });
  });

  describe('createInvoice', () => {
    it('should create new invoice', async () => {
      const data = { invoiceNumber: 'INV-001', type: InvoiceType.SALES };
      const invoice = { id: 'invoice-123', ...data, tenantId: mockUser.tenantId };
      mockInvoiceRepository.save.mockResolvedValue(invoice as Invoice);

      const result = await service.createInvoice(mockUser, data);

      expect(result).toEqual(invoice);
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice and invalidate cache', async () => {
      const id = 'invoice-123';
      const data = { status: 'paid' };
      const existingInvoice = { id, status: 'pending', tenantId: mockUser.tenantId };
      const updatedInvoice = { ...existingInvoice, ...data };

      mockCacheService.getOrSet.mockResolvedValue(existingInvoice as Invoice);
      mockInvoiceRepository.save.mockResolvedValue(updatedInvoice as Invoice);

      await service.updateInvoice(mockUser, id, data);

      expect(mockInvoiceRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteInvoice', () => {
    it('should soft delete invoice and invalidate cache', async () => {
      const id = 'invoice-123';
      const invoice = { id, tenantId: mockUser.tenantId };

      mockCacheService.getOrSet.mockResolvedValue(invoice as Invoice);
      mockInvoiceRepository.remove.mockResolvedValue(undefined);

      await service.deleteInvoice(mockUser, id);

      expect(mockInvoiceRepository.remove).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('getBalanceSheet', () => {
    it('should generate balance sheet', async () => {
      const asOfDate = new Date();
      const accounts = [
        { id: '1', type: AccountType.ASSET, balance: 10000 },
        { id: '2', type: AccountType.LIABILITY, balance: 5000 },
        { id: '3', type: AccountType.EQUITY, balance: 5000 },
      ];
      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.getBalanceSheet(mockUser, asOfDate);

      expect(result.assets.total).toBe(10000);
      expect(result.liabilities.total).toBe(5000);
      expect(result.equity.total).toBe(5000);
    });
  });

  describe('getProfitAndLoss', () => {
    it('should generate profit and loss statement', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const accounts = [
        { id: '1', type: AccountType.INCOME, balance: 50000 },
        { id: '2', type: AccountType.EXPENSE, balance: 30000 },
      ];
      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.getProfitAndLoss(mockUser, startDate, endDate);

      expect(result.revenue.total).toBe(50000);
      expect(result.expenses.total).toBe(30000);
      expect(result.netIncome).toBe(20000);
    });
  });
});

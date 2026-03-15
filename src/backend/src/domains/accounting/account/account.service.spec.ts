import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { Invoice } from './entities/invoice.entity';
import { AccountType } from './enums/account-type.enum';
import { InvoiceType } from './enums/invoice-type.enum';
import { CacheService } from '@common/cache/cache.service';
import { PermissionService, User } from '@common/security/permission.service';

describe('AccountService', () => {
  let service: AccountService;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['user'],
  };

  const mockAccount: Account = {
    id: 'account-1',
    code: '1000',
    name: 'Cash',
    type: AccountType.ASSET,
    balance: 1000,
    isActive: true,
    isGroup: false,
    tenantId: 'tenant-1',
  } as Account;

  const mockJournalEntry: JournalEntry = {
    id: 'journal-1',
    number: 'JE-2024-0001',
    date: new Date('2024-01-01'),
    status: 'draft',
    tenantId: 'tenant-1',
    lines: [],
  } as JournalEntry;

  const mockInvoice: Invoice = {
    id: 'invoice-1',
    type: InvoiceType.SALES,
    tenantId: 'tenant-1',
  } as Invoice;

  beforeEach(async () => {
    const mockAccountRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };

    const mockJournalRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    const mockInvoiceRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockCache = {
      getOrSet: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const mockPermission = {
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, where) => where),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepo,
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: mockJournalRepo,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: PermissionService,
          useValue: mockPermission,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    accountRepository = module.get(getRepositoryToken(Account));
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllAccounts', () => {
    it('should find all accounts', async () => {
      accountRepository.find.mockResolvedValue([mockAccount]);

      const result = await service.findAllAccounts(mockUser);

      expect(result).toEqual([mockAccount]);
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { code: 'ASC' },
      });
    });

    it('should filter by type', async () => {
      accountRepository.find.mockResolvedValue([mockAccount]);

      await service.findAllAccounts(mockUser, AccountType.ASSET);

      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { type: AccountType.ASSET, tenantId: 'tenant-1' },
        order: { code: 'ASC' },
      });
    });

    it('should return empty array when no accounts', async () => {
      accountRepository.find.mockResolvedValue([]);

      const result = await service.findAllAccounts(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findAccountById', () => {
    it('should find account by id with cache', async () => {
      cacheService.getOrSet.mockResolvedValue(mockAccount);

      const result = await service.findAccountById(mockUser, 'account-1');

      expect(result).toEqual(mockAccount);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when account not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        accountRepository.findOne.mockResolvedValue(null);
        return fn();
      });

      await expect(service.findAccountById(mockUser, 'account-999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findAccountById(mockUser, 'account-999')).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      accountRepository.save.mockResolvedValue(mockAccount);

      const data = { code: '1000', name: 'Cash', type: AccountType.ASSET };
      const result = await service.createAccount(mockUser, data);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateAccount', () => {
    it('should update account successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockAccount);
      accountRepository.save.mockResolvedValue({ ...mockAccount, name: 'Updated' });
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.updateAccount(mockUser, 'account-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockAccount);
      accountRepository.remove.mockResolvedValue(mockAccount);
      cacheService.del.mockResolvedValue(undefined);

      await service.deleteAccount(mockUser, 'account-1');

      expect(accountRepository.remove).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('createDefaultCOA', () => {
    it('should create default chart of accounts', async () => {
      accountRepository.save.mockResolvedValue(mockAccount);

      await service.createDefaultCOA(mockUser);

      expect(accountRepository.save).toHaveBeenCalled();
    });
  });

  describe('getAccountHierarchy', () => {
    it('should build account hierarchy', async () => {
      const parentAccount = { ...mockAccount, id: 'parent-1', parentId: null };
      const childAccount = { ...mockAccount, id: 'child-1', parentId: 'parent-1' };
      accountRepository.find.mockResolvedValue([parentAccount, childAccount]);

      const result = await service.getAccountHierarchy(mockUser);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty accounts', async () => {
      accountRepository.find.mockResolvedValue([]);

      const result = await service.getAccountHierarchy(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('validateAccountCode', () => {
    it('should return true when code is available', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      const result = await service.validateAccountCode(mockUser, '1000');

      expect(result).toBe(true);
    });

    it('should return false when code exists', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.validateAccountCode(mockUser, '1000');

      expect(result).toBe(false);
    });
  });

  describe('getAccountsByType', () => {
    it('should get accounts by type', async () => {
      accountRepository.find.mockResolvedValue([mockAccount]);

      const result = await service.getAccountsByType(mockUser, AccountType.ASSET);

      expect(result).toEqual([mockAccount]);
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { type: AccountType.ASSET, isActive: true, tenantId: 'tenant-1' },
        order: { code: 'ASC' },
      });
    });
  });

  describe('getLeafAccounts', () => {
    it('should get leaf accounts only', async () => {
      accountRepository.find.mockResolvedValue([mockAccount]);

      const result = await service.getLeafAccounts(mockUser);

      expect(result).toEqual([mockAccount]);
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { isGroup: false, isActive: true, tenantId: 'tenant-1' },
        order: { code: 'ASC' },
      });
    });
  });

  describe('findAllJournalEntries', () => {
    it('should find all journal entries', async () => {
      journalEntryRepository.find.mockResolvedValue([mockJournalEntry]);

      const result = await service.findAllJournalEntries(mockUser);

      expect(result).toEqual([mockJournalEntry]);
    });

    it('should filter by date range', async () => {
      journalEntryRepository.find.mockResolvedValue([mockJournalEntry]);
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.findAllJournalEntries(mockUser, startDate, endDate);

      expect(journalEntryRepository.find).toHaveBeenCalledWith({
        where: { entryDate: Between(startDate, endDate), tenantId: 'tenant-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findJournalEntryById', () => {
    it('should find journal entry by id with cache', async () => {
      cacheService.getOrSet.mockResolvedValue(mockJournalEntry);

      const result = await service.findJournalEntryById(mockUser, 'journal-1');

      expect(result).toEqual(mockJournalEntry);
    });

    it('should throw NotFoundException when not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        journalEntryRepository.findOne.mockResolvedValue(null);
        return fn();
      });

      await expect(service.findJournalEntryById(mockUser, 'journal-999')).rejects.toThrow(
        'Journal entry not found',
      );
    });
  });

  describe('createJournalEntry', () => {
    it('should create journal entry successfully', async () => {
      journalEntryRepository.count.mockResolvedValue(0);
      journalEntryRepository.create.mockReturnValue(mockJournalEntry as any);
      journalEntryRepository.save.mockResolvedValue(mockJournalEntry);

      const dto = {
        date: new Date('2024-01-01'),
        reference: 'REF-001',
        memo: 'Test entry',
        lines: [
          { accountId: 'account-1', debit: 100, credit: 0 },
          { accountId: 'account-2', debit: 0, credit: 100 },
        ],
      };

      const result = await service.createJournalEntry(mockUser, dto);

      expect(result).toBeDefined();
      expect(journalEntryRepository.save).toHaveBeenCalled();
    });
  });

  describe('postJournalEntry', () => {
    it('should post journal entry successfully', async () => {
      const entryWithLines = {
        ...mockJournalEntry,
        status: 'draft',
        lines: [
          { accountId: 'account-1', debit: 100, credit: 0, account: mockAccount },
          { accountId: 'account-2', debit: 0, credit: 100, account: mockAccount },
        ],
      };
      journalEntryRepository.findOne.mockResolvedValue(entryWithLines as any);
      journalEntryRepository.save.mockResolvedValue(entryWithLines as any);
      accountRepository.findOne.mockResolvedValue(mockAccount);
      accountRepository.save.mockResolvedValue(mockAccount);
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.postJournalEntry(mockUser, 'journal-1');

      expect(result.status).toBe('posted');
      expect(result.postedBy).toBe('user-1');
    });

    it('should throw BadRequestException when not draft', async () => {
      journalEntryRepository.findOne.mockResolvedValue({
        ...mockJournalEntry,
        status: 'posted',
      } as any);

      await expect(service.postJournalEntry(mockUser, 'journal-1')).rejects.toThrow(
        'Only draft entries can be posted',
      );
    });

    it('should throw NotFoundException when entry not found', async () => {
      journalEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.postJournalEntry(mockUser, 'journal-999')).rejects.toThrow(
        'Journal entry not found',
      );
    });
  });

  describe('generateJournalNumber', () => {
    it('should generate journal number', async () => {
      journalEntryRepository.count.mockResolvedValue(5);

      const result = await service.generateJournalNumber('tenant-1');

      expect(result).toMatch(/^JE-\d{4}-\d{4}$/);
      expect(result).toContain('0006');
    });

    it('should handle zero count', async () => {
      journalEntryRepository.count.mockResolvedValue(0);

      const result = await service.generateJournalNumber('tenant-1');

      expect(result).toContain('0001');
    });
  });

  describe('findAllInvoices', () => {
    it('should find all invoices', async () => {
      invoiceRepository.find.mockResolvedValue([mockInvoice]);

      const result = await service.findAllInvoices(mockUser);

      expect(result).toEqual([mockInvoice]);
    });

    it('should filter by type', async () => {
      invoiceRepository.find.mockResolvedValue([mockInvoice]);

      await service.findAllInvoices(mockUser, InvoiceType.SALES);

      expect(invoiceRepository.find).toHaveBeenCalledWith({
        where: { type: InvoiceType.SALES, tenantId: 'tenant-1' },
        order: { invoiceDate: 'DESC' },
      });
    });
  });

  describe('findInvoiceById', () => {
    it('should find invoice by id with cache', async () => {
      cacheService.getOrSet.mockResolvedValue(mockInvoice);

      const result = await service.findInvoiceById(mockUser, 'invoice-1');

      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundException when not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        invoiceRepository.findOne.mockResolvedValue(null);
        return fn();
      });

      await expect(service.findInvoiceById(mockUser, 'invoice-999')).rejects.toThrow(
        'Invoice not found',
      );
    });
  });

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      invoiceRepository.save.mockResolvedValue(mockInvoice);

      const data = { type: InvoiceType.SALES };
      const result = await service.createInvoice(mockUser, data);

      expect(result).toEqual(mockInvoice);
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockInvoice);
      invoiceRepository.save.mockResolvedValue(mockInvoice);
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.updateInvoice(mockUser, 'invoice-1', {});

      expect(result).toBeDefined();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockInvoice);
      invoiceRepository.remove.mockResolvedValue(mockInvoice);
      cacheService.del.mockResolvedValue(undefined);

      await service.deleteInvoice(mockUser, 'invoice-1');

      expect(invoiceRepository.remove).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('getBalanceSheet', () => {
    it('should generate balance sheet', async () => {
      const assets = [{ ...mockAccount, type: AccountType.ASSET, balance: 1000 }];
      const liabilities = [{ ...mockAccount, type: AccountType.LIABILITY, balance: 500 }];
      const equity = [{ ...mockAccount, type: AccountType.EQUITY, balance: 500 }];
      accountRepository.find.mockResolvedValue([...assets, ...liabilities, ...equity]);

      const result = await service.getBalanceSheet(mockUser, new Date());

      expect(result.assets.total).toBe(1000);
      expect(result.liabilities.total).toBe(500);
      expect(result.equity.total).toBe(500);
    });

    it('should handle empty accounts', async () => {
      accountRepository.find.mockResolvedValue([]);

      const result = await service.getBalanceSheet(mockUser, new Date());

      expect(result.assets.total).toBe(0);
      expect(result.liabilities.total).toBe(0);
      expect(result.equity.total).toBe(0);
    });
  });

  describe('getProfitAndLoss', () => {
    it('should generate profit and loss statement', async () => {
      const revenue = [{ ...mockAccount, type: AccountType.INCOME, balance: 5000 }];
      const expenses = [{ ...mockAccount, type: AccountType.EXPENSE, balance: 3000 }];
      accountRepository.find.mockResolvedValue([...revenue, ...expenses]);

      const result = await service.getProfitAndLoss(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result.revenue.total).toBe(5000);
      expect(result.expenses.total).toBe(3000);
      expect(result.netIncome).toBe(2000);
    });

    it('should handle negative net income', async () => {
      const revenue = [{ ...mockAccount, type: AccountType.INCOME, balance: 1000 }];
      const expenses = [{ ...mockAccount, type: AccountType.EXPENSE, balance: 2000 }];
      accountRepository.find.mockResolvedValue([...revenue, ...expenses]);

      const result = await service.getProfitAndLoss(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result.netIncome).toBe(-1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user', async () => {
      await expect(service.findAllAccounts(null as any)).rejects.toThrow();
    });

    it('should handle undefined tenantId', async () => {
      const userWithoutTenant = { ...mockUser, tenantId: undefined as any };

      await expect(service.findAllAccounts(userWithoutTenant)).rejects.toThrow();
    });

    it('should handle very large balance', async () => {
      const largeAccount = { ...mockAccount, balance: 999999999 };
      cacheService.getOrSet.mockResolvedValue(largeAccount);

      const result = await service.findAccountById(mockUser, 'account-1');

      expect(result.balance).toBe(999999999);
    });

    it('should handle negative balance', async () => {
      const negativeAccount = { ...mockAccount, balance: -1000 };
      cacheService.getOrSet.mockResolvedValue(negativeAccount);

      const result = await service.findAccountById(mockUser, 'account-1');

      expect(result.balance).toBe(-1000);
    });
  });
});

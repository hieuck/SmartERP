import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingService } from './accounting.service';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { Invoice, InvoiceType } from './entities/invoice.entity';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('AccountingService', () => {
  let service: AccountingService;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockAccountRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockJournalEntryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockInvoiceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    del: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    accountRepository = module.get(getRepositoryToken(Account));
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllAccounts', () => {
    it('should return all accounts for tenant', async () => {
      const tenantId = 'tenant-123';
      const accounts = [
        { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET, balance: 10000 },
        { id: '2', code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, balance: 5000 },
      ];
      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.findAllAccounts(tenantId);

      expect(result).toEqual(accounts);
      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { tenantId },
        order: { code: 'ASC' },
      });
    });

    it('should filter accounts by type', async () => {
      const tenantId = 'tenant-123';
      const type = AccountType.ASSET;
      const accounts = [
        { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET, balance: 10000 },
      ];
      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.findAllAccounts(tenantId, type);

      expect(result).toEqual(accounts);
      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { tenantId, type },
        order: { code: 'ASC' },
      });
    });
  });

  describe('findAccountById', () => {
    it('should return cached account if exists', async () => {
      const id = 'account-123';
      const tenantId = 'tenant-123';
      const account = { id, code: '1000', name: 'Cash', type: AccountType.ASSET };
      mockCacheService.getOrSet.mockResolvedValue(account as Account);

      const result = await service.findAccountById(id, tenantId);

      expect(result).toEqual(account);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('createAccount', () => {
    it('should create new account', async () => {
      const tenantId = 'tenant-123';
      const data = { code: '1000', name: 'Cash', type: AccountType.ASSET };
      const account = { id: 'account-123', ...data, tenantId };
      mockAccountRepository.create.mockReturnValue(account as Account);
      mockAccountRepository.save.mockResolvedValue(account as Account);

      const result = await service.createAccount(data, tenantId);

      expect(result).toEqual(account);
      expect(mockAccountRepository.create).toHaveBeenCalledWith({ ...data, tenantId });
      expect(mockAccountRepository.save).toHaveBeenCalledWith(account);
    });
  });

  describe('updateAccount', () => {
    it('should update account and invalidate cache', async () => {
      const id = 'account-123';
      const tenantId = 'tenant-123';
      const data = { name: 'Updated Cash' };
      const updatedAccount = { id, name: 'Updated Cash' };
      mockAccountRepository.update.mockResolvedValue(undefined);
      mockCacheService.getOrSet.mockResolvedValue(updatedAccount as Account);

      const result = await service.updateAccount(id, data, tenantId);

      expect(mockAccountRepository.update).toHaveBeenCalledWith({ id, tenantId }, data);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('should soft delete account and invalidate cache', async () => {
      const id = 'account-123';
      const tenantId = 'tenant-123';
      mockAccountRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteAccount(id, tenantId);

      expect(mockAccountRepository.softDelete).toHaveBeenCalledWith({ id, tenantId });
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('findAllJournalEntries', () => {
    it('should return all journal entries for tenant', async () => {
      const tenantId = 'tenant-123';
      const entries = [
        { id: '1', entryDate: new Date(), description: 'Entry 1' },
      ];
      mockJournalEntryRepository.find.mockResolvedValue(entries as JournalEntry[]);

      const result = await service.findAllJournalEntries(tenantId);

      expect(result).toEqual(entries);
      expect(mockJournalEntryRepository.find).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const tenantId = 'tenant-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockJournalEntryRepository.find.mockResolvedValue([]);

      await service.findAllJournalEntries(tenantId, startDate, endDate);

      expect(mockJournalEntryRepository.find).toHaveBeenCalled();
    });
  });

  describe('createJournalEntry', () => {
    it('should create new journal entry', async () => {
      const tenantId = 'tenant-123';
      const data = { entryDate: new Date(), description: 'Test Entry' };
      const entry = { id: 'entry-123', ...data, tenantId };
      mockJournalEntryRepository.create.mockReturnValue(entry as JournalEntry);
      mockJournalEntryRepository.save.mockResolvedValue(entry as JournalEntry);

      const result = await service.createJournalEntry(data, tenantId);

      expect(result).toEqual(entry);
    });
  });

  describe('postJournalEntry', () => {
    it('should post journal entry and invalidate cache', async () => {
      const id = 'entry-123';
      const tenantId = 'tenant-123';
      const postedEntry = { id, status: 'posted' };
      mockJournalEntryRepository.update.mockResolvedValue(undefined);
      mockCacheService.getOrSet.mockResolvedValue(postedEntry as JournalEntry);

      const result = await service.postJournalEntry(id, tenantId);

      expect(mockJournalEntryRepository.update).toHaveBeenCalledWith(
        { id, tenantId },
        { status: 'posted' },
      );
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('findAllInvoices', () => {
    it('should return all invoices for tenant', async () => {
      const tenantId = 'tenant-123';
      const invoices = [
        { id: '1', invoiceNumber: 'INV-001', type: InvoiceType.SALES },
      ];
      mockInvoiceRepository.find.mockResolvedValue(invoices as Invoice[]);

      const result = await service.findAllInvoices(tenantId);

      expect(result).toEqual(invoices);
    });

    it('should filter invoices by type', async () => {
      const tenantId = 'tenant-123';
      const type = InvoiceType.SALES;
      mockInvoiceRepository.find.mockResolvedValue([]);

      await service.findAllInvoices(tenantId, type);

      expect(mockInvoiceRepository.find).toHaveBeenCalledWith({
        where: { tenantId, type },
        order: { invoiceDate: 'DESC' },
      });
    });
  });

  describe('createInvoice', () => {
    it('should create new invoice', async () => {
      const tenantId = 'tenant-123';
      const data = { invoiceNumber: 'INV-001', type: InvoiceType.SALES };
      const invoice = { id: 'invoice-123', ...data, tenantId };
      mockInvoiceRepository.create.mockReturnValue(invoice as Invoice);
      mockInvoiceRepository.save.mockResolvedValue(invoice as Invoice);

      const result = await service.createInvoice(data, tenantId);

      expect(result).toEqual(invoice);
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice and invalidate cache', async () => {
      const id = 'invoice-123';
      const tenantId = 'tenant-123';
      const data = { status: 'paid' };
      mockInvoiceRepository.update.mockResolvedValue(undefined);
      mockCacheService.getOrSet.mockResolvedValue({ id } as Invoice);

      await service.updateInvoice(id, data, tenantId);

      expect(mockInvoiceRepository.update).toHaveBeenCalledWith({ id, tenantId }, data);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteInvoice', () => {
    it('should soft delete invoice and invalidate cache', async () => {
      const id = 'invoice-123';
      const tenantId = 'tenant-123';
      mockInvoiceRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteInvoice(id, tenantId);

      expect(mockInvoiceRepository.softDelete).toHaveBeenCalledWith({ id, tenantId });
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('getBalanceSheet', () => {
    it('should generate balance sheet', async () => {
      const tenantId = 'tenant-123';
      const asOfDate = new Date();
      const accounts = [
        { id: '1', type: AccountType.ASSET, balance: 10000 },
        { id: '2', type: AccountType.LIABILITY, balance: 5000 },
        { id: '3', type: AccountType.EQUITY, balance: 5000 },
      ];
      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.getBalanceSheet(tenantId, asOfDate);

      expect(result.assets.total).toBe(10000);
      expect(result.liabilities.total).toBe(5000);
      expect(result.equity.total).toBe(5000);
    });
  });

  describe('getProfitAndLoss', () => {
    it('should generate profit and loss statement', async () => {
      const tenantId = 'tenant-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const accounts = [
        { id: '1', type: AccountType.REVENUE, balance: 50000 },
        { id: '2', type: AccountType.EXPENSE, balance: 30000 },
      ];
      mockAccountRepository.find.mockResolvedValue(accounts as Account[]);

      const result = await service.getProfitAndLoss(tenantId, startDate, endDate);

      expect(result.revenue.total).toBe(50000);
      expect(result.expenses.total).toBe(30000);
      expect(result.netIncome).toBe(20000);
    });
  });
});

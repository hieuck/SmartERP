import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { Invoice } from './entities/invoice.entity';
import { CacheService } from '@/common/cache/cache.service';

describe('AccountingService', () => {
  let service: AccountingService;

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
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Chart of Accounts', () => {
    it('should find all accounts', async () => {
      const mockAccounts = [{ id: '1', code: '1000', type: AccountType.ASSET }];
      mockAccountRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.findAllAccounts('tenant-1');

      expect(result).toEqual(mockAccounts);
    });

    it('should find accounts by type', async () => {
      mockAccountRepository.find.mockResolvedValue([]);

      await service.findAllAccounts('tenant-1', AccountType.ASSET);

      expect(mockAccountRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', type: AccountType.ASSET },
        order: { code: 'ASC' },
      });
    });

    it('should create account', async () => {
      const accountData = { code: '1000', name: 'Cash', type: AccountType.ASSET };
      mockAccountRepository.create.mockReturnValue(accountData);
      mockAccountRepository.save.mockResolvedValue(accountData);

      const result = await service.createAccount(accountData, 'tenant-1');

      expect(result).toEqual(accountData);
    });
  });

  describe('Journal Entries', () => {
    it('should find all journal entries', async () => {
      const mockEntries = [{ id: '1', description: 'Entry 1' }];
      mockJournalEntryRepository.find.mockResolvedValue(mockEntries);

      const result = await service.findAllJournalEntries('tenant-1');

      expect(result).toEqual(mockEntries);
    });

    it('should post journal entry', async () => {
      const mockEntry = { id: '1', status: 'draft' };
      const postedEntry = { ...mockEntry, status: 'posted' };

      mockCacheService.getOrSet.mockResolvedValue(postedEntry);
      mockJournalEntryRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.postJournalEntry('1', 'tenant-1');

      expect(mockJournalEntryRepository.update).toHaveBeenCalledWith(
        { id: '1', tenantId: 'tenant-1' },
        { status: 'posted' },
      );
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('Financial Reports', () => {
    it('should generate balance sheet', async () => {
      const mockAccounts = [
        { id: '1', type: AccountType.ASSET, balance: 10000 },
        { id: '2', type: AccountType.LIABILITY, balance: 5000 },
        { id: '3', type: AccountType.EQUITY, balance: 5000 },
      ];
      mockAccountRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.getBalanceSheet('tenant-1', new Date());

      expect(result.assets.total).toBe(10000);
      expect(result.liabilities.total).toBe(5000);
      expect(result.equity.total).toBe(5000);
    });

    it('should generate profit and loss', async () => {
      const mockAccounts = [
        { id: '1', type: AccountType.REVENUE, balance: 20000 },
        { id: '2', type: AccountType.EXPENSE, balance: 12000 },
      ];
      mockAccountRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.getProfitAndLoss(
        'tenant-1',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result.revenue.total).toBe(20000);
      expect(result.expenses.total).toBe(12000);
      expect(result.netIncome).toBe(8000);
    });
  });
});

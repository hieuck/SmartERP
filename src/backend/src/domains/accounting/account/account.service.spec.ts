import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { Invoice } from './entities/invoice.entity';
import { AccountType } from './enums/account-type.enum';
import { InvoiceType } from './enums/invoice-type.enum';
import { JournalEntryStatus } from './enums/journal-entry-status.enum';
import { CacheService } from '@common/cache/cache.service';
import { PermissionService, User } from '@common/security/permission.service';
import { SecureRepository } from '@common/security/secure-repository';

// Mock SecureRepository
jest.mock('@common/security/secure-repository');

describe('AccountService', () => {
  let service: AccountService;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;

  // Mock user
  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['admin'],
  } as any;

  // Helper to create fresh mock account
  const createMockAccount = (overrides = {}): Account => ({
    id: 'account-1',
    code: '1110',
    name: 'Cash',
    type: AccountType.ASSET,
    parentId: null,
    isGroup: false,
    isActive: true,
    balance: 1000,
    currency: 'VND',
    description: 'Cash account',
    status: 'active',
    tenantId: 'tenant-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    ...overrides,
  } as any);

  // Helper to create fresh mock journal entry
  const createMockJournalEntry = (overrides = {}): JournalEntry => ({
    id: 'journal-1',
    number: 'JE-2024-0001',
    date: new Date('2024-01-15'),
    reference: 'REF-001',
    memo: 'Test entry',
    status: JournalEntryStatus.DRAFT,
    lines: [],
    tenantId: 'tenant-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    ...overrides,
  } as any);

  // Helper to create fresh mock invoice
  const createMockInvoice = (overrides = {}): Invoice => ({
    id: 'invoice-1',
    number: 'INV-2024-0001',
    type: InvoiceType.SALES,
    invoiceDate: new Date('2024-01-20'),
    dueDate: new Date('2024-02-20'),
    customerId: 'customer-1',
    total: 5000,
    status: 'draft',
    tenantId: 'tenant-1',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    ...overrides,
  } as any);

  beforeEach(async () => {
    // Create mock repositories
    const mockAccountRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    const mockJournalRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    const mockInvoiceRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockCache = {
      getOrSet: jest.fn(),
      del: jest.fn(),
    };

    const mockPermission = {
      checkPermission: jest.fn(),
    };

    // Mock SecureRepository methods
    const mockSecureRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    (SecureRepository as jest.Mock).mockImplementation(() => mockSecureRepo);

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
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CHART OF ACCOUNTS ====================

  describe('findAllAccounts', () => {
    it('should return all accounts when no type filter', async () => {
      const mockAccounts = [
        createMockAccount(),
        createMockAccount({ id: 'account-2', code: '1120', name: 'Bank' }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.findAllAccounts(mockUser);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: {},
        order: { code: 'ASC' },
      });
      expect(result).toEqual(mockAccounts);
      expect(result).toHaveLength(2);
    });

    it('should return accounts filtered by type', async () => {
      const mockAccounts = [createMockAccount({ type: AccountType.ASSET })];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.findAllAccounts(mockUser, AccountType.ASSET);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { type: AccountType.ASSET },
        order: { code: 'ASC' },
      });
      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array when no accounts found', async () => {
      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.findAllAccounts(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findAccountById', () => {
    it('should return account from cache if exists', async () => {
      const mockAccount = createMockAccount();

      cacheService.getOrSet.mockResolvedValue(mockAccount);

      const result = await service.findAccountById(mockUser, 'account-1');

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('account:tenant-1:account-1'),
        expect.any(Function),
        expect.any(Number),
      );
      expect(result).toEqual(mockAccount);
    });

    it('should fetch account from database if not in cache', async () => {
      const mockAccount = createMockAccount();

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.findOne.mockResolvedValue(mockAccount);

      const result = await service.findAccountById(mockUser, 'account-1');

      expect(secureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'account-1' },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(service.findAccountById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findAccountById(mockUser, 'nonexistent')).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const accountData = {
        code: '1110',
        name: 'Cash',
        type: AccountType.ASSET,
      };
      const mockAccount = createMockAccount(accountData);

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.save.mockResolvedValue(mockAccount);

      const result = await service.createAccount(mockUser, accountData);

      expect(secureRepo.save).toHaveBeenCalledWith(mockUser, accountData);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('updateAccount', () => {
    it('should update account and invalidate cache', async () => {
      const mockAccount = createMockAccount();
      const updateData = { name: 'Updated Cash' };
      const updatedAccount = createMockAccount({ ...mockAccount, ...updateData });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.findOne.mockResolvedValue(mockAccount);
      secureRepo.save.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(mockUser, 'account-1', updateData);

      expect(secureRepo.save).toHaveBeenCalledWith(mockUser, expect.objectContaining(updateData));
      expect(cacheService.del).toHaveBeenCalledWith(
        expect.stringContaining('account:tenant-1:account-1'),
      );
      expect(result).toEqual(updatedAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateAccount(mockUser, 'nonexistent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account and invalidate cache', async () => {
      const mockAccount = createMockAccount();

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.findOne.mockResolvedValue(mockAccount);
      secureRepo.remove.mockResolvedValue(mockAccount);

      await service.deleteAccount(mockUser, 'account-1');

      expect(secureRepo.remove).toHaveBeenCalledWith(mockUser, mockAccount);
      expect(cacheService.del).toHaveBeenCalledWith(
        expect.stringContaining('account:tenant-1:account-1'),
      );
    });

    it('should throw NotFoundException when account not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDefaultCOA', () => {
    it('should create default chart of accounts with hierarchy', async () => {
      const savedAccounts: Account[] = [];
      let saveCallCount = 0;

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.save.mockImplementation(async (user, data) => {
        const account = createMockAccount({
          ...data,
          id: `account-${++saveCallCount}`,
        });
        savedAccounts.push(account);
        return account;
      });

      await service.createDefaultCOA(mockUser);

      // Should create 22 accounts (from template)
      expect(secureRepo.save).toHaveBeenCalledTimes(22);

      // Verify root accounts created
      expect(savedAccounts.some((a) => a.code === '1000' && a.name === 'Assets')).toBe(true);
      expect(savedAccounts.some((a) => a.code === '2000' && a.name === 'Liabilities')).toBe(true);
      expect(savedAccounts.some((a) => a.code === '3000' && a.name === 'Equity')).toBe(true);
      expect(savedAccounts.some((a) => a.code === '4000' && a.name === 'Income')).toBe(true);
      expect(savedAccounts.some((a) => a.code === '5000' && a.name === 'Expenses')).toBe(true);

      // Verify child accounts created
      expect(savedAccounts.some((a) => a.code === '1110' && a.name === 'Cash')).toBe(true);
      expect(savedAccounts.some((a) => a.code === '2110' && a.name === 'Accounts Payable')).toBe(
        true,
      );
    });

    it('should set parent relationships correctly', async () => {
      const accountMap = new Map<string, string>();
      let saveCallCount = 0;

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.save.mockImplementation(async (user, data) => {
        const id = `account-${++saveCallCount}`;
        const account = createMockAccount({ ...data, id });
        accountMap.set(account.code, id);
        return account;
      });

      await service.createDefaultCOA(mockUser);

      // Verify parent-child relationships were set
      const calls = secureRepo.save.mock.calls;

      // Find Cash account (1110) - should have parent 1100
      const cashCall = calls.find((call) => call[1].code === '1110');
      expect(cashCall).toBeDefined();
      expect(cashCall[1].parentId).toBeDefined();

      // Find root accounts - should have null parent
      const assetsCall = calls.find((call) => call[1].code === '1000');
      expect(assetsCall[1].parentId).toBeNull();
    });
  });

  describe('getAccountHierarchy', () => {
    it('should return accounts in tree structure', async () => {
      const mockAccounts = [
        createMockAccount({ id: '1', code: '1000', name: 'Assets', parentId: null, isGroup: true }),
        createMockAccount({
          id: '2',
          code: '1100',
          name: 'Current Assets',
          parentId: '1',
          isGroup: true,
        }),
        createMockAccount({ id: '3', code: '1110', name: 'Cash', parentId: '2', isGroup: false }),
        createMockAccount({ id: '4', code: '1120', name: 'Bank', parentId: '2', isGroup: false }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getAccountHierarchy(mockUser);

      // Should return root accounts only
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('1000');

      // Root should have children
      expect((result[0] as any).children).toBeDefined();
      expect((result[0] as any).children).toHaveLength(1);
      expect((result[0] as any).children[0].code).toBe('1100');

      // Second level should have children
      expect((result[0] as any).children[0].children).toHaveLength(2);
    });

    it('should handle accounts without children', async () => {
      const mockAccounts = [
        createMockAccount({ id: '1', code: '1110', name: 'Cash', parentId: null, isGroup: false }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getAccountHierarchy(mockUser);

      expect(result).toHaveLength(1);
      expect((result[0] as any).children).toEqual([]);
    });

    it('should return empty array when no accounts', async () => {
      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.getAccountHierarchy(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('validateAccountCode', () => {
    it('should return true when code is available', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      const result = await service.validateAccountCode(mockUser, '1110');

      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', code: '1110' },
      });
      expect(result).toBe(true);
    });

    it('should return false when code already exists', async () => {
      accountRepository.findOne.mockResolvedValue(createMockAccount());

      const result = await service.validateAccountCode(mockUser, '1110');

      expect(result).toBe(false);
    });
  });

  describe('getAccountsByType', () => {
    it('should return active accounts of specified type', async () => {
      const mockAccounts = [
        createMockAccount({ type: AccountType.ASSET, isActive: true }),
        createMockAccount({ id: 'account-2', type: AccountType.ASSET, isActive: true }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getAccountsByType(mockUser, AccountType.ASSET);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { type: AccountType.ASSET, isActive: true },
        order: { code: 'ASC' },
      });
      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array when no accounts of type', async () => {
      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.getAccountsByType(mockUser, AccountType.LIABILITY);

      expect(result).toEqual([]);
    });
  });

  describe('getLeafAccounts', () => {
    it('should return only non-group active accounts', async () => {
      const mockAccounts = [
        createMockAccount({ isGroup: false, isActive: true }),
        createMockAccount({ id: 'account-2', isGroup: false, isActive: true }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getLeafAccounts(mockUser);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { isGroup: false, isActive: true },
        order: { code: 'ASC' },
      });
      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array when no leaf accounts', async () => {
      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.getLeafAccounts(mockUser);

      expect(result).toEqual([]);
    });
  });

  // ==================== JOURNAL ENTRIES ====================

  describe('findAllJournalEntries', () => {
    it('should return all journal entries when no date range', async () => {
      const mockEntries = [
        createMockJournalEntry(),
        createMockJournalEntry({ id: 'journal-2', number: 'JE-2024-0002' }),
      ];

      const secureRepo = (service as any).secureJournalRepo;
      secureRepo.find.mockResolvedValue(mockEntries);

      const result = await service.findAllJournalEntries(mockUser);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: {},
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockEntries);
    });

    it('should return journal entries filtered by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockEntries = [createMockJournalEntry()];

      const secureRepo = (service as any).secureJournalRepo;
      secureRepo.find.mockResolvedValue(mockEntries);

      const result = await service.findAllJournalEntries(mockUser, startDate, endDate);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { entryDate: Between(startDate, endDate) },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockEntries);
    });

    it('should return empty array when no entries found', async () => {
      const secureRepo = (service as any).secureJournalRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.findAllJournalEntries(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findJournalEntryById', () => {
    it('should return journal entry from cache if exists', async () => {
      const mockEntry = createMockJournalEntry();

      cacheService.getOrSet.mockResolvedValue(mockEntry);

      const result = await service.findJournalEntryById(mockUser, 'journal-1');

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('journal-entry:tenant-1:journal-1'),
        expect.any(Function),
        expect.any(Number),
      );
      expect(result).toEqual(mockEntry);
    });

    it('should fetch journal entry from database if not in cache', async () => {
      const mockEntry = createMockJournalEntry();

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureJournalRepo;
      secureRepo.findOne.mockResolvedValue(mockEntry);

      const result = await service.findJournalEntryById(mockUser, 'journal-1');

      expect(secureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'journal-1' },
      });
      expect(result).toEqual(mockEntry);
    });

    it('should throw NotFoundException when journal entry not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureJournalRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(service.findJournalEntryById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findJournalEntryById(mockUser, 'nonexistent')).rejects.toThrow(
        'Journal entry not found',
      );
    });
  });

  describe('createJournalEntry', () => {
    it('should create journal entry with auto-generated number', async () => {
      const dto = {
        date: new Date('2024-01-15'),
        reference: 'REF-001',
        memo: 'Test entry',
        lines: [
          { accountId: 'account-1', debit: 1000, credit: 0, description: 'Debit line' },
          { accountId: 'account-2', debit: 0, credit: 1000, description: 'Credit line' },
        ],
      };

      journalEntryRepository.count.mockResolvedValue(5);
      journalEntryRepository.create.mockReturnValue({
        number: 'JE-2024-0006',
        ...dto,
        status: JournalEntryStatus.DRAFT,
      } as any);

      const mockEntry = createMockJournalEntry({
        number: 'JE-2024-0006',
        lines: dto.lines,
      });

      const secureRepo = (service as any).secureJournalRepo;
      secureRepo.save.mockResolvedValueOnce({ ...mockEntry, id: 'journal-1' });
      secureRepo.save.mockResolvedValueOnce(mockEntry);

      const result = await service.createJournalEntry(mockUser, dto as any);

      expect(journalEntryRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
      expect(result.number).toBe('JE-2024-0006');
      expect(result.lines).toHaveLength(2);
    });
  });

  describe('generateJournalNumber', () => {
    it('should generate journal number with current year and padded sequence', async () => {
      journalEntryRepository.count.mockResolvedValue(5);

      const result = await service.generateJournalNumber('tenant-1');

      const currentYear = new Date().getFullYear();
      expect(result).toBe(`JE-${currentYear}-0006`);
    });

    it('should pad sequence number to 4 digits', async () => {
      journalEntryRepository.count.mockResolvedValue(99);

      const result = await service.generateJournalNumber('tenant-1');

      const currentYear = new Date().getFullYear();
      expect(result).toBe(`JE-${currentYear}-0100`);
    });

    it('should start from 0001 when no entries exist', async () => {
      journalEntryRepository.count.mockResolvedValue(0);

      const result = await service.generateJournalNumber('tenant-1');

      const currentYear = new Date().getFullYear();
      expect(result).toBe(`JE-${currentYear}-0001`);
    });
  });

  describe('postJournalEntry', () => {
    it('should post draft journal entry and update account balances', async () => {
      const mockEntry = createMockJournalEntry({
        status: 'draft' as any,
        lines: [
          {
            id: 'line-1',
            accountId: 'account-1',
            debit: 1000,
            credit: 0,
            account: createMockAccount({ type: AccountType.ASSET, balance: 5000 }),
          },
          {
            id: 'line-2',
            accountId: 'account-2',
            debit: 0,
            credit: 1000,
            account: createMockAccount({
              id: 'account-2',
              type: AccountType.LIABILITY,
              balance: 3000,
            }),
          },
        ],
      });

      journalEntryRepository.findOne.mockResolvedValue(mockEntry);
      journalEntryRepository.save.mockResolvedValue({
        ...mockEntry,
        status: 'posted' as any,
      } as any);

      accountRepository.findOne
        .mockResolvedValueOnce(createMockAccount({ type: AccountType.ASSET, balance: 5000 }))
        .mockResolvedValueOnce(
          createMockAccount({ id: 'account-2', type: AccountType.LIABILITY, balance: 3000 }),
        );

      accountRepository.save.mockResolvedValue({} as any);

      const result = await service.postJournalEntry(mockUser, 'journal-1');

      expect(journalEntryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'journal-1', tenantId: 'tenant-1' },
        relations: ['lines', 'lines.account'],
      });
      expect(result.status).toBe('posted');
      expect(accountRepository.save).toHaveBeenCalledTimes(2);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when journal entry not found', async () => {
      journalEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.postJournalEntry(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when entry is not draft', async () => {
      const mockEntry = createMockJournalEntry({ status: 'posted' as any });

      journalEntryRepository.findOne.mockResolvedValue(mockEntry);

      await expect(service.postJournalEntry(mockUser, 'journal-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.postJournalEntry(mockUser, 'journal-1')).rejects.toThrow(
        /Only draft entries can be posted/,
      );
    });

    it('should calculate balance correctly for ASSET accounts (debit increases)', async () => {
      const mockEntry = createMockJournalEntry({
        status: 'draft' as any,
        lines: [
          {
            id: 'line-1',
            accountId: 'account-1',
            debit: 500,
            credit: 0,
            account: createMockAccount({ type: AccountType.ASSET, balance: 1000 }),
          },
        ],
      });

      journalEntryRepository.findOne.mockResolvedValue(mockEntry);
      journalEntryRepository.save.mockResolvedValue({
        ...mockEntry,
        status: 'posted' as any,
      } as any);

      const assetAccount = createMockAccount({ type: AccountType.ASSET, balance: 1000 });
      accountRepository.findOne.mockResolvedValue(assetAccount);
      accountRepository.save.mockImplementation(async (account) => account as any);

      await service.postJournalEntry(mockUser, 'journal-1');

      expect(accountRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 1500, // 1000 + 500 debit
        }),
      );
    });

    it('should calculate balance correctly for LIABILITY accounts (credit increases)', async () => {
      const mockEntry = createMockJournalEntry({
        status: 'draft' as any,
        lines: [
          {
            id: 'line-1',
            accountId: 'account-1',
            debit: 0,
            credit: 500,
            account: createMockAccount({ type: AccountType.LIABILITY, balance: 2000 }),
          },
        ],
      });

      journalEntryRepository.findOne.mockResolvedValue(mockEntry);
      journalEntryRepository.save.mockResolvedValue({
        ...mockEntry,
        status: 'posted' as any,
      } as any);

      const liabilityAccount = createMockAccount({ type: AccountType.LIABILITY, balance: 2000 });
      accountRepository.findOne.mockResolvedValue(liabilityAccount);
      accountRepository.save.mockImplementation(async (account) => account as any);

      await service.postJournalEntry(mockUser, 'journal-1');

      expect(accountRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 2500, // 2000 + 500 credit
        }),
      );
    });
  });

  // ==================== INVOICES ====================

  describe('findAllInvoices', () => {
    it('should return all invoices when no type filter', async () => {
      const mockInvoices = [
        createMockInvoice(),
        createMockInvoice({ id: 'invoice-2', number: 'INV-2024-0002' }),
      ];

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.find.mockResolvedValue(mockInvoices);

      const result = await service.findAllInvoices(mockUser);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: {},
        order: { invoiceDate: 'DESC' },
      });
      expect(result).toEqual(mockInvoices);
      expect(result).toHaveLength(2);
    });

    it('should return invoices filtered by type', async () => {
      const mockInvoices = [createMockInvoice({ type: InvoiceType.SALES })];

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.find.mockResolvedValue(mockInvoices);

      const result = await service.findAllInvoices(mockUser, InvoiceType.SALES);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { type: InvoiceType.SALES },
        order: { invoiceDate: 'DESC' },
      });
      expect(result).toEqual(mockInvoices);
    });

    it('should return empty array when no invoices found', async () => {
      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.findAllInvoices(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findInvoiceById', () => {
    it('should return invoice from cache if exists', async () => {
      const mockInvoice = createMockInvoice();

      cacheService.getOrSet.mockResolvedValue(mockInvoice);

      const result = await service.findInvoiceById(mockUser, 'invoice-1');

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('accounting-invoice:tenant-1:invoice-1'),
        expect.any(Function),
        expect.any(Number),
      );
      expect(result).toEqual(mockInvoice);
    });

    it('should fetch invoice from database if not in cache', async () => {
      const mockInvoice = createMockInvoice();

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findInvoiceById(mockUser, 'invoice-1');

      expect(secureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'invoice-1' },
      });
      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(service.findInvoiceById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findInvoiceById(mockUser, 'nonexistent')).rejects.toThrow(
        'Invoice not found',
      );
    });
  });

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const invoiceData = {
        number: 'INV-2024-0001',
        type: InvoiceType.SALES,
        invoiceDate: new Date('2024-01-20'),
        customerId: 'customer-1',
        total: 5000,
      };
      const mockInvoice = createMockInvoice(invoiceData);

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.save.mockResolvedValue(mockInvoice);

      const result = await service.createInvoice(mockUser, invoiceData);

      expect(secureRepo.save).toHaveBeenCalledWith(mockUser, invoiceData);
      expect(result).toEqual(mockInvoice);
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice and invalidate cache', async () => {
      const mockInvoice = createMockInvoice();
      const updateData = { total: 6000 } as any;
      const updatedInvoice = createMockInvoice({ ...mockInvoice, ...updateData });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.findOne.mockResolvedValue(mockInvoice);
      secureRepo.save.mockResolvedValue(updatedInvoice);

      const result = await service.updateInvoice(mockUser, 'invoice-1', updateData);

      expect(secureRepo.save).toHaveBeenCalledWith(mockUser, expect.objectContaining(updateData));
      expect(cacheService.del).toHaveBeenCalledWith(
        expect.stringContaining('accounting-invoice:tenant-1:invoice-1'),
      );
      expect(result).toEqual(updatedInvoice);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateInvoice(mockUser, 'nonexistent', { total: 6000 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice and invalidate cache', async () => {
      const mockInvoice = createMockInvoice();

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.findOne.mockResolvedValue(mockInvoice);
      secureRepo.remove.mockResolvedValue(mockInvoice);

      await service.deleteInvoice(mockUser, 'invoice-1');

      expect(secureRepo.remove).toHaveBeenCalledWith(mockUser, mockInvoice);
      expect(cacheService.del).toHaveBeenCalledWith(
        expect.stringContaining('accounting-invoice:tenant-1:invoice-1'),
      );
    });

    it('should throw NotFoundException when invoice not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).secureInvoiceRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteInvoice(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== FINANCIAL REPORTS ====================

  describe('getBalanceSheet', () => {
    it('should return balance sheet with assets, liabilities, and equity', async () => {
      const asOfDate = new Date('2024-12-31');
      const mockAccounts = [
        createMockAccount({ type: AccountType.ASSET, balance: 10000 }),
        createMockAccount({ id: 'account-2', type: AccountType.ASSET, balance: 5000 }),
        createMockAccount({ id: 'account-3', type: AccountType.LIABILITY, balance: 8000 }),
        createMockAccount({ id: 'account-4', type: AccountType.LIABILITY, balance: 2000 }),
        createMockAccount({ id: 'account-5', type: AccountType.EQUITY, balance: 5000 }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getBalanceSheet(mockUser, asOfDate);

      expect(result.asOfDate).toEqual(asOfDate);
      expect(result.assets.accounts).toHaveLength(2);
      expect(result.assets.total).toBe(15000);
      expect(result.liabilities.accounts).toHaveLength(2);
      expect(result.liabilities.total).toBe(10000);
      expect(result.equity.accounts).toHaveLength(1);
      expect(result.equity.total).toBe(5000);
    });

    it('should return zero totals when no accounts', async () => {
      const asOfDate = new Date('2024-12-31');

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.getBalanceSheet(mockUser, asOfDate);

      expect(result.assets.total).toBe(0);
      expect(result.liabilities.total).toBe(0);
      expect(result.equity.total).toBe(0);
    });

    it('should handle decimal balances correctly', async () => {
      const asOfDate = new Date('2024-12-31');
      const mockAccounts = [
        createMockAccount({ type: AccountType.ASSET, balance: 1234.56 }),
        createMockAccount({ id: 'account-2', type: AccountType.ASSET, balance: 789.44 }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getBalanceSheet(mockUser, asOfDate);

      expect(result.assets.total).toBe(2024);
    });
  });

  describe('getProfitAndLoss', () => {
    it('should return P&L with revenue, expenses, and net income', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockAccounts = [
        createMockAccount({ type: AccountType.INCOME, balance: 50000 }),
        createMockAccount({ id: 'account-2', type: AccountType.INCOME, balance: 30000 }),
        createMockAccount({ id: 'account-3', type: AccountType.EXPENSE, balance: 20000 }),
        createMockAccount({ id: 'account-4', type: AccountType.EXPENSE, balance: 15000 }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getProfitAndLoss(mockUser, startDate, endDate);

      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.revenue.accounts).toHaveLength(2);
      expect(result.revenue.total).toBe(80000);
      expect(result.expenses.accounts).toHaveLength(2);
      expect(result.expenses.total).toBe(35000);
      expect(result.netIncome).toBe(45000); // 80000 - 35000
    });

    it('should return zero values when no revenue or expense accounts', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.getProfitAndLoss(mockUser, startDate, endDate);

      expect(result.revenue.total).toBe(0);
      expect(result.expenses.total).toBe(0);
      expect(result.netIncome).toBe(0);
    });

    it('should calculate negative net income when expenses exceed revenue', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockAccounts = [
        createMockAccount({ type: AccountType.INCOME, balance: 10000 }),
        createMockAccount({ id: 'account-2', type: AccountType.EXPENSE, balance: 15000 }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getProfitAndLoss(mockUser, startDate, endDate);

      expect(result.netIncome).toBe(-5000); // 10000 - 15000
    });

    it('should handle decimal balances correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockAccounts = [
        createMockAccount({ type: AccountType.INCOME, balance: 1234.56 }),
        createMockAccount({ id: 'account-2', type: AccountType.EXPENSE, balance: 234.56 }),
      ];

      const secureRepo = (service as any).secureAccountRepo;
      secureRepo.find.mockResolvedValue(mockAccounts);

      const result = await service.getProfitAndLoss(mockUser, startDate, endDate);

      expect(result.netIncome).toBe(1000); // 1234.56 - 234.56
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingService } from './accounting.service';
import { JournalEntry, JournalEntryStatus } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import { Account, AccountType } from './entities/account.entity';
import { Invoice } from './entities/invoice.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { BadRequestException } from '@nestjs/common';
import { createMockUser } from '@/common/test/test-helpers';

describe('AccountingService - Journal Entries', () => {
  let service: AccountingService;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let journalLineRepository: jest.Mocked<Repository<JournalLine>>;
  let accountRepository: jest.Mocked<Repository<Account>>;

  const mockJournalEntryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockJournalLineRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAccountRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockInvoiceRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    del: jest.fn(),
  };

  const mockPermissionService = {
    canCreate: jest.fn().mockReturnValue(true),
    canRead: jest.fn().mockReturnValue(true),
    canUpdate: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
  };

  const mockUser = { ...createMockUser(), tenantId: 'tenant-123', id: 'user-123' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: mockJournalEntryRepository,
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: mockJournalLineRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
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
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    journalLineRepository = module.get(getRepositoryToken(JournalLine));
    accountRepository = module.get(getRepositoryToken(Account));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJournalEntry', () => {
    it('should create journal entry with auto-generated number', async () => {
      const dto = {
        date: new Date('2026-03-07'),
        reference: 'INV-001',
        memo: 'Test entry',
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0, description: 'Debit line' },
          { accountId: 'acc-2', debit: 0, credit: 1000, description: 'Credit line' },
        ],
      };

      mockJournalEntryRepository.count.mockResolvedValue(5);

      const createdEntry = {
        ...dto,
        id: 'je-1',
        number: 'JE-2026-0006',
        status: JournalEntryStatus.DRAFT,
        createdBy: mockUser.id,
        tenantId: mockUser.tenantId,
        totalDebit: 1000,
        totalCredit: 1000,
      };

      mockJournalEntryRepository.create.mockReturnValue(createdEntry as any);
      mockJournalEntryRepository.save.mockResolvedValue(createdEntry as any);

      const result = await service.createJournalEntry(mockUser, dto);

      expect(result.number).toBe('JE-2026-0006');
      expect(result.status).toBe(JournalEntryStatus.DRAFT);
      expect(result.createdBy).toBe(mockUser.id);
    });

    // Note: Balanced entry validation is in entity @BeforeInsert() hook
    // Cannot test with mocked repository - requires integration test
  });

  describe('postJournalEntry', () => {
    it('should post draft entry and update status', async () => {
      const entryId = 'je-1';

      const draftEntry = {
        id: entryId,
        number: 'JE-2026-0001',
        status: JournalEntryStatus.DRAFT,
        date: new Date('2026-03-07'),
        lines: [
          {
            accountId: 'acc-1',
            debit: 1000,
            credit: 0,
            account: { id: 'acc-1', balance: 5000, type: AccountType.ASSET },
          },
          {
            accountId: 'acc-2',
            debit: 0,
            credit: 1000,
            account: { id: 'acc-2', balance: 3000, type: AccountType.LIABILITY },
          },
        ],
        totalDebit: 1000,
        totalCredit: 1000,
        tenantId: mockUser.tenantId,
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(draftEntry as any);
      mockJournalEntryRepository.save.mockResolvedValue({
        ...draftEntry,
        status: JournalEntryStatus.POSTED,
        postedBy: mockUser.id,
        postedAt: new Date(),
      } as any);

      mockAccountRepository.findOne.mockImplementation((options: any) => {
        const id = options.where.id;
        return Promise.resolve(
          draftEntry.lines.find((l) => l.accountId === id)?.account as any,
        );
      });

      mockAccountRepository.save.mockImplementation((account: any) =>
        Promise.resolve(account),
      );

      const result = await service.postJournalEntry(mockUser, entryId);

      expect(result.status).toBe(JournalEntryStatus.POSTED);
      expect(result.postedBy).toBe(mockUser.id);
    });

    it('should throw error if entry is not draft', async () => {
      const entryId = 'je-1';

      const postedEntry = {
        id: entryId,
        status: JournalEntryStatus.POSTED,
        tenantId: mockUser.tenantId,
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(postedEntry as any);

      await expect(service.postJournalEntry(mockUser, entryId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateJournalNumber', () => {
    it('should generate sequential number with year prefix', async () => {
      mockJournalEntryRepository.count.mockResolvedValue(42);

      const number = await service.generateJournalNumber(mockUser.tenantId);

      expect(number).toBe('JE-2026-0043');
    });
  });
});

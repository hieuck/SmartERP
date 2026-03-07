import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingService } from './accounting.service';
import { JournalEntry, JournalEntryStatus } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import { Account, AccountType } from './entities/account.entity';
import { CacheService } from '@/common/cache/cache.service';
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
          provide: CacheService,
          useValue: mockCacheService,
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
      const tenantId = 'tenant-123';
      const userId = 'user-123';
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
        createdBy: userId,
        tenantId,
        totalDebit: 1000,
        totalCredit: 1000,
      };

      mockJournalEntryRepository.create.mockReturnValue(createdEntry as any);
      mockJournalEntryRepository.save.mockResolvedValue(createdEntry as any);

      const result = await service.createJournalEntry(dto, tenantId, userId);

      expect(result.number).toBe('JE-2026-0006');
      expect(result.status).toBe(JournalEntryStatus.DRAFT);
      expect(result.createdBy).toBe(userId);
    });

    it('should validate balanced entry', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const dto = {
        date: new Date('2026-03-07'),
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 900 },
        ],
      };

      await expect(service.createJournalEntry(dto, tenantId, userId)).rejects.toThrow();
    });
  });

  describe('postJournalEntry', () => {
    it('should post draft entry and update status', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
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
        tenantId,
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(draftEntry as any);
      mockJournalEntryRepository.save.mockResolvedValue({
        ...draftEntry,
        status: JournalEntryStatus.POSTED,
        postedBy: userId,
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

      const result = await service.postJournalEntry(entryId, tenantId, userId);

      expect(result.status).toBe(JournalEntryStatus.POSTED);
      expect(result.postedBy).toBe(userId);
    });

    it('should throw error if entry is not draft', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const entryId = 'je-1';

      const postedEntry = {
        id: entryId,
        status: JournalEntryStatus.POSTED,
        tenantId,
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(postedEntry as any);

      await expect(service.postJournalEntry(entryId, tenantId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateJournalNumber', () => {
    it('should generate sequential number with year prefix', async () => {
      const tenantId = 'tenant-123';
      mockJournalEntryRepository.count.mockResolvedValue(42);

      const number = await service.generateJournalNumber(tenantId);

      expect(number).toBe('JE-2026-0043');
    });
  });
});

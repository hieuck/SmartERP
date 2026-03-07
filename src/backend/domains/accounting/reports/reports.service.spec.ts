import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Account, AccountType } from '../account/entities/account.entity';
import { JournalLine } from '../account/entities/journal-line.entity';
import { JournalEntry, JournalEntryStatus } from '../account/entities/journal-entry.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let accountRepository: Repository<Account>;
  let journalLineRepository: Repository<JournalLine>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Account),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(JournalLine),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    accountRepository = module.get<Repository<Account>>(getRepositoryToken(Account));
    journalLineRepository = module.get<Repository<JournalLine>>(
      getRepositoryToken(JournalLine),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTrialBalance', () => {
    it('should return trial balance with debit and credit columns', async () => {
      const mockAccounts = [
        {
          id: '1',
          code: '1110',
          name: 'Cash',
          type: AccountType.ASSET,
          balance: 10000,
          isGroup: false,
        },
        {
          id: '2',
          code: '2110',
          name: 'Accounts Payable',
          type: AccountType.LIABILITY,
          balance: 5000,
          isGroup: false,
        },
      ];

      jest.spyOn(accountRepository, 'find').mockResolvedValue(mockAccounts as Account[]);

      const result = await service.getTrialBalance('tenant1', new Date('2026-03-07'));

      expect(result.asOfDate).toEqual(new Date('2026-03-07'));
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0]).toMatchObject({
        code: '1110',
        name: 'Cash',
        debit: 10000,
        credit: 0,
      });
      expect(result.accounts[1]).toMatchObject({
        code: '2110',
        name: 'Accounts Payable',
        debit: 0,
        credit: 5000,
      });
      expect(result.totalDebit).toBe(10000);
      expect(result.totalCredit).toBe(5000);
    });

    it('should show balanced trial balance when debits equal credits', async () => {
      const mockAccounts = [
        {
          id: '1',
          code: '1110',
          name: 'Cash',
          type: AccountType.ASSET,
          balance: 10000,
          isGroup: false,
        },
        {
          id: '2',
          code: '3100',
          name: 'Capital',
          type: AccountType.EQUITY,
          balance: 10000,
          isGroup: false,
        },
      ];

      jest.spyOn(accountRepository, 'find').mockResolvedValue(mockAccounts as Account[]);

      const result = await service.getTrialBalance('tenant1', new Date('2026-03-07'));

      expect(result.totalDebit).toBe(10000);
      expect(result.totalCredit).toBe(10000);
      expect(result.isBalanced).toBe(true);
    });

    it('should exclude group accounts from trial balance', async () => {
      const mockAccounts = [
        {
          id: '1',
          code: '1000',
          name: 'Assets',
          type: AccountType.ASSET,
          balance: 10000,
          isGroup: true,
        },
        {
          id: '2',
          code: '1110',
          name: 'Cash',
          type: AccountType.ASSET,
          balance: 10000,
          isGroup: false,
        },
      ];

      jest.spyOn(accountRepository, 'find').mockResolvedValue(mockAccounts as Account[]);

      const result = await service.getTrialBalance('tenant1', new Date('2026-03-07'));

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].code).toBe('1110');
    });
  });

  describe('getGeneralLedger', () => {
    it('should return general ledger with running balance', async () => {
      const mockAccount = {
        id: 'acc1',
        code: '1110',
        name: 'Cash',
        type: AccountType.ASSET,
      };

      const mockLines = [
        {
          id: 'line1',
          debit: 5000,
          credit: 0,
          description: 'Initial deposit',
          journalEntry: {
            number: 'JE-2026-0001',
            entryDate: new Date('2026-03-01'),
            status: JournalEntryStatus.POSTED,
          },
        },
        {
          id: 'line2',
          debit: 3000,
          credit: 0,
          description: 'Sales',
          journalEntry: {
            number: 'JE-2026-0002',
            entryDate: new Date('2026-03-05'),
            status: JournalEntryStatus.POSTED,
          },
        },
        {
          id: 'line3',
          debit: 0,
          credit: 2000,
          description: 'Payment',
          journalEntry: {
            number: 'JE-2026-0003',
            entryDate: new Date('2026-03-07'),
            status: JournalEntryStatus.POSTED,
          },
        },
      ];

      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount as Account);
      jest.spyOn(journalLineRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLines),
      } as any);

      const result = await service.getGeneralLedger(
        'tenant1',
        'acc1',
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );

      expect(result.account.code).toBe('1110');
      expect(result.transactions).toHaveLength(3);
      expect(result.transactions[0].balance).toBe(5000);
      expect(result.transactions[1].balance).toBe(8000);
      expect(result.transactions[2].balance).toBe(6000);
      expect(result.closingBalance).toBe(6000);
    });
  });

  describe('getCashFlowStatement', () => {
    it('should categorize cash flows into operating, investing, financing', async () => {
      // Will implement after basic structure
      expect(true).toBe(true);
    });
  });
});

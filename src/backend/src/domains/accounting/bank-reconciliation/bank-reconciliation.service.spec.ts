import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankReconciliationService } from './bank-reconciliation.service';
import { BankStatement } from './entities/bank-statement.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { BankStatementStatus } from './enums/bank-statement-status.enum';
import { JournalEntry } from '@/domains/accounting/account/entities/journal-entry.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createMockUser } from '@/common/test/test-helpers';

describe('BankReconciliationService', () => {
  let service: BankReconciliationService;
  let statementRepository: Repository<BankStatement>;
  let transactionRepository: Repository<BankTransaction>;
  let journalEntryRepository: Repository<JournalEntry>;
  let permissionService: PermissionService;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    roles: ['accountant'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankReconciliationService,
        {
          provide: getRepositoryToken(BankStatement),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BankTransaction),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useClass: Repository,
        },
        {
          provide: PermissionService,
          useValue: {
            checkPermission: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<BankReconciliationService>(BankReconciliationService);
    statementRepository = module.get(getRepositoryToken(BankStatement));
    transactionRepository = module.get(getRepositoryToken(BankTransaction));
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    permissionService = module.get(PermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create bank statement with transactions', async () => {
      const dto = {
        bankAccountId: 'acc-1',
        statementDate: new Date('2026-03-07'),
        openingBalance: 1000,
        closingBalance: 1500,
        transactions: [
          {
            date: new Date('2026-03-07'),
            description: 'Deposit',
            amount: 500,
            reference: 'REF-001',
          },
        ],
      };

      const savedStatement = {
        id: 'stmt-1',
        number: 'BS-2026-0001',
        ...dto,
        status: BankStatementStatus.DRAFT,
        tenantId: mockUser.tenantId,
        createdBy: mockUser.id,
      };

      jest.spyOn(statementRepository, 'count').mockResolvedValue(0);
      jest.spyOn(statementRepository, 'create').mockReturnValue(savedStatement as any);
      jest.spyOn(statementRepository, 'save').mockResolvedValue(savedStatement as any);

      const result = await service.create(mockUser, dto);

      expect(result.number).toBe('BS-2026-0001');
      expect(result.status).toBe(BankStatementStatus.DRAFT);
      expect(statementRepository.save).toHaveBeenCalled();
    });

    it('should generate sequential statement numbers', async () => {
      jest.spyOn(statementRepository, 'count').mockResolvedValue(5);

      const number = await service['generateNumber'](mockUser.tenantId);

      expect(number).toBe('BS-2026-0006');
    });
  });

  describe('autoMatch', () => {
    it('should match transactions by amount and date', async () => {
      const statement = {
        id: 'stmt-1',
        bankAccount: { id: 'acc-1' },
        transactions: [
          {
            id: 'tx-1',
            date: new Date('2026-03-07'),
            amount: 500,
            isReconciled: false,
          },
        ],
        tenantId: mockUser.tenantId,
      };

      const journalEntries = [
        {
          id: 'je-1',
          date: new Date('2026-03-07'),
          amount: 500,
        },
      ];

      jest.spyOn(statementRepository, 'findOne').mockResolvedValue(statement as any);
      jest.spyOn(service as any, 'getUnreconciledEntries').mockResolvedValue(journalEntries);
      jest.spyOn(transactionRepository, 'save').mockResolvedValue({} as any);

      const result = await service.autoMatch('stmt-1', mockUser);

      expect(result.matched).toBe(1);
      expect(result.unmatched).toBe(0);
      expect(transactionRepository.save).toHaveBeenCalled();
    });

    it('should not match if amount differs', async () => {
      const statement = {
        id: 'stmt-1',
        bankAccount: { id: 'acc-1' },
        transactions: [
          {
            id: 'tx-1',
            date: new Date('2026-03-07'),
            amount: 500,
            isReconciled: false,
          },
        ],
        tenantId: mockUser.tenantId,
      };

      const journalEntries = [
        {
          id: 'je-1',
          date: new Date('2026-03-07'),
          amount: 600, // Different amount
        },
      ];

      jest.spyOn(statementRepository, 'findOne').mockResolvedValue(statement as any);
      jest.spyOn(service as any, 'getUnreconciledEntries').mockResolvedValue(journalEntries);

      const result = await service.autoMatch('stmt-1', mockUser);

      expect(result.matched).toBe(0);
      expect(result.unmatched).toBe(1);
    });

    it('should match within 3 days date tolerance', async () => {
      const statement = {
        id: 'stmt-1',
        bankAccount: { id: 'acc-1' },
        transactions: [
          {
            id: 'tx-1',
            date: new Date('2026-03-07'),
            amount: 500,
            isReconciled: false,
          },
        ],
        tenantId: mockUser.tenantId,
      };

      const journalEntries = [
        {
          id: 'je-1',
          date: new Date('2026-03-09'), // 2 days later
          amount: 500,
        },
      ];

      jest.spyOn(statementRepository, 'findOne').mockResolvedValue(statement as any);
      jest.spyOn(service as any, 'getUnreconciledEntries').mockResolvedValue(journalEntries);
      jest.spyOn(transactionRepository, 'save').mockResolvedValue({} as any);

      const result = await service.autoMatch('stmt-1', mockUser);

      expect(result.matched).toBe(1);
    });
  });

  describe('manualMatch', () => {
    it('should manually match transaction with journal entry', async () => {
      const transaction = {
        id: 'tx-1',
        isReconciled: false,
      };

      const entry = {
        id: 'je-1',
      };

      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(transaction as any);
      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(entry as any);
      jest.spyOn(transactionRepository, 'save').mockResolvedValue({
        ...transaction,
        matchedEntry: entry,
        isReconciled: true,
      } as any);

      const result = await service.manualMatch('tx-1', 'je-1', mockUser);

      expect(result.isReconciled).toBe(true);
      expect(result.matchedEntry).toBeDefined();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.manualMatch('tx-1', 'je-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getReconciliationReport', () => {
    it('should generate reconciliation report', async () => {
      const statement = {
        id: 'stmt-1',
        statementDate: new Date('2026-03-07'),
        openingBalance: 1000,
        closingBalance: 1500,
        bankAccount: { id: 'acc-1' },
        transactions: [
          {
            id: 'tx-1',
            amount: 500,
            isReconciled: true,
          },
          {
            id: 'tx-2',
            amount: 100,
            isReconciled: false,
          },
        ],
        tenantId: mockUser.tenantId,
      };

      jest.spyOn(statementRepository, 'findOne').mockResolvedValue(statement as any);
      jest.spyOn(service as any, 'getBookBalance').mockResolvedValue(1400);

      const result = await service.getReconciliationReport('stmt-1', mockUser);

      expect(result.reconciliation.reconciled).toBe(1);
      expect(result.reconciliation.unreconciled).toBe(1);
      expect(result.reconciliation.reconciledAmount).toBe(500);
      expect(result.reconciliation.unreconciledAmount).toBe(100);
      expect(result.statement.closingBalance).toBe(1500);
      expect(result.book.balance).toBe(1400);
    });
  });

  describe('unmatch', () => {
    it('should unmatch a reconciled transaction', async () => {
      const transaction = {
        id: 'tx-1',
        isReconciled: true,
        matchedEntry: { id: 'je-1' },
      };

      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(transaction as any);
      jest.spyOn(transactionRepository, 'save').mockResolvedValue({
        ...transaction,
        matchedEntry: null,
        isReconciled: false,
      } as any);

      const result = await service.unmatch('tx-1', mockUser);

      expect(result.isReconciled).toBe(false);
      expect(result.matchedEntry).toBeNull();
    });

    it('should throw BadRequestException if transaction not reconciled', async () => {
      const transaction = {
        id: 'tx-1',
        isReconciled: false,
      };

      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(transaction as any);

      await expect(service.unmatch('tx-1', mockUser)).rejects.toThrow(BadRequestException);
    });
  });
});

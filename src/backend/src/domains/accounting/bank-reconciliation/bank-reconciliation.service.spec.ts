import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BankReconciliationService } from './bank-reconciliation.service';
import { BankStatement } from './entities/bank-statement.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { BankStatementStatus } from './enums/bank-statement-status.enum';
import { JournalEntry } from '../account/entities/journal-entry.entity';
import { Account } from '../account/entities/account.entity';
import { PermissionService, User } from '@common/security/permission.service';
import { SecureRepository } from '@common/security/secure-repository';

// Mock SecureRepository
jest.mock('@common/security/secure-repository');

describe('BankReconciliationService', () => {
  let _permissionService: jest.Mocked<PermissionService>;
  let service: BankReconciliationService;
  let statementRepository: jest.Mocked<Repository<BankStatement>>;
  let transactionRepository: jest.Mocked<Repository<BankTransaction>>;
  let journalEntryRepository: jest.Mocked<Repository<JournalEntry>>;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let __permissionService: jest.Mocked<PermissionService>;

  // Mock user
  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['admin'],
  } as any;

  // Helper to create fresh mock bank statement
  const createMockStatement = (overrides = {}): BankStatement =>
    ({
      id: 'statement-1',
      number: 'BS-2024-0001',
      bankAccount: {
        id: 'account-1',
        code: '1120',
        name: 'Bank Account',
        balance: 10000,
      } as any,
      statementDate: new Date('2024-01-31'),
      openingBalance: 10000,
      closingBalance: 12000,
      transactions: [],
      status: BankStatementStatus.DRAFT,
      tenantId: 'tenant-1',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-31'),
      updatedAt: new Date('2024-01-31'),
      ...overrides,
    }) as any;

  // Helper to create fresh mock bank transaction
  const createMockTransaction = (overrides = {}): BankTransaction =>
    ({
      id: 'transaction-1',
      statement: createMockStatement(),
      date: new Date('2024-01-15'),
      description: 'Payment received',
      amount: 1000,
      reference: 'REF-001',
      matchedEntry: null,
      isReconciled: false,
      tenantId: 'tenant-1',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      ...overrides,
    }) as any;

  beforeEach(async () => {
    // Create mock repositories
    const mockStatementRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const mockTransactionRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockJournalRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockAccountRepo = {
      findOne: jest.fn(),
    };

    const mockPermission = {
      checkPermission: jest.fn(),
    };

    // Mock SecureRepository methods
    const mockSecureRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    (SecureRepository as jest.Mock).mockImplementation(() => mockSecureRepo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankReconciliationService,
        {
          provide: getRepositoryToken(BankStatement),
          useValue: mockStatementRepo,
        },
        {
          provide: getRepositoryToken(BankTransaction),
          useValue: mockTransactionRepo,
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: mockJournalRepo,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepo,
        },
        {
          provide: PermissionService,
          useValue: mockPermission,
        },
      ],
    }).compile();

    service = module.get<BankReconciliationService>(BankReconciliationService);
    statementRepository = module.get(getRepositoryToken(BankStatement));
    transactionRepository = module.get(getRepositoryToken(BankTransaction));
    journalEntryRepository = module.get(getRepositoryToken(JournalEntry));
    accountRepository = module.get(getRepositoryToken(Account));
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create bank statement with auto-generated number', async () => {
      const dto = {
        bankAccountId: 'account-1',
        statementDate: new Date('2024-01-31'),
        openingBalance: 10000,
        closingBalance: 12000,
        transactions: [
          {
            date: new Date('2024-01-15'),
            description: 'Payment received',
            amount: 1000,
            reference: 'REF-001',
          },
          {
            date: new Date('2024-01-20'),
            description: 'Payment sent',
            amount: -500,
            reference: 'REF-002',
          },
        ],
      };

      const currentYear = new Date().getFullYear();
      statementRepository.count.mockResolvedValue(5);
      statementRepository.create.mockReturnValue(createMockStatement() as any);
      statementRepository.save.mockResolvedValue(createMockStatement());

      const result = await service.create(dto as any, mockUser);

      expect(statementRepository.count).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          number: Like(`BS-${currentYear}-%`),
        },
      });
      expect(statementRepository.create).toHaveBeenCalled();
      expect(statementRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.number).toBe('BS-2024-0001');
    });

    it('should pad statement number correctly', async () => {
      const dto = {
        bankAccountId: 'account-1',
        statementDate: new Date('2024-01-31'),
        openingBalance: 10000,
        closingBalance: 12000,
        transactions: [],
      };

      statementRepository.count.mockResolvedValue(99);
      statementRepository.create.mockReturnValue(
        createMockStatement({ number: 'BS-2024-0100' }) as any,
      );
      statementRepository.save.mockResolvedValue(createMockStatement({ number: 'BS-2024-0100' }));

      const result = await service.create(dto as any, mockUser);

      expect(result.number).toBe('BS-2024-0100');
    });
  });

  describe('findAll', () => {
    it('should return all bank statements ordered by date', async () => {
      const mockStatements = [
        createMockStatement(),
        createMockStatement({ id: 'statement-2', number: 'BS-2024-0002' }),
      ];

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.find.mockResolvedValue(mockStatements);

      const result = await service.findAll(mockUser);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        order: { statementDate: 'DESC' },
      });
      expect(result).toEqual(mockStatements);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no statements found', async () => {
      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return statement with relations', async () => {
      const mockStatement = createMockStatement({
        transactions: [createMockTransaction()],
      });

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      const result = await service.findOne('statement-1', mockUser);

      expect(secureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'statement-1' },
        relations: ['bankAccount', 'transactions', 'transactions.matchedEntry'],
      });
      expect(result).toEqual(mockStatement);
    });

    it('should throw NotFoundException when statement not found', async () => {
      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent', mockUser)).rejects.toThrow(
        'Bank statement not found',
      );
    });
  });

  describe('autoMatch', () => {
    it('should auto-match transactions with journal entries', async () => {
      const mockStatement = createMockStatement({
        transactions: [
          createMockTransaction({
            id: 'tx-1',
            amount: 1000,
            date: new Date('2024-01-15'),
            isReconciled: false,
          }),
          createMockTransaction({
            id: 'tx-2',
            amount: 500,
            date: new Date('2024-01-20'),
            isReconciled: false,
          }),
        ],
      });

      const mockEntries = [
        { id: 'entry-1', date: new Date('2024-01-15'), amount: 1000 },
        { id: 'entry-2', date: new Date('2024-01-20'), amount: 500 },
      ];

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      // Mock query builder for getUnreconciledEntries
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockEntries),
      };

      journalEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      transactionRepository.save.mockImplementation(async (tx) => tx as any);

      const result = await service.autoMatch('statement-1', mockUser);

      expect(result.total).toBe(2);
      expect(result.matched).toBe(2);
      expect(result.unmatched).toBe(0);
      expect(transactionRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should match transactions within 3 days date tolerance', async () => {
      const mockStatement = createMockStatement({
        transactions: [
          createMockTransaction({
            id: 'tx-1',
            amount: 1000,
            date: new Date('2024-01-15'),
            isReconciled: false,
          }),
        ],
      });

      const mockEntries = [
        { id: 'entry-1', date: new Date('2024-01-17'), amount: 1000 }, // 2 days difference
      ];

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockEntries),
      };

      journalEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      transactionRepository.save.mockImplementation(async (tx) => tx as any);

      const result = await service.autoMatch('statement-1', mockUser);

      expect(result.matched).toBe(1);
    });

    it('should not match transactions outside 3 days tolerance', async () => {
      const mockStatement = createMockStatement({
        transactions: [
          createMockTransaction({
            id: 'tx-1',
            amount: 1000,
            date: new Date('2024-01-15'),
            isReconciled: false,
          }),
        ],
      });

      const mockEntries = [
        { id: 'entry-1', date: new Date('2024-01-20'), amount: 1000 }, // 5 days difference
      ];

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockEntries),
      };

      journalEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.autoMatch('statement-1', mockUser);

      expect(result.matched).toBe(0);
      expect(result.unmatched).toBe(1);
    });

    it('should skip already reconciled transactions', async () => {
      const mockStatement = createMockStatement({
        transactions: [
          createMockTransaction({
            id: 'tx-1',
            amount: 1000,
            date: new Date('2024-01-15'),
            isReconciled: true, // Already reconciled
          }),
        ],
      });

      const mockEntries = [{ id: 'entry-1', date: new Date('2024-01-15'), amount: 1000 }];

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockEntries),
      };

      journalEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.autoMatch('statement-1', mockUser);

      expect(result.matched).toBe(0);
      expect(transactionRepository.save).not.toHaveBeenCalled();
    });

    it('should handle amount matching with small tolerance', async () => {
      const mockStatement = createMockStatement({
        transactions: [
          createMockTransaction({
            id: 'tx-1',
            amount: 1000.005,
            date: new Date('2024-01-15'),
            isReconciled: false,
          }),
        ],
      });

      const mockEntries = [
        { id: 'entry-1', date: new Date('2024-01-15'), amount: 1000.001 }, // 0.004 difference
      ];

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockEntries),
      };

      journalEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      transactionRepository.save.mockImplementation(async (tx) => tx as any);

      const result = await service.autoMatch('statement-1', mockUser);

      expect(result.matched).toBe(1);
    });
  });

  describe('manualMatch', () => {
    it('should manually match transaction with journal entry', async () => {
      const mockTransaction = createMockTransaction();
      const mockEntry = { id: 'entry-1', date: new Date('2024-01-15') } as any;

      transactionRepository.findOne.mockResolvedValue(mockTransaction);
      journalEntryRepository.findOne.mockResolvedValue(mockEntry);
      transactionRepository.save.mockResolvedValue({
        ...mockTransaction,
        matchedEntry: mockEntry,
        isReconciled: true,
      });

      const result = await service.manualMatch('transaction-1', 'entry-1', mockUser);

      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-1', tenantId: 'tenant-1' },
      });
      expect(journalEntryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'entry-1', tenantId: 'tenant-1' },
      });
      expect(result.isReconciled).toBe(true);
      expect(result.matchedEntry).toEqual(mockEntry);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepository.findOne.mockResolvedValue(null);

      await expect(service.manualMatch('nonexistent', 'entry-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.manualMatch('nonexistent', 'entry-1', mockUser)).rejects.toThrow(
        'Transaction not found',
      );
    });

    it('should throw NotFoundException when journal entry not found', async () => {
      const mockTransaction = createMockTransaction();

      transactionRepository.findOne.mockResolvedValue(mockTransaction);
      journalEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.manualMatch('transaction-1', 'nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.manualMatch('transaction-1', 'nonexistent', mockUser)).rejects.toThrow(
        'Journal entry not found',
      );
    });
  });

  describe('unmatch', () => {
    it('should unmatch reconciled transaction', async () => {
      const mockTransaction = createMockTransaction({
        isReconciled: true,
        matchedEntry: { id: 'entry-1' } as any,
      });

      transactionRepository.findOne.mockResolvedValue(mockTransaction);
      transactionRepository.save.mockResolvedValue({
        ...mockTransaction,
        matchedEntry: null,
        isReconciled: false,
      });

      const result = await service.unmatch('transaction-1', mockUser);

      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction-1', tenantId: 'tenant-1' },
      });
      expect(result.isReconciled).toBe(false);
      expect(result.matchedEntry).toBeNull();
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepository.findOne.mockResolvedValue(null);

      await expect(service.unmatch('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.unmatch('nonexistent', mockUser)).rejects.toThrow(
        'Transaction not found',
      );
    });

    it('should throw BadRequestException when transaction is not reconciled', async () => {
      const mockTransaction = createMockTransaction({
        isReconciled: false,
      });

      transactionRepository.findOne.mockResolvedValue(mockTransaction);

      await expect(service.unmatch('transaction-1', mockUser)).rejects.toThrow(BadRequestException);
      await expect(service.unmatch('transaction-1', mockUser)).rejects.toThrow(
        'Transaction is not reconciled',
      );
    });
  });

  describe('getReconciliationReport', () => {
    it('should return reconciliation report with all details', async () => {
      const mockStatement = createMockStatement({
        transactions: [
          createMockTransaction({
            id: 'tx-1',
            amount: 1000,
            isReconciled: true,
          }),
          createMockTransaction({
            id: 'tx-2',
            amount: 500,
            isReconciled: true,
          }),
          createMockTransaction({
            id: 'tx-3',
            amount: -300,
            isReconciled: false,
          }),
        ],
      });

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      accountRepository.findOne.mockResolvedValue({
        id: 'account-1',
        balance: 11500,
      } as any);

      const result = await service.getReconciliationReport('statement-1', mockUser);

      expect(result.statement.date).toEqual(mockStatement.statementDate);
      expect(result.statement.openingBalance).toBe(10000);
      expect(result.statement.closingBalance).toBe(12000);
      expect(result.book.balance).toBe(11500);
      expect(result.reconciliation.reconciled).toBe(2);
      expect(result.reconciliation.unreconciled).toBe(1);
      expect(result.reconciliation.reconciledAmount).toBe(1500);
      expect(result.reconciliation.unreconciledAmount).toBe(-300);
      expect(result.reconciliation.difference).toBe(800); // 12000 - (11500 + (-300))
      expect(result.unreconciledTransactions).toHaveLength(1);
    });

    it('should handle statement with no transactions', async () => {
      const mockStatement = createMockStatement({
        transactions: [],
      });

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      accountRepository.findOne.mockResolvedValue({
        id: 'account-1',
        balance: 10000,
      } as any);

      const result = await service.getReconciliationReport('statement-1', mockUser);

      expect(result.reconciliation.reconciled).toBe(0);
      expect(result.reconciliation.unreconciled).toBe(0);
      expect(result.reconciliation.reconciledAmount).toBe(0);
      expect(result.reconciliation.unreconciledAmount).toBe(0);
    });

    it('should handle all transactions reconciled', async () => {
      const mockStatement = createMockStatement({
        transactions: [
          createMockTransaction({
            id: 'tx-1',
            amount: 1000,
            isReconciled: true,
          }),
          createMockTransaction({
            id: 'tx-2',
            amount: 1000,
            isReconciled: true,
          }),
        ],
      });

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      accountRepository.findOne.mockResolvedValue({
        id: 'account-1',
        balance: 12000,
      } as any);

      const result = await service.getReconciliationReport('statement-1', mockUser);

      expect(result.reconciliation.reconciled).toBe(2);
      expect(result.reconciliation.unreconciled).toBe(0);
      expect(result.unreconciledTransactions).toHaveLength(0);
    });

    it('should throw NotFoundException when bank account not found', async () => {
      const mockStatement = createMockStatement();

      const secureRepo = (service as any).secureStatementRepo;
      secureRepo.findOne.mockResolvedValue(mockStatement);

      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.getReconciliationReport('statement-1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getReconciliationReport('statement-1', mockUser)).rejects.toThrow(
        'Bank account not found',
      );
    });
  });
});

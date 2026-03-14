/**
 * BankReconciliationController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. POST /bank-reconciliation/statements - Create bank statement
 * 2. GET /bank-reconciliation/statements - Get all bank statements
 * 3. GET /bank-reconciliation/statements/:id - Get bank statement by ID
 * 4. POST /bank-reconciliation/statements/:id/auto-match - Auto-match transactions
 * 5. POST /bank-reconciliation/transactions/:transactionId/match/:entryId - Manual match
 * 6. PATCH /bank-reconciliation/transactions/:id/unmatch - Unmatch transaction
 * 7. GET /bank-reconciliation/statements/:id/report - Get reconciliation report
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { BankReconciliationController } from './bank-reconciliation.controller';
import { BankReconciliationService } from './bank-reconciliation.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('BankReconciliationController (Integration)', () => {
  let app: INestApplication;
  let bankReconciliationService: jest.Mocked<BankReconciliationService>;

  const mockUser = {
    id: 'user-123',
    email: 'accountant@example.com',
    tenantId: 'tenant-123',
    roles: ['accountant'],
  };

  const mockBankStatement = {
    id: 'statement-123',
    bankAccountId: 'account-123',
    statementDate: new Date('2024-01-31'),
    openingBalance: 10000,
    closingBalance: 15000,
    transactions: [],
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'transaction-123',
    statementId: 'statement-123',
    date: new Date('2024-01-15'),
    description: 'Payment received',
    amount: 5000,
    type: 'credit',
    matched: false,
  };

  beforeAll(async () => {
    const mockBankReconciliationService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      autoMatch: jest.fn(),
      manualMatch: jest.fn(),
      unmatch: jest.fn(),
      getReconciliationReport: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BankReconciliationController],
      providers: [
        {
          provide: BankReconciliationService,
          useValue: mockBankReconciliationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    bankReconciliationService = moduleFixture.get(BankReconciliationService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /bank-reconciliation/statements', () => {
    it('should create bank statement successfully', async () => {
      const createDto = {
        bankAccountId: 'account-123',
        statementDate: '2024-01-31',
        openingBalance: 10000,
        closingBalance: 15000,
      };

      bankReconciliationService.create.mockResolvedValue(mockBankStatement);

      const response = await request(app.getHttpServer())
        .post('/bank-reconciliation/statements')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockBankStatement);
      expect(bankReconciliationService.create).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/bank-reconciliation/statements')
        .send({ bankAccountId: 'account-123' })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/bank-reconciliation/statements')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });
  });

  describe('GET /bank-reconciliation/statements', () => {
    it('should return all bank statements', async () => {
      const statements = [mockBankStatement];
      bankReconciliationService.findAll.mockResolvedValue(statements);

      const response = await request(app.getHttpServer())
        .get('/bank-reconciliation/statements')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(statements);
      expect(bankReconciliationService.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no statements', async () => {
      bankReconciliationService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/bank-reconciliation/statements')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /bank-reconciliation/statements/:id', () => {
    it('should return bank statement by ID', async () => {
      bankReconciliationService.findOne.mockResolvedValue(mockBankStatement);

      const response = await request(app.getHttpServer())
        .get('/bank-reconciliation/statements/statement-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockBankStatement);
      expect(bankReconciliationService.findOne).toHaveBeenCalledWith('statement-123', mockUser);
    });

    it('should return 404 when statement not found', async () => {
      bankReconciliationService.findOne.mockRejectedValue(
        new HttpException('Bank statement not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/bank-reconciliation/statements/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('POST /bank-reconciliation/statements/:id/auto-match', () => {
    it('should auto-match transactions successfully', async () => {
      const matchResult = {
        matched: 5,
        unmatched: 2,
        total: 7,
      };

      bankReconciliationService.autoMatch.mockResolvedValue(matchResult);

      const response = await request(app.getHttpServer())
        .post('/bank-reconciliation/statements/statement-123/auto-match')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body).toEqual(matchResult);
      expect(bankReconciliationService.autoMatch).toHaveBeenCalledWith('statement-123', mockUser);
    });

    it('should return 404 when statement not found', async () => {
      bankReconciliationService.autoMatch.mockRejectedValue(
        new HttpException('Bank statement not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/bank-reconciliation/statements/non-existent/auto-match')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('POST /bank-reconciliation/transactions/:transactionId/match/:entryId', () => {
    it('should manually match transaction with journal entry', async () => {
      const matchedTransaction = { ...mockTransaction, matched: true };
      bankReconciliationService.manualMatch.mockResolvedValue(matchedTransaction);

      const response = await request(app.getHttpServer())
        .post('/bank-reconciliation/transactions/transaction-123/match/entry-456')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body.matched).toBe(true);
      expect(bankReconciliationService.manualMatch).toHaveBeenCalledWith(
        'transaction-123',
        'entry-456',
        mockUser,
      );
    });

    it('should return 404 when transaction not found', async () => {
      bankReconciliationService.manualMatch.mockRejectedValue(
        new HttpException('Transaction not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/bank-reconciliation/transactions/non-existent/match/entry-456')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 404 when journal entry not found', async () => {
      bankReconciliationService.manualMatch.mockRejectedValue(
        new HttpException('Journal entry not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/bank-reconciliation/transactions/transaction-123/match/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PATCH /bank-reconciliation/transactions/:id/unmatch', () => {
    it('should unmatch transaction successfully', async () => {
      const unmatchedTransaction = { ...mockTransaction, matched: false };
      bankReconciliationService.unmatch.mockResolvedValue(unmatchedTransaction);

      const response = await request(app.getHttpServer())
        .patch('/bank-reconciliation/transactions/transaction-123/unmatch')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.matched).toBe(false);
      expect(bankReconciliationService.unmatch).toHaveBeenCalledWith('transaction-123', mockUser);
    });

    it('should return 404 when transaction not found', async () => {
      bankReconciliationService.unmatch.mockRejectedValue(
        new HttpException('Transaction not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/bank-reconciliation/transactions/non-existent/unmatch')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when transaction is not matched', async () => {
      bankReconciliationService.unmatch.mockRejectedValue(
        new HttpException('Transaction is not matched', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/bank-reconciliation/transactions/transaction-123/unmatch')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('GET /bank-reconciliation/statements/:id/report', () => {
    it('should return reconciliation report', async () => {
      const report = {
        statementId: 'statement-123',
        openingBalance: 10000,
        closingBalance: 15000,
        totalCredits: 8000,
        totalDebits: 3000,
        matchedTransactions: 5,
        unmatchedTransactions: 2,
        reconciled: false,
      };

      bankReconciliationService.getReconciliationReport.mockResolvedValue(report);

      const response = await request(app.getHttpServer())
        .get('/bank-reconciliation/statements/statement-123/report')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(report);
      expect(bankReconciliationService.getReconciliationReport).toHaveBeenCalledWith(
        'statement-123',
        mockUser,
      );
    });

    it('should return 404 when statement not found', async () => {
      bankReconciliationService.getReconciliationReport.mockRejectedValue(
        new HttpException('Bank statement not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/bank-reconciliation/statements/non-existent/report')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });
});

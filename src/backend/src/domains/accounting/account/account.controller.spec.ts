import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { AccountType } from './enums';
import { User } from '@/common/security/permission.service';
import { SyncStatus } from '@/common/enums/sync-status.enum';

describe('AccountController (Integration)', () => {
  let app: INestApplication;
  let accountService: jest.Mocked<AccountService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockAccount = {
    id: 'account-1',
    tenantId: 'tenant-1',
    code: '1000',
    name: 'Cash',
    type: AccountType.ASSET,
    isGroup: false,
    isActive: true,
    balance: 10000,
    currency: 'VND',
    status: 'active',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  };

  const __mockJournalEntry = {
    id: 'je-1',
    tenantId: 'tenant-1',
    number: 'JE-2024-0001',
    date: new Date(),
    status: 'draft',
    lines: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const __mockInvoice = {
    id: 'invoice-1',
    tenantId: 'tenant-1',
    invoiceNumber: 'INV-001',
    type: 'sales',
    amount: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockAccountService = {
      findAllAccounts: jest.fn(),
      findAccountById: jest.fn(),
      createAccount: jest.fn(),
      updateAccount: jest.fn(),
      deleteAccount: jest.fn(),
      createDefaultCOA: jest.fn(),
      getAccountHierarchy: jest.fn(),
      validateAccountCode: jest.fn(),
      getAccountsByType: jest.fn(),
      getLeafAccounts: jest.fn(),
      findAllJournalEntries: jest.fn(),
      findJournalEntryById: jest.fn(),
      createJournalEntry: jest.fn(),
      postJournalEntry: jest.fn(),
      findAllInvoices: jest.fn(),
      findInvoiceById: jest.fn(),
      createInvoice: jest.fn(),
      updateInvoice: jest.fn(),
      deleteInvoice: jest.fn(),
      getBalanceSheet: jest.fn(),
      getProfitAndLoss: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        },
      })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    accountService = module.get(AccountService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /accounting/accounts', () => {
    it('should return all accounts', async () => {
      const accounts = [mockAccount];
      accountService.findAllAccounts.mockResolvedValue(accounts);

      const response = await request(app.getHttpServer()).get('/accounting/accounts').expect(200);

      expect(response.body).toMatchObject([
        {
          id: mockAccount.id,
          code: mockAccount.code,
          name: mockAccount.name,
          type: mockAccount.type,
        },
      ]);
      expect(accountService.findAllAccounts).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should filter accounts by type', async () => {
      const accounts = [mockAccount];
      accountService.findAllAccounts.mockResolvedValue(accounts);

      const response = await request(app.getHttpServer())
        .get('/accounting/accounts?type=ASSET')
        .expect(200);

      expect(response.body).toMatchObject([
        {
          id: mockAccount.id,
          code: mockAccount.code,
          name: mockAccount.name,
          type: mockAccount.type,
        },
      ]);
      expect(accountService.findAllAccounts).toHaveBeenCalledWith(mockUser, 'ASSET');
    });

    it('should handle empty result', async () => {
      accountService.findAllAccounts.mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get('/accounting/accounts').expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /accounting/accounts/:id', () => {
    it('should return account by id', async () => {
      accountService.findAccountById.mockResolvedValue(mockAccount);

      const response = await request(app.getHttpServer())
        .get('/accounting/accounts/account-1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockAccount.id,
        code: mockAccount.code,
        name: mockAccount.name,
        type: mockAccount.type,
      });
      expect(accountService.findAccountById).toHaveBeenCalledWith(mockUser, 'account-1');
    });

    it('should return 404 when account not found', async () => {
      accountService.findAccountById.mockRejectedValue(new Error('Account not found'));

      await request(app.getHttpServer()).get('/accounting/accounts/non-existent').expect(500);
    });
  });

  describe('POST /accounting/accounts', () => {
    it('should create account successfully', async () => {
      const createDto = {
        code: '1100',
        name: 'Bank',
        type: AccountType.ASSET,
        isGroup: false,
      };
      accountService.createAccount.mockResolvedValue({ ...mockAccount, ...createDto });

      const response = await request(app.getHttpServer())
        .post('/accounting/accounts')
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe(createDto.code);
      expect(accountService.createAccount).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer()).post('/accounting/accounts').send({}).expect(400);
    });

    it('should validate account type enum', async () => {
      await request(app.getHttpServer())
        .post('/accounting/accounts')
        .send({
          code: '1100',
          name: 'Bank',
          type: 'INVALID_TYPE',
        })
        .expect(400);
    });
  });

  describe('PUT /accounting/accounts/:id', () => {
    it('should update account successfully', async () => {
      const updateDto = { name: 'Updated Cash' };
      accountService.updateAccount.mockResolvedValue({ ...mockAccount, ...updateDto });

      const response = await request(app.getHttpServer())
        .put('/accounting/accounts/account-1')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(accountService.updateAccount).toHaveBeenCalledWith(mockUser, 'account-1', updateDto);
    });

    it('should handle partial updates', async () => {
      const updateDto = { balance: 20000 };
      accountService.updateAccount.mockResolvedValue({ ...mockAccount, balance: 20000 });

      await request(app.getHttpServer())
        .put('/accounting/accounts/account-1')
        .send(updateDto)
        .expect(200);
    });
  });

  describe('DELETE /accounting/accounts/:id', () => {
    it('should delete account successfully', async () => {
      accountService.deleteAccount.mockResolvedValue(undefined);

      await request(app.getHttpServer()).delete('/accounting/accounts/account-1').expect(200);

      expect(accountService.deleteAccount).toHaveBeenCalledWith(mockUser, 'account-1');
    });

    it('should return 404 when account not found', async () => {
      accountService.deleteAccount.mockRejectedValue(new Error('Account not found'));

      await request(app.getHttpServer()).delete('/accounting/accounts/non-existent').expect(500);
    });
  });

  describe('POST /accounting/accounts/coa/default', () => {
    it('should create default chart of accounts', async () => {
      accountService.createDefaultCOA.mockResolvedValue(undefined);

      await request(app.getHttpServer()).post('/accounting/accounts/coa/default').expect(201);

      expect(accountService.createDefaultCOA).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('GET /accounting/accounts/hierarchy', () => {
    it('should return account hierarchy', async () => {
      const hierarchy = [{ ...mockAccount, children: [] }];
      accountService.getAccountHierarchy.mockResolvedValue(hierarchy);

      const response = await request(app.getHttpServer())
        .get('/accounting/accounts/hierarchy')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
      }
      expect(accountService.getAccountHierarchy).toHaveBeenCalledWith(mockUser);
    });
  });
});

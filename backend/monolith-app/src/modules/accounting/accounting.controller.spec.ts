import { Test, TestingModule } from '@nestjs/testing';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AccountType } from './entities/account.entity';
import { InvoiceType } from './entities/invoice.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

describe('AccountingController', () => {
  let controller: AccountingController;
  let service: AccountingService;

  const mockAccountingService = {
    findAllAccounts: jest.fn(),
    findAccountById: jest.fn(),
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
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

  const mockTenantId = 'tenant-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountingController],
      providers: [
        {
          provide: AccountingService,
          useValue: mockAccountingService,
        },
      ],
    }).compile();

    controller = module.get<AccountingController>(AccountingController);
    service = module.get<AccountingService>(AccountingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Chart of Accounts', () => {
    describe('findAllAccounts', () => {
      it('should return all accounts', async () => {
        const mockAccounts = [
          { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET },
          { id: '2', code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
        ];
        mockAccountingService.findAllAccounts.mockResolvedValue(mockAccounts);

        const result = await controller.findAllAccounts(mockTenantId);

        expect(result).toEqual(mockAccounts);
        expect(service.findAllAccounts).toHaveBeenCalledWith(mockTenantId, undefined);
      });

      it('should return accounts filtered by type', async () => {
        const mockAccounts = [
          { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET },
        ];
        mockAccountingService.findAllAccounts.mockResolvedValue(mockAccounts);

        const result = await controller.findAllAccounts(mockTenantId, AccountType.ASSET);

        expect(result).toEqual(mockAccounts);
        expect(service.findAllAccounts).toHaveBeenCalledWith(mockTenantId, AccountType.ASSET);
      });
    });

    describe('findAccountById', () => {
      it('should return account by id', async () => {
        const mockAccount = { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET };
        mockAccountingService.findAccountById.mockResolvedValue(mockAccount);

        const result = await controller.findAccountById('1', mockTenantId);

        expect(result).toEqual(mockAccount);
        expect(service.findAccountById).toHaveBeenCalledWith('1', mockTenantId);
      });
    });

    describe('createAccount', () => {
      it('should create account', async () => {
        const dto: CreateAccountDto = {
          code: '1000',
          name: 'Cash',
          type: AccountType.ASSET,
          description: 'Cash account',
        };
        const mockAccount = { id: '1', ...dto };
        mockAccountingService.createAccount.mockResolvedValue(mockAccount);

        const result = await controller.createAccount(dto, mockTenantId);

        expect(result).toEqual(mockAccount);
        expect(service.createAccount).toHaveBeenCalledWith(dto, mockTenantId);
      });
    });

    describe('updateAccount', () => {
      it('should update account', async () => {
        const dto: UpdateAccountDto = {
          name: 'Updated Cash',
          description: 'Updated description',
        };
        const mockAccount = { id: '1', code: '1000', ...dto };
        mockAccountingService.updateAccount.mockResolvedValue(mockAccount);

        const result = await controller.updateAccount('1', dto, mockTenantId);

        expect(result).toEqual(mockAccount);
        expect(service.updateAccount).toHaveBeenCalledWith('1', dto, mockTenantId);
      });
    });

    describe('deleteAccount', () => {
      it('should delete account', async () => {
        mockAccountingService.deleteAccount.mockResolvedValue(undefined);

        const result = await controller.deleteAccount('1', mockTenantId);

        expect(result).toBeUndefined();
        expect(service.deleteAccount).toHaveBeenCalledWith('1', mockTenantId);
      });
    });
  });

  describe('Journal Entries', () => {
    describe('findAllJournalEntries', () => {
      it('should return all journal entries', async () => {
        const mockEntries = [
          { id: '1', date: new Date(), description: 'Entry 1' },
          { id: '2', date: new Date(), description: 'Entry 2' },
        ];
        mockAccountingService.findAllJournalEntries.mockResolvedValue(mockEntries);

        const result = await controller.findAllJournalEntries(mockTenantId);

        expect(result).toEqual(mockEntries);
        expect(service.findAllJournalEntries).toHaveBeenCalledWith(mockTenantId, undefined, undefined);
      });

      it('should return journal entries filtered by date range', async () => {
        const startDate = '2024-01-01';
        const endDate = '2024-01-31';
        const mockEntries = [{ id: '1', date: new Date('2024-01-15'), description: 'Entry 1' }];
        mockAccountingService.findAllJournalEntries.mockResolvedValue(mockEntries);

        const result = await controller.findAllJournalEntries(mockTenantId, startDate, endDate);

        expect(result).toEqual(mockEntries);
        expect(service.findAllJournalEntries).toHaveBeenCalledWith(
          mockTenantId,
          new Date(startDate),
          new Date(endDate),
        );
      });
    });

    describe('findJournalEntryById', () => {
      it('should return journal entry by id', async () => {
        const mockEntry = { id: '1', date: new Date(), description: 'Entry 1' };
        mockAccountingService.findJournalEntryById.mockResolvedValue(mockEntry);

        const result = await controller.findJournalEntryById('1', mockTenantId);

        expect(result).toEqual(mockEntry);
        expect(service.findJournalEntryById).toHaveBeenCalledWith('1', mockTenantId);
      });
    });

    describe('createJournalEntry', () => {
      it('should create journal entry', async () => {
        const dto: CreateJournalEntryDto = {
          entryDate: new Date(),
          description: 'Test entry',
          lines: [
            { accountId: '1', debit: 1000, credit: 0 },
            { accountId: '2', debit: 0, credit: 1000 },
          ],
        };
        const mockEntry = { id: '1', ...dto };
        mockAccountingService.createJournalEntry.mockResolvedValue(mockEntry);

        const result = await controller.createJournalEntry(dto, mockTenantId);

        expect(result).toEqual(mockEntry);
        expect(service.createJournalEntry).toHaveBeenCalledWith(dto, mockTenantId);
      });
    });

    describe('postJournalEntry', () => {
      it('should post journal entry', async () => {
        const mockEntry = { id: '1', posted: true };
        mockAccountingService.postJournalEntry.mockResolvedValue(mockEntry);

        const result = await controller.postJournalEntry('1', mockTenantId);

        expect(result).toEqual(mockEntry);
        expect(service.postJournalEntry).toHaveBeenCalledWith('1', mockTenantId);
      });
    });
  });

  describe('Invoices', () => {
    describe('findAllInvoices', () => {
      it('should return all invoices', async () => {
        const mockInvoices = [
          { id: '1', number: 'INV-001', type: InvoiceType.SALES },
          { id: '2', number: 'INV-002', type: InvoiceType.PURCHASE },
        ];
        mockAccountingService.findAllInvoices.mockResolvedValue(mockInvoices);

        const result = await controller.findAllInvoices(mockTenantId);

        expect(result).toEqual(mockInvoices);
        expect(service.findAllInvoices).toHaveBeenCalledWith(mockTenantId, undefined);
      });

      it('should return invoices filtered by type', async () => {
        const mockInvoices = [{ id: '1', number: 'INV-001', type: InvoiceType.SALES }];
        mockAccountingService.findAllInvoices.mockResolvedValue(mockInvoices);

        const result = await controller.findAllInvoices(mockTenantId, InvoiceType.SALES);

        expect(result).toEqual(mockInvoices);
        expect(service.findAllInvoices).toHaveBeenCalledWith(mockTenantId, InvoiceType.SALES);
      });
    });

    describe('findInvoiceById', () => {
      it('should return invoice by id', async () => {
        const mockInvoice = { id: '1', number: 'INV-001', type: InvoiceType.SALES };
        mockAccountingService.findInvoiceById.mockResolvedValue(mockInvoice);

        const result = await controller.findInvoiceById('1', mockTenantId);

        expect(result).toEqual(mockInvoice);
        expect(service.findInvoiceById).toHaveBeenCalledWith('1', mockTenantId);
      });
    });

    describe('createInvoice', () => {
      it('should create invoice', async () => {
        const data = {
          number: 'INV-001',
          type: InvoiceType.SALES,
          customerId: 'customer-123',
          total: 1000,
        };
        const mockInvoice = { id: '1', ...data };
        mockAccountingService.createInvoice.mockResolvedValue(mockInvoice);

        const result = await controller.createInvoice(data, mockTenantId);

        expect(result).toEqual(mockInvoice);
        expect(service.createInvoice).toHaveBeenCalledWith(data, mockTenantId);
      });
    });

    describe('updateInvoice', () => {
      it('should update invoice', async () => {
        const data = { total: 1500 };
        const mockInvoice = { id: '1', number: 'INV-001', ...data };
        mockAccountingService.updateInvoice.mockResolvedValue(mockInvoice);

        const result = await controller.updateInvoice('1', data, mockTenantId);

        expect(result).toEqual(mockInvoice);
        expect(service.updateInvoice).toHaveBeenCalledWith('1', data, mockTenantId);
      });
    });

    describe('deleteInvoice', () => {
      it('should delete invoice', async () => {
        mockAccountingService.deleteInvoice.mockResolvedValue(undefined);

        const result = await controller.deleteInvoice('1', mockTenantId);

        expect(result).toBeUndefined();
        expect(service.deleteInvoice).toHaveBeenCalledWith('1', mockTenantId);
      });
    });
  });

  describe('Financial Reports', () => {
    describe('getBalanceSheet', () => {
      it('should return balance sheet', async () => {
        const asOfDate = '2024-01-31';
        const mockBalanceSheet = {
          assets: {
            current: 10000,
            fixed: 50000,
            total: 60000,
          },
          liabilities: {
            current: 5000,
            longTerm: 20000,
            total: 25000,
          },
          equity: 35000,
        };
        mockAccountingService.getBalanceSheet.mockResolvedValue(mockBalanceSheet);

        const result = await controller.getBalanceSheet(mockTenantId, asOfDate);

        expect(result).toEqual(mockBalanceSheet);
        expect(service.getBalanceSheet).toHaveBeenCalledWith(mockTenantId, new Date(asOfDate));
      });

      it('should use current date if asOfDate not provided', async () => {
        const mockBalanceSheet = { assets: {}, liabilities: {}, equity: 0 };
        mockAccountingService.getBalanceSheet.mockResolvedValue(mockBalanceSheet);

        await controller.getBalanceSheet(mockTenantId, undefined);

        expect(service.getBalanceSheet).toHaveBeenCalledWith(
          mockTenantId,
          expect.any(Date),
        );
      });
    });

    describe('getProfitAndLoss', () => {
      it('should return profit and loss statement', async () => {
        const startDate = '2024-01-01';
        const endDate = '2024-01-31';
        const mockProfitLoss = {
          revenue: 50000,
          expenses: 30000,
          netIncome: 20000,
        };
        mockAccountingService.getProfitAndLoss.mockResolvedValue(mockProfitLoss);

        const result = await controller.getProfitAndLoss(mockTenantId, startDate, endDate);

        expect(result).toEqual(mockProfitLoss);
        expect(service.getProfitAndLoss).toHaveBeenCalledWith(
          mockTenantId,
          new Date(startDate),
          new Date(endDate),
        );
      });
    });
  });
});

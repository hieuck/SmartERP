/**
 * ReportsController Integration Tests
 * Coverage target: 95%
 *
 * Test cases:
 * 1. GET /accounting/reports/trial-balance - Get trial balance report
 * 2. GET /accounting/reports/general-ledger - Get general ledger report
 * 3. GET /accounting/reports/cash-flow - Get cash flow statement
 * 4. GET /accounting/reports/sales-summary - Get sales summary report
 * 5. GET /accounting/reports/inventory-summary - Get inventory summary
 * 6. GET /accounting/reports/inventory-valuation - Get inventory valuation
 * 7. GET /accounting/reports/inventory-movement - Get inventory movement
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';

describe('ReportsController (Integration)', () => {
  let app: INestApplication;
  let reportsService: jest.Mocked<ReportsService>;

  const mockUser = {
    id: 'user-123',
    email: 'accountant@example.com',
    tenantId: 'tenant-123',
    roles: ['accountant'],
  };

  const mockTrialBalance = {
    asOfDate: new Date('2024-01-31'),
    accounts: [
      { code: 'acc-1', name: 'Cash', debit: 10000, credit: 0 },
      { code: 'acc-2', name: 'Revenue', debit: 0, credit: 50000 },
    ],
    totalDebit: 60000,
    totalCredit: 60000,
    isBalanced: true,
  };

  const mockGeneralLedger = {
    account: {
      code: 'ACC-001',
      name: 'Cash',
      type: 'ASSET' as any,
    },
    period: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    },
    openingBalance: 10000,
    transactions: [
      {
        date: new Date('2024-01-15'),
        reference: 'JE-001',
        description: 'Payment',
        debit: 5000,
        credit: 0,
        balance: 15000,
      },
    ],
    closingBalance: 15000,
  };

  beforeAll(async () => {
    const mockReportsService = {
      getTrialBalance: jest.fn(),
      getGeneralLedger: jest.fn(),
      getCashFlowStatement: jest.fn(),
      getSalesSummary: jest.fn(),
      getInventorySummary: jest.fn(),
      getInventoryValuation: jest.fn(),
      getInventoryMovement: jest.fn(),
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    reportsService = moduleFixture.get(ReportsService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /accounting/reports/trial-balance', () => {
    it('should return trial balance report', async () => {
      reportsService.getTrialBalance.mockResolvedValue(mockTrialBalance);

      const response = await request(app.getHttpServer())
        .get('/accounting/reports/trial-balance')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTrialBalance);
      expect(reportsService.getTrialBalance).toHaveBeenCalledWith(mockUser, expect.any(Date));
    });

    it('should accept custom asOfDate parameter', async () => {
      reportsService.getTrialBalance.mockResolvedValue(mockTrialBalance);

      await request(app.getHttpServer())
        .get('/accounting/reports/trial-balance?asOfDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(reportsService.getTrialBalance).toHaveBeenCalledWith(mockUser, new Date('2024-01-31'));
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/accounting/reports/trial-balance').expect(401);
    });
  });

  describe('GET /accounting/reports/general-ledger', () => {
    it('should return general ledger report', async () => {
      reportsService.getGeneralLedger.mockResolvedValue(mockGeneralLedger);

      const response = await request(app.getHttpServer())
        .get(
          '/accounting/reports/general-ledger?accountId=acc-1&startDate=2024-01-01&endDate=2024-01-31',
        )
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockGeneralLedger);
      expect(reportsService.getGeneralLedger).toHaveBeenCalledWith(
        mockUser,
        'acc-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should validate required parameters', async () => {
      await request(app.getHttpServer())
        .get('/accounting/reports/general-ledger')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('GET /accounting/reports/cash-flow', () => {
    it('should return cash flow statement', async () => {
      const mockCashFlow = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        operatingActivities: 10000,
        investingActivities: -5000,
        financingActivities: 2000,
        netCashFlow: 7000,
      };

      reportsService.getCashFlowStatement.mockResolvedValue(mockCashFlow);

      const response = await request(app.getHttpServer())
        .get('/accounting/reports/cash-flow?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockCashFlow);
    });

    it('should validate required date parameters', async () => {
      await request(app.getHttpServer())
        .get('/accounting/reports/cash-flow')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('GET /accounting/reports/sales-summary', () => {
    it('should return sales summary report', async () => {
      const mockSalesSummary = {
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        totalSales: 100000,
        totalInvoices: 50,
        totalPaid: 80000,
        totalOutstanding: 20000,
        averageOrderValue: 2000,
        salesByCustomer: [
          {
            customerId: 'cust-1',
            customerName: 'Customer A',
            totalSales: 50000,
            invoiceCount: 25,
          },
        ],
      };

      reportsService.getSalesSummary.mockResolvedValue(mockSalesSummary);

      const response = await request(app.getHttpServer())
        .get('/accounting/reports/sales-summary?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockSalesSummary);
    });

    it('should accept optional customerId parameter', async () => {
      reportsService.getSalesSummary.mockResolvedValue({} as any);

      await request(app.getHttpServer())
        .get(
          '/accounting/reports/sales-summary?startDate=2024-01-01&endDate=2024-01-31&customerId=cust-123',
        )
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(reportsService.getSalesSummary).toHaveBeenCalledWith(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'cust-123',
      );
    });
  });

  describe('GET /accounting/reports/inventory-summary', () => {
    it('should return inventory summary report', async () => {
      const mockInventorySummary = {
        products: [
          {
            productId: 'prod-1',
            sku: 'SKU-001',
            name: 'Product A',
            quantity: 100,
            cost: 100,
            value: 10000,
            minLevel: 10,
            maxLevel: 200,
            status: 'active',
          },
          {
            productId: 'prod-2',
            sku: 'SKU-002',
            name: 'Product B',
            quantity: 50,
            cost: 100,
            value: 5000,
            minLevel: 5,
            maxLevel: 100,
            status: 'active',
          },
        ],
        totalProducts: 2,
        totalValue: 15000,
        lowStockCount: 0,
      };

      reportsService.getInventorySummary.mockResolvedValue(mockInventorySummary);

      const response = await request(app.getHttpServer())
        .get('/accounting/reports/inventory-summary')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockInventorySummary);
    });

    it('should accept optional filters', async () => {
      const emptyInventorySummary = {
        products: [],
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0,
      };
      reportsService.getInventorySummary.mockResolvedValue(emptyInventorySummary);

      await request(app.getHttpServer())
        .get(
          '/accounting/reports/inventory-summary?productId=prod-1&categoryId=cat-1&lowStockOnly=true',
        )
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(reportsService.getInventorySummary).toHaveBeenCalledWith(
        mockUser,
        'prod-1',
        'cat-1',
        'true',
      );
    });
  });

  describe('GET /accounting/reports/inventory-valuation', () => {
    it('should return inventory valuation report', async () => {
      const mockValuation = {
        products: [
          {
            productId: 'prod-1',
            sku: 'SKU-001',
            name: 'Product A',
            quantity: 100,
            cost: 100,
            totalValue: 10000,
          },
        ],
        totalValue: 10000,
      };

      reportsService.getInventoryValuation.mockResolvedValue(mockValuation);

      const response = await request(app.getHttpServer())
        .get('/accounting/reports/inventory-valuation')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockValuation);
    });

    it('should accept optional productId and warehouseId', async () => {
      reportsService.getInventoryValuation.mockResolvedValue({} as any);

      await request(app.getHttpServer())
        .get('/accounting/reports/inventory-valuation?productId=prod-1&warehouseId=wh-1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(reportsService.getInventoryValuation).toHaveBeenCalledWith(mockUser, 'prod-1', 'wh-1');
    });
  });

  describe('GET /accounting/reports/inventory-movement', () => {
    it('should return inventory movement report', async () => {
      const mockMovement = {
        movements: [
          {
            productId: 'prod-1',
            sku: 'SKU-001',
            name: 'Product A',
            movementType: 'in',
            quantity: 50,
            date: new Date('2024-01-15'),
            reference: 'PO-001',
          },
        ],
        totalMovements: 1,
        totalQuantityIn: 50,
        totalQuantityOut: 0,
      };

      reportsService.getInventoryMovement.mockResolvedValue(mockMovement);

      const response = await request(app.getHttpServer())
        .get('/accounting/reports/inventory-movement?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockMovement);
    });

    it('should validate required date parameters', async () => {
      await request(app.getHttpServer())
        .get('/accounting/reports/inventory-movement')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should accept optional productId and warehouseId', async () => {
      reportsService.getInventoryMovement.mockResolvedValue({} as any);

      await request(app.getHttpServer())
        .get(
          '/accounting/reports/inventory-movement?startDate=2024-01-01&endDate=2024-01-31&productId=prod-1&warehouseId=wh-1',
        )
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(reportsService.getInventoryMovement).toHaveBeenCalledWith(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'prod-1',
        'wh-1',
      );
    });
  });
});

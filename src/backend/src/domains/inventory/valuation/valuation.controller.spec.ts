/**
 * ValuationController Integration Tests
 * Coverage target: 95%+
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ValuationController } from './valuation.controller';
import { ValuationService } from './valuation.service';

describe('ValuationController (Integration)', () => {
  let app: INestApplication;
  let valuationService: jest.Mocked<ValuationService>;

  const __mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };

  beforeAll(async () => {
    const mockValuationService = {
      calculateFIFO: jest.fn(),
      addStockValuation: jest.fn(),
      getAverageCost: jest.fn(),
      getValuationReport: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ValuationController],
      providers: [{ provide: ValuationService, useValue: mockValuationService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    valuationService = moduleFixture.get(ValuationService);
  });

  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /inventory/valuation/calculate-fifo', () => {
    it('should calculate FIFO cost', async () => {
      const fifoResult = { totalCost: 5000000, items: [] };
      valuationService.calculateFIFO.mockResolvedValue(fifoResult as any);
      const response = await request(app.getHttpServer())
        .post('/inventory/valuation/calculate-fifo')
        .send({ productId: 'prod-123', warehouseId: 'wh-123', quantity: 10 })
        .expect(201);
      expect(response.body).toEqual(fifoResult);
    });
  });

  describe('POST /inventory/valuation/add', () => {
    it('should add stock valuation', async () => {
      const valuation = { id: 'val-123', productId: 'prod-123', quantity: 10, unitCost: 500000 };
      valuationService.addStockValuation.mockResolvedValue(valuation as any);
      const response = await request(app.getHttpServer())
        .post('/inventory/valuation/add')
        .send({
          productId: 'prod-123',
          warehouseId: 'wh-123',
          quantity: 10,
          unitCost: 500000,
          referenceType: 'PURCHASE',
          referenceId: 'po-123',
        })
        .expect(201);
      expect(response.body).toEqual(valuation);
    });
  });

  describe('GET /inventory/valuation/average-cost/:productId/:warehouseId', () => {
    it('should get average cost', async () => {
      valuationService.getAverageCost.mockResolvedValue(550000);
      const response = await request(app.getHttpServer())
        .get('/inventory/valuation/average-cost/prod-123/wh-123')
        .expect(200);
      expect(response.body.averageCost).toBe(550000);
    });
  });

  describe('GET /inventory/valuation/report/:productId/:warehouseId', () => {
    it('should get valuation report', async () => {
      const report = {
        productId: 'prod-123',
        totalQuantity: 100,
        totalValue: 50000000,
        averageCost: 500000,
      };
      valuationService.getValuationReport.mockResolvedValue(report as any);
      const response = await request(app.getHttpServer())
        .get('/inventory/valuation/report/prod-123/wh-123')
        .expect(200);
      expect(response.body).toEqual(report);
    });
  });
});

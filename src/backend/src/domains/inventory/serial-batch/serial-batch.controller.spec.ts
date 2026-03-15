/**
 * SerialBatchController Integration Tests
 * Coverage target: 95%+
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { SerialBatchController } from './serial-batch.controller';
import { SerialBatchService } from './serial-batch.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('SerialBatchController (Integration)', () => {
  let app: INestApplication;
  let serialBatchService: jest.Mocked<SerialBatchService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };
  const mockSerial = {
    id: 'sn-123',
    serialNumber: 'SN-001',
    productId: 'prod-123',
    status: 'AVAILABLE',
    tenantId: 'tenant-123',
  };
  const mockBatch = {
    id: 'batch-123',
    batchNumber: 'BATCH-001',
    productId: 'prod-123',
    quantity: 100,
    tenantId: 'tenant-123',
  };

  beforeAll(async () => {
    const mockSerialBatchService = {
      createSerialNumber: jest.fn(),
      createBatch: jest.fn(),
      getSerialNumbersByProduct: jest.fn(),
      getBatchesByProduct: jest.fn(),
      getBatchStockByWarehouse: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (
          authHeader &&
          authHeader.startsWith('Bearer ') &&
          authHeader !== 'Bearer invalid-token'
        ) {
          request.user = mockUser;
          return true;
        }
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SerialBatchController],
      providers: [{ provide: SerialBatchService, useValue: mockSerialBatchService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    serialBatchService = moduleFixture.get(SerialBatchService);
  });

  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /serial-batch/serial', () => {
    it('should create serial number', async () => {
      serialBatchService.createSerialNumber.mockResolvedValue(mockSerial as any);
      const response = await request(app.getHttpServer())
        .post('/serial-batch/serial')
        .set('Authorization', 'Bearer valid-token')
        .send({ serialNumber: 'SN-002', productId: 'prod-123' })
        .expect(201);
      expect(response.body).toEqual(mockSerial);
    });

    it('should return 400 when serial exists', async () => {
      serialBatchService.createSerialNumber.mockRejectedValue(
        new HttpException('Serial number already exists', HttpStatus.BAD_REQUEST),
      );
      await request(app.getHttpServer())
        .post('/serial-batch/serial')
        .set('Authorization', 'Bearer valid-token')
        .send({ serialNumber: 'SN-001', productId: 'prod-123' })
        .expect(400);
    });

    it('should return 404 when product not found', async () => {
      serialBatchService.createSerialNumber.mockRejectedValue(
        new HttpException('Product not found', HttpStatus.NOT_FOUND),
      );
      await request(app.getHttpServer())
        .post('/serial-batch/serial')
        .set('Authorization', 'Bearer valid-token')
        .send({ serialNumber: 'SN-002', productId: 'prod-999' })
        .expect(404);
    });
  });

  describe('POST /serial-batch/batch', () => {
    it('should create batch', async () => {
      serialBatchService.createBatch.mockResolvedValue(mockBatch as any);
      const response = await request(app.getHttpServer())
        .post('/serial-batch/batch')
        .set('Authorization', 'Bearer valid-token')
        .send({ batchNumber: 'BATCH-002', productId: 'prod-123', quantity: 50 })
        .expect(201);
      expect(response.body).toEqual(mockBatch);
    });

    it('should return 400 when batch exists', async () => {
      serialBatchService.createBatch.mockRejectedValue(
        new HttpException('Batch number already exists', HttpStatus.BAD_REQUEST),
      );
      await request(app.getHttpServer())
        .post('/serial-batch/batch')
        .set('Authorization', 'Bearer valid-token')
        .send({ batchNumber: 'BATCH-001', productId: 'prod-123' })
        .expect(400);
    });
  });

  describe('GET /serial-batch/serial/product/:productId', () => {
    it('should get serial numbers by product', async () => {
      serialBatchService.getSerialNumbersByProduct.mockResolvedValue([mockSerial] as any);
      const response = await request(app.getHttpServer())
        .get('/serial-batch/serial/product/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toEqual([mockSerial]);
    });
  });

  describe('GET /serial-batch/batch/product/:productId', () => {
    it('should get batches by product', async () => {
      serialBatchService.getBatchesByProduct.mockResolvedValue([mockBatch] as any);
      const response = await request(app.getHttpServer())
        .get('/serial-batch/batch/product/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toEqual([mockBatch]);
    });
  });

  describe('GET /serial-batch/batch/:batchId/warehouse/:warehouseId', () => {
    it('should get batch stock by warehouse', async () => {
      const stock = { batchId: 'batch-123', warehouseId: 'wh-123', quantity: 50 };
      serialBatchService.getBatchStockByWarehouse.mockResolvedValue(stock as any);
      const response = await request(app.getHttpServer())
        .get('/serial-batch/batch/batch-123/warehouse/wh-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toEqual(stock);
    });
  });
});

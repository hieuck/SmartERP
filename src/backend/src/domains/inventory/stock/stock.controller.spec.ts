/**
 * StockController Integration Tests
 * Coverage target: 95%+
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

describe('StockController (Integration)', () => {
  let app: INestApplication;
  let stockService: jest.Mocked<StockService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };
  const mockStock = {
    id: 'stock-123',
    productId: 'prod-123',
    warehouseId: 'wh-123',
    quantity: 100,
    reservedQuantity: 10,
    availableQuantity: 90,
    tenantId: 'tenant-123',
  };

  beforeAll(async () => {
    const mockStockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByProduct: jest.fn(),
      findByWarehouse: jest.fn(),
      findByProductAndWarehouse: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      getLowStockItems: jest.fn(),
      getOutOfStockItems: jest.fn(),
      getTotalValue: jest.fn(),
      adjustQuantity: jest.fn(),
      reserve: jest.fn(),
      release: jest.fn(),
      fulfillReservation: jest.fn(),
      updateStockCount: jest.fn(),
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

    const mockTenantGuard = { canActivate: jest.fn().mockReturnValue(true) };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [{ provide: StockService, useValue: mockStockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    stockService = moduleFixture.get(StockService);
  });

  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /stock', () => {
    it('should create stock', async () => {
      stockService.create.mockResolvedValue(mockStock as any);
      const response = await request(app.getHttpServer())
        .post('/stock')
        .set('Authorization', 'Bearer valid-token')
        .send({ productId: 'prod-123', warehouseId: 'wh-123', quantity: 100 })
        .expect(201);
      expect(response.body).toEqual(mockStock);
    });
  });

  describe('GET /stock', () => {
    it('should get all stock', async () => {
      stockService.findAll.mockResolvedValue([mockStock] as any);
      await request(app.getHttpServer())
        .get('/stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should filter by productId', async () => {
      stockService.findByProduct.mockResolvedValue([mockStock] as any);
      await request(app.getHttpServer())
        .get('/stock?productId=prod-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(stockService.findByProduct).toHaveBeenCalledWith(mockUser, 'prod-123');
    });

    it('should filter by warehouseId', async () => {
      stockService.findByWarehouse.mockResolvedValue([mockStock] as any);
      await request(app.getHttpServer())
        .get('/stock?warehouseId=wh-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(stockService.findByWarehouse).toHaveBeenCalledWith(mockUser, 'wh-123');
    });
  });

  describe('GET /stock/count', () => {
    it('should get stock count', async () => {
      stockService.count.mockResolvedValue(50);
      const response = await request(app.getHttpServer())
        .get('/stock/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toBe(50);
    });
  });

  describe('GET /stock/low-stock', () => {
    it('should get low stock items', async () => {
      stockService.getLowStockItems.mockResolvedValue([mockStock] as any);
      await request(app.getHttpServer())
        .get('/stock/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /stock/out-of-stock', () => {
    it('should get out of stock items', async () => {
      stockService.getOutOfStockItems.mockResolvedValue([mockStock] as any);
      await request(app.getHttpServer())
        .get('/stock/out-of-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /stock/total-value', () => {
    it('should get total inventory value', async () => {
      stockService.getTotalValue.mockResolvedValue(5000000);
      const response = await request(app.getHttpServer())
        .get('/stock/total-value')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body).toBe(5000000);
    });
  });

  describe('GET /stock/product/:productId/warehouse/:warehouseId', () => {
    it('should get stock by product and warehouse', async () => {
      stockService.findByProductAndWarehouse.mockResolvedValue(mockStock as any);
      await request(app.getHttpServer())
        .get('/stock/product/prod-123/warehouse/wh-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /stock/:id', () => {
    it('should get stock by ID', async () => {
      stockService.findOne.mockResolvedValue(mockStock as any);
      await request(app.getHttpServer())
        .get('/stock/stock-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should return 404 when not found', async () => {
      stockService.findOne.mockRejectedValue(
        new HttpException('Stock not found', HttpStatus.NOT_FOUND),
      );
      await request(app.getHttpServer())
        .get('/stock/stock-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PUT /stock/:id', () => {
    it('should update stock', async () => {
      const updated = { ...mockStock, quantity: 150 };
      stockService.update.mockResolvedValue(updated as any);
      await request(app.getHttpServer())
        .put('/stock/stock-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 150 })
        .expect(200);
    });
  });

  describe('PATCH /stock/:id/adjust', () => {
    it('should adjust stock quantity', async () => {
      stockService.adjustQuantity.mockResolvedValue(mockStock as any);
      await request(app.getHttpServer())
        .patch('/stock/stock-123/adjust')
        .set('Authorization', 'Bearer valid-token')
        .send({ adjustment: 10, reason: 'Recount' })
        .expect(200);
    });
  });

  describe('PATCH /stock/:id/reserve', () => {
    it('should reserve stock', async () => {
      const reserved = { ...mockStock, reservedQuantity: 20 };
      stockService.reserve.mockResolvedValue(reserved as any);
      await request(app.getHttpServer())
        .patch('/stock/stock-123/reserve')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 10 })
        .expect(200);
    });
  });

  describe('PATCH /stock/:id/release', () => {
    it('should release reserved stock', async () => {
      const released = { ...mockStock, reservedQuantity: 5 };
      stockService.release.mockResolvedValue(released as any);
      await request(app.getHttpServer())
        .patch('/stock/stock-123/release')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 5 })
        .expect(200);
    });
  });

  describe('PATCH /stock/:id/fulfill', () => {
    it('should fulfill reservation', async () => {
      stockService.fulfillReservation.mockResolvedValue(mockStock as any);
      await request(app.getHttpServer())
        .patch('/stock/stock-123/fulfill')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 10 })
        .expect(200);
    });
  });

  describe('PATCH /stock/:id/count', () => {
    it('should update stock count', async () => {
      stockService.updateStockCount.mockResolvedValue(mockStock as any);
      await request(app.getHttpServer())
        .patch('/stock/stock-123/count')
        .set('Authorization', 'Bearer valid-token')
        .send({ countedQuantity: 95 })
        .expect(200);
    });
  });

  describe('DELETE /stock/:id', () => {
    it('should delete stock', async () => {
      stockService.remove.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .delete('/stock/stock-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body.message).toBe('Inventory deleted successfully');
    });
  });
});

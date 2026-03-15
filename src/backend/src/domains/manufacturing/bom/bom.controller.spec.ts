/**
 * BOMController Integration Tests
 * Coverage target: 95%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { BOMController } from './bom.controller';
import { BOMService } from './bom.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { SyncStatus } from '../../../common/enums/sync-status.enum';

describe('BOMController (Integration)', () => {
  let app: INestApplication;
  let bomService: jest.Mocked<BOMService>;

  const mockUser = {
    id: 'user-123',
    email: 'manager@example.com',
    tenantId: 'tenant-123',
    roles: ['production_manager'],
  };
  const mockBOM = {
    id: 'bom-123',
    code: 'BOM-001',
    productId: 'prod-123',
    name: 'Product BOM',
    version: 1,
    isActive: true,
    quantity: 1,
    lines: [{ id: 'line-123', materialId: 'mat-123', quantity: 2, unit: 'pcs' }],
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    syncStatus: SyncStatus.SYNCED,
  };

  beforeAll(async () => {
    const mockBOMService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByProduct: jest.fn(),
      update: jest.fn(),
      addLine: jest.fn(),
      removeLine: jest.fn(),
      calculateCosts: jest.fn(),
      remove: jest.fn(),
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
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        if (request.user && request.user.roles) {
          return true;
        }
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BOMController],
      providers: [{ provide: BOMService, useValue: mockBOMService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    bomService = moduleFixture.get(BOMService);
  });

  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /manufacturing/bom', () => {
    it('should create BOM successfully', async () => {
      bomService.create.mockResolvedValue(mockBOM as any);
      const response = await request(app.getHttpServer())
        .post('/manufacturing/bom')
        .set('Authorization', 'Bearer valid-token')
        .send({ productId: 'prod-123', name: 'New BOM', version: '1.0', quantity: 1 })
        .expect(201);
      expect(response.body.code).toBe('BOM-001');
    });

    it('should return 404 when product not found', async () => {
      bomService.create.mockRejectedValue(
        new HttpException('Product not found', HttpStatus.NOT_FOUND),
      );
      await request(app.getHttpServer())
        .post('/manufacturing/bom')
        .set('Authorization', 'Bearer valid-token')
        .send({ productId: 'non-existent', name: 'BOM', version: '1.0', quantity: 1 })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/bom')
        .send({ productId: 'prod-123' })
        .expect(401);
    });
  });

  describe('GET /manufacturing/bom/:id', () => {
    it('should return BOM by ID', async () => {
      bomService.findOne.mockResolvedValue(mockBOM as any);
      const response = await request(app.getHttpServer())
        .get('/manufacturing/bom/bom-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body.id).toBe('bom-123');
    });

    it('should return 404 when not found', async () => {
      bomService.findOne.mockRejectedValue(
        new HttpException('BOM not found', HttpStatus.NOT_FOUND),
      );
      await request(app.getHttpServer())
        .get('/manufacturing/bom/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /manufacturing/bom/product/:productId', () => {
    it('should return BOMs by product', async () => {
      bomService.findByProduct.mockResolvedValue([mockBOM] as any);
      await request(app.getHttpServer())
        .get('/manufacturing/bom/product/prod-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('PATCH /manufacturing/bom/:id', () => {
    it('should update BOM', async () => {
      bomService.update.mockResolvedValue({ ...mockBOM, name: 'Updated' } as any);
      await request(app.getHttpServer())
        .patch('/manufacturing/bom/bom-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated' })
        .expect(200);
    });
  });

  describe('POST /manufacturing/bom/:id/lines', () => {
    it('should add line to BOM', async () => {
      bomService.addLine.mockResolvedValue(mockBOM as any);
      await request(app.getHttpServer())
        .post('/manufacturing/bom/bom-123/lines')
        .set('Authorization', 'Bearer valid-token')
        .send({ materialId: 'mat-456', quantity: 3, unit: 'kg' })
        .expect(201);
    });
  });

  describe('DELETE /manufacturing/bom/:bomId/lines/:lineId', () => {
    it('should remove line from BOM', async () => {
      bomService.removeLine.mockResolvedValue(mockBOM as any);
      await request(app.getHttpServer())
        .delete('/manufacturing/bom/bom-123/lines/line-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /manufacturing/bom/:id/cost', () => {
    it('should calculate BOM cost', async () => {
      const bomWithCost = { ...mockBOM, totalCost: 150000 };
      bomService.calculateCosts.mockResolvedValue(bomWithCost as any);
      const response = await request(app.getHttpServer())
        .get('/manufacturing/bom/bom-123/cost')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body.totalCost).toBe(150000);
    });
  });

  describe('DELETE /manufacturing/bom/:id', () => {
    it('should delete BOM', async () => {
      bomService.remove.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .delete('/manufacturing/bom/bom-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      expect(response.body.message).toBe('BOM deleted successfully');
    });

    it('should return 400 when BOM in use', async () => {
      bomService.remove.mockRejectedValue(
        new HttpException('Cannot delete BOM in use', HttpStatus.BAD_REQUEST),
      );
      await request(app.getHttpServer())
        .delete('/manufacturing/bom/bom-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });
});

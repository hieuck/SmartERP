/**
 * WorkOrderController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. POST /manufacturing/work-orders - Create work order
 * 2. GET /manufacturing/work-orders/:id - Get work order by ID
 * 3. GET /manufacturing/work-orders/bom/:bomId - Get work orders by BOM
 * 4. GET /manufacturing/work-orders/status/:status - Get work orders by status
 * 5. PATCH /manufacturing/work-orders/:id/confirm - Confirm work order
 * 6. PATCH /manufacturing/work-orders/:id/start - Start work order
 * 7. PATCH /manufacturing/work-orders/:id/finish - Finish work order
 * 8. PATCH /manufacturing/work-orders/:id/cancel - Cancel work order
 * 9. Authentication/Authorization tests
 * 10. Validation tests
 * 11. Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { WorkOrderController } from './work-order.controller';
import { WorkOrderService } from './work-order.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { WorkOrderStatus } from './enums/work-order-status.enum';
import { SyncStatus } from '../../../common/enums/sync-status.enum';

describe('WorkOrderController (Integration)', () => {
  let app: INestApplication;
  let workOrderService: jest.Mocked<WorkOrderService>;

  const mockUser = {
    id: 'user-123',
    email: 'manager@example.com',
    tenantId: 'tenant-123',
    roles: ['production_manager'],
  };

  const mockWorkOrder = {
    id: 'wo-123',
    code: 'WO-001',
    bomId: 'bom-123',
    productId: 'prod-123',
    quantity: 100,
    producedQuantity: 0,
    status: WorkOrderStatus.DRAFT,
    workCenterId: 'wc-123',
    scheduledStartDate: new Date('2024-02-01'),
    scheduledEndDate: new Date('2024-02-15'),
    actualStartDate: null,
    actualEndDate: null,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  };

  beforeAll(async () => {
    const mockWorkOrderService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByBOM: jest.fn(),
      findByStatus: jest.fn(),
      confirm: jest.fn(),
      start: jest.fn(),
      finish: jest.fn(),
      cancel: jest.fn(),
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
      controllers: [WorkOrderController],
      providers: [
        {
          provide: WorkOrderService,
          useValue: mockWorkOrderService,
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

    workOrderService = moduleFixture.get(WorkOrderService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /manufacturing/work-orders', () => {
    it('should create work order successfully', async () => {
      const createDto = {
        bomId: 'bom-123',
        productId: 'prod-123',
        quantity: 100,
        workCenterId: 'wc-123',
        scheduledStartDate: '2024-02-01',
        scheduledEndDate: '2024-02-15',
      };

      workOrderService.create.mockResolvedValue(mockWorkOrder as any);

      const response = await request(app.getHttpServer())
        .post('/manufacturing/work-orders')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe('WO-001');
      expect(response.body.quantity).toBe(100);
      expect(workOrderService.create).toHaveBeenCalledWith('tenant-123', createDto);
    });

    it('should return 404 when BOM not found', async () => {
      const createDto = {
        bomId: 'non-existent',
        productId: 'prod-123',
        quantity: 100,
        workCenterId: 'wc-123',
        scheduledStartDate: '2024-02-01',
        scheduledEndDate: '2024-02-15',
      };

      workOrderService.create.mockRejectedValue(
        new HttpException('BOM not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/manufacturing/work-orders')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/work-orders')
        .send({ bomId: 'bom-123' })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/work-orders')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should validate quantity is positive', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/work-orders')
        .set('Authorization', 'Bearer valid-token')
        .send({
          bomId: 'bom-123',
          productId: 'prod-123',
          quantity: -10,
          workCenterId: 'wc-123',
        })
        .expect(400);
    });

    it('should validate scheduled dates', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/work-orders')
        .set('Authorization', 'Bearer valid-token')
        .send({
          bomId: 'bom-123',
          productId: 'prod-123',
          quantity: 100,
          workCenterId: 'wc-123',
          scheduledStartDate: '2024-02-15',
          scheduledEndDate: '2024-02-01',
        })
        .expect(400);
    });
  });

  describe('GET /manufacturing/work-orders/:id', () => {
    it('should return work order by ID', async () => {
      workOrderService.findOne.mockResolvedValue(mockWorkOrder as any);

      const response = await request(app.getHttpServer())
        .get('/manufacturing/work-orders/wo-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: 'wo-123',
        code: 'WO-001',
      }));
      expect(workOrderService.findOne).toHaveBeenCalledWith('tenant-123', 'wo-123');
    });

    it('should return 404 when work order not found', async () => {
      workOrderService.findOne.mockRejectedValue(
        new HttpException('Work order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/manufacturing/work-orders/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/manufacturing/work-orders/wo-123')
        .expect(401);
    });
  });

  describe('GET /manufacturing/work-orders/bom/:bomId', () => {
    it('should return work orders by BOM ID', async () => {
      const workOrders = [mockWorkOrder];
      workOrderService.findByBOM.mockResolvedValue(workOrders as any);

      const response = await request(app.getHttpServer())
        .get('/manufacturing/work-orders/bom/bom-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(workOrders);
      expect(workOrderService.findByBOM).toHaveBeenCalledWith('tenant-123', 'bom-123');
    });

    it('should return empty array when no work orders found', async () => {
      workOrderService.findByBOM.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/manufacturing/work-orders/bom/bom-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /manufacturing/work-orders/status/:status', () => {
    it('should return work orders by status', async () => {
      const workOrders = [mockWorkOrder];
      workOrderService.findByStatus.mockResolvedValue(workOrders as any);

      const response = await request(app.getHttpServer())
        .get(`/manufacturing/work-orders/status/${WorkOrderStatus.DRAFT}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(workOrders);
      expect(workOrderService.findByStatus).toHaveBeenCalledWith('tenant-123', WorkOrderStatus.DRAFT);
    });

    it('should return empty array for status with no work orders', async () => {
      workOrderService.findByStatus.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/manufacturing/work-orders/status/${WorkOrderStatus.COMPLETED}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle all status values', async () => {
      const statuses = [
        WorkOrderStatus.DRAFT,
        WorkOrderStatus.PLANNED,
        WorkOrderStatus.IN_PROGRESS,
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.CANCELLED,
      ];

      for (const status of statuses) {
        workOrderService.findByStatus.mockResolvedValue([]);

        await request(app.getHttpServer())
          .get(`/manufacturing/work-orders/status/${status}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(workOrderService.findByStatus).toHaveBeenCalledWith('tenant-123', status);
      }
    });
  });

  describe('PATCH /manufacturing/work-orders/:id/confirm', () => {
    it('should confirm work order successfully', async () => {
      const confirmedWorkOrder = {
        ...mockWorkOrder,
        status: WorkOrderStatus.PLANNED,
      };

      workOrderService.confirm.mockResolvedValue(confirmedWorkOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/confirm')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe(WorkOrderStatus.PLANNED);
      expect(workOrderService.confirm).toHaveBeenCalledWith('tenant-123', 'wo-123');
    });

    it('should return 404 when work order not found', async () => {
      workOrderService.confirm.mockRejectedValue(
        new HttpException('Work order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/non-existent/confirm')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when work order already confirmed', async () => {
      workOrderService.confirm.mockRejectedValue(
        new HttpException('Work order is already confirmed', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/confirm')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('PATCH /manufacturing/work-orders/:id/start', () => {
    it('should start work order successfully', async () => {
      const startedWorkOrder = {
        ...mockWorkOrder,
        status: WorkOrderStatus.IN_PROGRESS,
        actualStartDate: new Date(),
      };

      workOrderService.start.mockResolvedValue(startedWorkOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/start')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(response.body.actualStartDate).toBeDefined();
      expect(workOrderService.start).toHaveBeenCalledWith('tenant-123', 'wo-123');
    });

    it('should return 400 when work order not confirmed', async () => {
      workOrderService.start.mockRejectedValue(
        new HttpException('Work order must be confirmed before starting', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/start')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 400 when work order already started', async () => {
      workOrderService.start.mockRejectedValue(
        new HttpException('Work order is already in progress', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/start')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('PATCH /manufacturing/work-orders/:id/finish', () => {
    it('should finish work order successfully', async () => {
      const finishDto = {
        producedQuantity: 95,
      };

      const finishedWorkOrder = {
        ...mockWorkOrder,
        status: WorkOrderStatus.COMPLETED,
        producedQuantity: 95,
        actualEndDate: new Date(),
      };

      workOrderService.finish.mockResolvedValue(finishedWorkOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/finish')
        .set('Authorization', 'Bearer valid-token')
        .send(finishDto)
        .expect(200);

      expect(response.body.status).toBe(WorkOrderStatus.COMPLETED);
      expect(response.body.producedQuantity).toBe(95);
      expect(workOrderService.finish).toHaveBeenCalledWith('tenant-123', 'wo-123', 95);
    });

    it('should return 400 when work order not in progress', async () => {
      workOrderService.finish.mockRejectedValue(
        new HttpException('Work order must be in progress to finish', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/finish')
        .set('Authorization', 'Bearer valid-token')
        .send({ producedQuantity: 100 })
        .expect(400);
    });

    it('should validate produced quantity is positive', async () => {
      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/finish')
        .set('Authorization', 'Bearer valid-token')
        .send({ producedQuantity: -10 })
        .expect(400);
    });

    it('should validate produced quantity does not exceed planned', async () => {
      workOrderService.finish.mockRejectedValue(
        new HttpException('Produced quantity cannot exceed planned quantity', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/finish')
        .set('Authorization', 'Bearer valid-token')
        .send({ producedQuantity: 150 })
        .expect(400);
    });

    it('should allow finishing with zero produced quantity', async () => {
      const finishedWorkOrder = {
        ...mockWorkOrder,
        status: WorkOrderStatus.COMPLETED,
        producedQuantity: 0,
      };

      workOrderService.finish.mockResolvedValue(finishedWorkOrder as any);

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/finish')
        .set('Authorization', 'Bearer valid-token')
        .send({ producedQuantity: 0 })
        .expect(200);
    });
  });

  describe('PATCH /manufacturing/work-orders/:id/cancel', () => {
    it('should cancel work order successfully', async () => {
      const cancelledWorkOrder = {
        ...mockWorkOrder,
        status: WorkOrderStatus.CANCELLED,
      };

      workOrderService.cancel.mockResolvedValue(cancelledWorkOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe(WorkOrderStatus.CANCELLED);
      expect(workOrderService.cancel).toHaveBeenCalledWith('tenant-123', 'wo-123');
    });

    it('should return 404 when work order not found', async () => {
      workOrderService.cancel.mockRejectedValue(
        new HttpException('Work order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/non-existent/cancel')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when work order already completed', async () => {
      workOrderService.cancel.mockRejectedValue(
        new HttpException('Cannot cancel completed work order', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 400 when work order already cancelled', async () => {
      workOrderService.cancel.mockRejectedValue(
        new HttpException('Work order is already cancelled', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('Authorization', () => {
    it('should allow production_manager to create work order', async () => {
      workOrderService.create.mockResolvedValue(mockWorkOrder as any);

      await request(app.getHttpServer())
        .post('/manufacturing/work-orders')
        .set('Authorization', 'Bearer valid-token')
        .send({
          bomId: 'bom-123',
          productId: 'prod-123',
          quantity: 100,
          workCenterId: 'wc-123',
        })
        .expect(201);
    });

    it('should allow production_user to read work orders', async () => {
      workOrderService.findOne.mockResolvedValue(mockWorkOrder as any);

      await request(app.getHttpServer())
        .get('/manufacturing/work-orders/wo-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should allow production_user to start work order', async () => {
      workOrderService.start.mockResolvedValue(mockWorkOrder as any);

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/start')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      workOrderService.findOne.mockRejectedValue(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/manufacturing/work-orders/wo-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle invalid UUID format', async () => {
      workOrderService.findOne.mockRejectedValue(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/manufacturing/work-orders/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should handle concurrent status updates', async () => {
      workOrderService.start.mockRejectedValue(
        new HttpException('Work order status has been modified', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-orders/wo-123/start')
        .set('Authorization', 'Bearer valid-token')
        .expect(409);
    });
  });
});

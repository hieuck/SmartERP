/**
 * PaymentController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. GET /payments - Get all payments
 * 2. GET /payments/order/:orderId - Get payments by order
 * 3. GET /payments/status/:status - Get payments by status
 * 4. GET /payments/statistics - Get payment statistics
 * 5. GET /payments/count - Get payment count
 * 6. GET /payments/total - Get total payment amount
 * 7. GET /payments/date-range - Get payments by date range
 * 8. GET /payments/:id - Get payment by ID
 * 9. POST /payments - Create payment
 * 10. PATCH /payments/:id - Update payment
 * 11. PATCH /payments/:id/complete - Complete payment
 * 12. PATCH /payments/:id/fail - Fail payment
 * 13. PATCH /payments/:id/refund - Refund payment
 * 14. DELETE /payments/:id - Delete payment
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { SyncStatus } from '@/common/enums/sync-status.enum';

describe('PaymentController (Integration)', () => {
  let app: INestApplication;
  let paymentService: jest.Mocked<PaymentService>;

  const mockUser = {
    id: 'user-123',
    email: 'accountant@example.com',
    tenantId: 'tenant-123',
    roles: ['accountant'],
  };

  const mockPayment = {
    id: 'payment-123',
    orderId: 'order-123',
    amount: 50000,
    status: 'pending',
    paymentMethod: 'bank_transfer',
    paymentDate: new Date(),
    transactionId: null,
    currency: 'VND',
    notes: null,
    metadata: null,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  };

  beforeAll(async () => {
    const mockPaymentService = {
      findAll: jest.fn(),
      findByOrder: jest.fn(),
      findByStatus: jest.fn(),
      getPaymentStatistics: jest.fn(),
      count: jest.fn(),
      getTotalAmount: jest.fn(),
      getPaymentsByDateRange: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
      refund: jest.fn(),
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

    const mockTenantGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        if (request.user && request.user.tenantId) {
          return true;
        }
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    paymentService = moduleFixture.get(PaymentService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /payments', () => {
    it('should return all payments', async () => {
      const payments = [mockPayment];
      paymentService.findAll.mockResolvedValue(payments);

      const response = await request(app.getHttpServer())
        .get('/payments')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(payments);
      expect(paymentService.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/payments')
        .expect(401);
    });

    it('should return empty array when no payments', async () => {
      paymentService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/payments')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /payments/order/:orderId', () => {
    it('should return payments by order', async () => {
      const payments = [mockPayment];
      paymentService.findByOrder.mockResolvedValue(payments);

      const response = await request(app.getHttpServer())
        .get('/payments/order/order-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(payments);
      expect(paymentService.findByOrder).toHaveBeenCalledWith(mockUser, 'order-123');
    });

    it('should return empty array when no payments for order', async () => {
      paymentService.findByOrder.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/payments/order/order-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /payments/status/:status', () => {
    it('should return payments by status', async () => {
      const payments = [mockPayment];
      paymentService.findByStatus.mockResolvedValue(payments);

      const response = await request(app.getHttpServer())
        .get('/payments/status/pending')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(payments);
      expect(paymentService.findByStatus).toHaveBeenCalledWith(mockUser, 'pending');
    });

    it('should handle completed status', async () => {
      paymentService.findByStatus.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/payments/status/completed')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /payments/statistics', () => {
    it('should return payment statistics', async () => {
      const stats = {
        total: 100,
        completed: 85,
        pending: 10,
        failed: 5,
        refunded: 0,
        totalAmount: 5000000,
        completedAmount: 4500000,
        successRate: 85,
      };
      paymentService.getPaymentStatistics.mockResolvedValue(stats);

      const response = await request(app.getHttpServer())
        .get('/payments/statistics')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(stats);
      expect(paymentService.getPaymentStatistics).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('GET /payments/count', () => {
    it('should return payment count', async () => {
      paymentService.count.mockResolvedValue(50);

      const response = await request(app.getHttpServer())
        .get('/payments/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(50);
      expect(paymentService.count).toHaveBeenCalledWith(mockUser);
    });

    it('should return 0 when no payments', async () => {
      paymentService.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/payments/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(0);
    });
  });

  describe('GET /payments/total', () => {
    it('should return total payment amount', async () => {
      paymentService.getTotalAmount.mockResolvedValue(1000000);

      const response = await request(app.getHttpServer())
        .get('/payments/total?status=completed')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(1000000);
      expect(paymentService.getTotalAmount).toHaveBeenCalledWith(mockUser, 'completed');
    });
  });

  describe('GET /payments/date-range', () => {
    it('should return payments by date range', async () => {
      const payments = [mockPayment];
      paymentService.getPaymentsByDateRange.mockResolvedValue(payments);

      const response = await request(app.getHttpServer())
        .get('/payments/date-range?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(payments);
      expect(paymentService.getPaymentsByDateRange).toHaveBeenCalledWith(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should validate required date parameters', async () => {
      await request(app.getHttpServer())
        .get('/payments/date-range')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('GET /payments/:id', () => {
    it('should return payment by ID', async () => {
      paymentService.findOne.mockResolvedValue(mockPayment);

      const response = await request(app.getHttpServer())
        .get('/payments/payment-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockPayment);
      expect(paymentService.findOne).toHaveBeenCalledWith(mockUser, 'payment-123');
    });

    it('should return 404 when payment not found', async () => {
      paymentService.findOne.mockRejectedValue(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/payments/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('POST /payments', () => {
    it('should create payment successfully', async () => {
      const createDto = {
        orderId: 'order-456',
        amount: 75000,
        method: 'credit_card',
      };

      paymentService.create.mockResolvedValue({
        ...mockPayment,
        ...createDto,
      });

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.orderId).toBe('order-456');
      expect(paymentService.create).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 404 when order not found', async () => {
      paymentService.create.mockRejectedValue(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', 'Bearer valid-token')
        .send({ orderId: 'non-existent', amount: 1000, method: 'cash' })
        .expect(404);
    });
  });

  describe('PATCH /payments/:id', () => {
    it('should update payment successfully', async () => {
      const updateDto = { method: 'bank_transfer' };
      const updatedPayment = { ...mockPayment, ...updateDto };
      paymentService.update.mockResolvedValue(updatedPayment);

      const response = await request(app.getHttpServer())
        .patch('/payments/payment-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.method).toBe('bank_transfer');
      expect(paymentService.update).toHaveBeenCalledWith(mockUser, 'payment-123', updateDto);
    });

    it('should return 404 when payment not found', async () => {
      paymentService.update.mockRejectedValue(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/payments/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ method: 'cash' })
        .expect(404);
    });
  });

  describe('PATCH /payments/:id/complete', () => {
    it('should complete payment successfully', async () => {
      const completedPayment = { ...mockPayment, status: 'completed', transactionId: 'txn-123' };
      paymentService.complete.mockResolvedValue(completedPayment);

      const response = await request(app.getHttpServer())
        .patch('/payments/payment-123/complete')
        .set('Authorization', 'Bearer valid-token')
        .send({ transactionId: 'txn-123' })
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(paymentService.complete).toHaveBeenCalledWith(mockUser, 'payment-123', 'txn-123');
    });

    it('should return 404 when payment not found', async () => {
      paymentService.complete.mockRejectedValue(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/payments/non-existent/complete')
        .set('Authorization', 'Bearer valid-token')
        .send({ transactionId: 'txn-123' })
        .expect(404);
    });

    it('should return 400 when payment already completed', async () => {
      paymentService.complete.mockRejectedValue(
        new HttpException('Payment already completed', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/payments/payment-123/complete')
        .set('Authorization', 'Bearer valid-token')
        .send({ transactionId: 'txn-123' })
        .expect(400);
    });
  });

  describe('PATCH /payments/:id/fail', () => {
    it('should fail payment successfully', async () => {
      const failedPayment = { ...mockPayment, status: 'failed' };
      paymentService.fail.mockResolvedValue(failedPayment);

      const response = await request(app.getHttpServer())
        .patch('/payments/payment-123/fail')
        .set('Authorization', 'Bearer valid-token')
        .send({ reason: 'Insufficient funds' })
        .expect(200);

      expect(response.body.status).toBe('failed');
      expect(paymentService.fail).toHaveBeenCalledWith(mockUser, 'payment-123', 'Insufficient funds');
    });

    it('should return 404 when payment not found', async () => {
      paymentService.fail.mockRejectedValue(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/payments/non-existent/fail')
        .set('Authorization', 'Bearer valid-token')
        .send({ reason: 'Test' })
        .expect(404);
    });
  });

  describe('PATCH /payments/:id/refund', () => {
    it('should refund payment successfully', async () => {
      const refundedPayment = { ...mockPayment, status: 'refunded' };
      paymentService.refund.mockResolvedValue(refundedPayment);

      const response = await request(app.getHttpServer())
        .patch('/payments/payment-123/refund')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe('refunded');
      expect(paymentService.refund).toHaveBeenCalledWith(mockUser, 'payment-123');
    });

    it('should return 404 when payment not found', async () => {
      paymentService.refund.mockRejectedValue(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/payments/non-existent/refund')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when payment not completed', async () => {
      paymentService.refund.mockRejectedValue(
        new HttpException('Can only refund completed payments', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/payments/payment-123/refund')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 400 when payment already refunded', async () => {
      paymentService.refund.mockRejectedValue(
        new HttpException('Payment already refunded', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/payments/payment-123/refund')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('DELETE /payments/:id', () => {
    it('should delete payment successfully', async () => {
      paymentService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/payments/payment-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Payment deleted successfully');
      expect(paymentService.remove).toHaveBeenCalledWith(mockUser, 'payment-123');
    });

    it('should return 404 when payment not found', async () => {
      paymentService.remove.mockRejectedValue(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/payments/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when payment is completed', async () => {
      paymentService.remove.mockRejectedValue(
        new HttpException('Cannot delete completed payment', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/payments/payment-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });
});

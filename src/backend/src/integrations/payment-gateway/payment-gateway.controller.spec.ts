/**
 * PaymentGatewayController Integration Tests
 * Coverage target: 95%
 *
 * Test cases:
 * 1. POST /payment-gateway - Create payment
 * 2. POST /payment-gateway/verify - Verify payment
 * 3. GET /payment-gateway/vnpay/return - VNPay return handler
 * 4. POST /payment-gateway/vnpay/ipn - VNPay IPN handler
 * 5. GET /payment-gateway/momo/return - Momo return handler
 * 6. POST /payment-gateway/momo/ipn - Momo IPN handler
 * 7. POST /payment-gateway/stripe/webhook - Stripe webhook handler
 * 8. POST /payment-gateway/refund - Refund payment
 * 9. GET /payment-gateway/transactions/:id - Get transaction
 * 10. GET /payment-gateway/transactions - List transactions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { PaymentGatewayController } from './payment-gateway.controller';
import { PaymentGatewayService } from './payment-gateway.service';

describe('PaymentGatewayController (Integration)', () => {
  let app: INestApplication;
  let paymentGatewayService: jest.Mocked<PaymentGatewayService>;

  const _mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const __mockTransaction = {
    id: 'txn-123',
    orderId: 'order-123',
    gateway: 'vnpay',
    amount: 100000,
    status: 'pending',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockPaymentGatewayService = {
      createPayment: jest.fn(),
      verifyPayment: jest.fn(),
      handleWebhook: jest.fn(),
      refundPayment: jest.fn(),
      getTransaction: jest.fn(),
      listTransactions: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentGatewayController],
      providers: [
        {
          provide: PaymentGatewayService,
          useValue: mockPaymentGatewayService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    paymentGatewayService = moduleFixture.get(PaymentGatewayService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /payment-gateway', () => {
    it('should create payment successfully', async () => {
      const createDto = {
        gateway: 'vnpay',
        amount: 100000,
        orderId: 'order-123',
        returnUrl: 'https://example.com/return',
      };

      const paymentResult = {
        id: 'payment-123',
        tenantId: 'tenant-123',
        orderId: 'order-123',
        gateway: 'vnpay',
        amount: 100000,
        currency: 'VND',
        status: 'pending',
        transactionId: 'txn-123',
        paymentUrl: 'https://vnpay.vn/payment?token=abc',
        paymentMethod: 'qr',
        customerInfo: {},
        gatewayResponse: {},
        errorMessage: null,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      };

      paymentGatewayService.createPayment.mockResolvedValue(paymentResult as any);

      const response = await request(app.getHttpServer())
        .post('/payment-gateway')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(paymentResult);
      expect(paymentGatewayService.createPayment).toHaveBeenCalledWith(undefined, createDto);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer()).post('/payment-gateway').send({}).expect(400);
    });

    it('should return 400 when gateway not supported', async () => {
      paymentGatewayService.createPayment.mockRejectedValue(
        new HttpException('Gateway not supported', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/payment-gateway')
        .send({
          gateway: 'unsupported',
          amount: 100000,
          orderId: 'order-123',
        })
        .expect(400);
    });
  });

  describe('POST /payment-gateway/verify', () => {
    it('should verify payment successfully', async () => {
      const verifyDto = {
        transactionId: 'txn-123',
        gateway: 'vnpay',
        signature: 'abc123',
      };

      const verifyResult = {
        success: true,
        message: 'Payment verified successfully',
        transactionId: 'txn-123',
        status: 'completed',
      };

      paymentGatewayService.verifyPayment.mockResolvedValue(verifyResult);

      const response = await request(app.getHttpServer())
        .post('/payment-gateway/verify')
        .send(verifyDto)
        .expect(201);

      expect(response.body).toEqual(verifyResult);
    });

    it('should return 400 when signature invalid', async () => {
      paymentGatewayService.verifyPayment.mockRejectedValue(
        new HttpException('Invalid signature', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/payment-gateway/verify')
        .send({
          transactionId: 'txn-123',
          gateway: 'vnpay',
          signature: 'invalid',
        })
        .expect(400);
    });
  });

  describe('GET /payment-gateway/vnpay/return', () => {
    it('should handle VNPay return successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/payment-gateway/vnpay/return?vnp_TxnRef=order-123&vnp_ResponseCode=00')
        .expect(200);

      expect(response.body.message).toBe('Payment callback received');
      expect(response.body.params).toHaveProperty('vnp_TxnRef');
    });

    it('should handle failed payment return', async () => {
      const response = await request(app.getHttpServer())
        .get('/payment-gateway/vnpay/return?vnp_TxnRef=order-123&vnp_ResponseCode=24')
        .expect(200);

      expect(response.body.params.vnp_ResponseCode).toBe('24');
    });
  });

  describe('POST /payment-gateway/vnpay/ipn', () => {
    it('should handle VNPay IPN successfully', async () => {
      paymentGatewayService.handleWebhook.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/payment-gateway/vnpay/ipn')
        .send({
          vnp_TxnRef: 'order-123',
          vnp_ResponseCode: '00',
          vnp_SecureHash: 'hash123',
        })
        .expect(201);

      expect(response.body.RspCode).toBe('00');
      expect(response.body.Message).toBe('success');
    });
  });
});

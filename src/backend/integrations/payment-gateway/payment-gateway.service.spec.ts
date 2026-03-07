import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentWebhook } from './entities/payment-webhook.entity';
import { VNPayService } from './providers/vnpay/vnpay.service';
import { MomoService } from './providers/momo/momo.service';
import { StripeService } from './providers/stripe/stripe.service';
import { PayPalService } from './providers/paypal/paypal.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;
  let paymentTransactionRepo: Repository<PaymentTransaction>;
  let paymentWebhookRepo: Repository<PaymentWebhook>;
  let vnpayService: VNPayService;
  let momoService: MomoService;
  let stripeService: StripeService;
  let paypalService: PayPalService;

  const mockPaymentTransactionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPaymentWebhookRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockVNPayService = {
    createPaymentUrl: jest.fn(),
    verifyReturnUrl: jest.fn(),
    verifyPaymentCallback: jest.fn(),
    refundTransaction: jest.fn(),
  };

  const mockMomoService = {
    createPayment: jest.fn(),
    verifySignature: jest.fn(),
    verifyIPN: jest.fn(),
    refundTransaction: jest.fn(),
  };

  const mockStripeService = {
    createPaymentIntent: jest.fn(),
    verifyWebhookSignature: jest.fn(),
    handleWebhookEvent: jest.fn(),
    refundPayment: jest.fn(),
  };

  const mockPayPalService = {
    createOrder: jest.fn(),
    captureOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentGatewayService,
        {
          provide: getRepositoryToken(PaymentTransaction),
          useValue: mockPaymentTransactionRepo,
        },
        {
          provide: getRepositoryToken(PaymentWebhook),
          useValue: mockPaymentWebhookRepo,
        },
        {
          provide: VNPayService,
          useValue: mockVNPayService,
        },
        {
          provide: MomoService,
          useValue: mockMomoService,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: PayPalService,
          useValue: mockPayPalService,
        },
      ],
    }).compile();

    service = module.get<PaymentGatewayService>(PaymentGatewayService);
    paymentTransactionRepo = module.get<Repository<PaymentTransaction>>(
      getRepositoryToken(PaymentTransaction),
    );
    paymentWebhookRepo = module.get<Repository<PaymentWebhook>>(
      getRepositoryToken(PaymentWebhook),
    );
    vnpayService = module.get<VNPayService>(VNPayService);
    momoService = module.get<MomoService>(MomoService);
    stripeService = module.get<StripeService>(StripeService);
    paypalService = module.get<PayPalService>(PayPalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create VNPay payment successfully', async () => {
      const tenantId = 'tenant1';
      const dto: CreatePaymentDto = {
        orderId: 'order123',
        gateway: 'vnpay',
        amount: 100000,
        currency: 'VND',
        paymentMethod: 'bank_transfer',
        orderInfo: 'Test payment',
        ipAddress: '127.0.0.1',
      };

      const mockTransaction = {
        id: 'txn123',
        tenantId,
        ...dto,
        status: 'pending',
      };

      mockPaymentTransactionRepo.create.mockReturnValue(mockTransaction);
      mockPaymentTransactionRepo.save.mockResolvedValue(mockTransaction);
      mockVNPayService.createPaymentUrl.mockReturnValue('https://vnpay.vn/payment');

      const result = await service.createPayment(tenantId, dto);

      expect(result).toBeDefined();
      expect(mockPaymentTransactionRepo.create).toHaveBeenCalled();
      expect(mockPaymentTransactionRepo.save).toHaveBeenCalled();
      expect(mockVNPayService.createPaymentUrl).toHaveBeenCalled();
    });

    it('should create Momo payment successfully', async () => {
      const tenantId = 'tenant1';
      const dto: CreatePaymentDto = {
        orderId: 'order123',
        gateway: 'momo',
        amount: 100000,
        currency: 'VND',
        paymentMethod: 'momo_wallet',
        orderInfo: 'Test payment',
      };

      const mockTransaction = {
        id: 'txn123',
        tenantId,
        ...dto,
        status: 'pending',
      };

      mockPaymentTransactionRepo.create.mockReturnValue(mockTransaction);
      mockPaymentTransactionRepo.save.mockResolvedValue(mockTransaction);
      mockMomoService.createPayment.mockResolvedValue({
        payUrl: 'https://momo.vn/payment',
        qrCodeUrl: 'https://momo.vn/qr',
        deeplink: 'momo://payment',
      });

      const result = await service.createPayment(tenantId, dto);

      expect(result).toBeDefined();
      expect(mockMomoService.createPayment).toHaveBeenCalled();
    });

    it('should create Stripe payment successfully', async () => {
      const tenantId = 'tenant1';
      const dto: CreatePaymentDto = {
        orderId: 'order123',
        gateway: 'stripe',
        amount: 100,
        currency: 'USD',
        paymentMethod: 'card',
        orderInfo: 'Test payment',
        customerInfo: { email: 'test@example.com' },
      };

      const mockTransaction = {
        id: 'txn123',
        tenantId,
        ...dto,
        status: 'pending',
      };

      mockPaymentTransactionRepo.create.mockReturnValue(mockTransaction);
      mockPaymentTransactionRepo.save.mockResolvedValue(mockTransaction);
      mockStripeService.createPaymentIntent.mockResolvedValue({
        clientSecret: 'pi_secret',
        paymentIntentId: 'pi_123',
      });

      const result = await service.createPayment(tenantId, dto);

      expect(result).toBeDefined();
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalled();
    });

    it('should create PayPal payment successfully', async () => {
      const tenantId = 'tenant1';
      const dto: CreatePaymentDto = {
        orderId: 'order123',
        gateway: 'paypal',
        amount: 100,
        currency: 'USD',
        paymentMethod: 'paypal',
        orderInfo: 'Test payment',
        returnUrl: 'https://example.com/return',
        cancelUrl: 'https://example.com/cancel',
      };

      const mockTransaction = {
        id: 'txn123',
        tenantId,
        ...dto,
        status: 'pending',
      };

      mockPaymentTransactionRepo.create.mockReturnValue(mockTransaction);
      mockPaymentTransactionRepo.save.mockResolvedValue(mockTransaction);
      mockPayPalService.createOrder.mockResolvedValue({
        approvalUrl: 'https://paypal.com/approve',
        orderId: 'pp_order123',
      });

      const result = await service.createPayment(tenantId, dto);

      expect(result).toBeDefined();
      expect(mockPayPalService.createOrder).toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    it('should verify VNPay payment successfully', async () => {
      const dto = {
        transactionId: 'txn123',
        gateway: 'vnpay',
        params: { vnp_ResponseCode: '00', vnp_TxnRef: 'order123' },
      };

      const mockTransaction = {
        id: 'txn123',
        tenantId: 'tenant1',
        status: 'pending',
      };

      mockPaymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      mockVNPayService.verifyPaymentCallback.mockReturnValue({
        success: true,
        message: 'Payment verified',
        transactionId: 'vnp_txn123',
      });
      mockPaymentTransactionRepo.save.mockResolvedValue({
        ...mockTransaction,
        status: 'success',
      });

      const result = await service.verifyPayment('tenant1', dto as any);

      expect(result.success).toBe(true);
      expect(mockVNPayService.verifyPaymentCallback).toHaveBeenCalled();
      expect(mockPaymentTransactionRepo.save).toHaveBeenCalled();
    });

    it('should throw error if transaction not found', async () => {
      const dto = {
        transactionId: 'invalid',
        gateway: 'vnpay',
        params: {},
      };

      mockPaymentTransactionRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyPayment('tenant1', dto as any)).rejects.toThrow('Transaction not found');
    });

    it('should handle failed verification', async () => {
      const dto = {
        transactionId: 'txn123',
        gateway: 'momo',
        params: { resultCode: 1 },
      };

      const mockTransaction = {
        id: 'txn123',
        status: 'pending',
      };

      mockPaymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      mockMomoService.verifyIPN.mockReturnValue({
        success: false,
        message: 'Payment failed',
      });
      mockPaymentTransactionRepo.save.mockResolvedValue({
        ...mockTransaction,
        status: 'failed',
      });

      const result = await service.verifyPayment('tenant1', dto as any);

      expect(result.success).toBe(false);
      expect(result.transaction.status).toBe('failed');
    });
  });

  describe('refundPayment', () => {
    it('should refund VNPay payment successfully', async () => {
      const dto = {
        transactionId: 'txn123',
        amount: 50000,
        reason: 'Customer request',
      };

      const mockTransaction = {
        id: 'txn123',
        tenantId: 'tenant1',
        gateway: 'vnpay',
        status: 'success',
        amount: 100000,
        orderId: 'order123',
        transactionId: 'vnp_txn123',
        createdAt: new Date(),
      };

      mockPaymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      mockVNPayService.refundTransaction.mockResolvedValue({ success: true });
      mockPaymentTransactionRepo.save.mockResolvedValue({
        ...mockTransaction,
        status: 'refunded',
      });

      const result = await service.refundPayment('tenant1', dto as any);

      expect(result.status).toBe('refunded');
      expect(mockVNPayService.refundTransaction).toHaveBeenCalled();
    });

    it('should throw error if transaction not found', async () => {
      const dto = {
        transactionId: 'invalid',
      };

      mockPaymentTransactionRepo.findOne.mockResolvedValue(null);

      await expect(service.refundPayment('tenant1', dto as any)).rejects.toThrow('Transaction not found');
    });

    it('should throw error if transaction not successful', async () => {
      const dto = {
        transactionId: 'txn123',
      };

      const mockTransaction = {
        id: 'txn123',
        status: 'pending',
      };

      mockPaymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);

      await expect(service.refundPayment('tenant1', dto as any)).rejects.toThrow('Can only refund successful transactions');
    });
  });

  describe('getTransaction', () => {
    it('should get transaction by ID', async () => {
      const mockTransaction = {
        id: 'txn123',
        tenantId: 'tenant1',
        orderId: 'order123',
        status: 'success',
      };

      mockPaymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);

      const result = await service.getTransaction('tenant1', 'txn123');

      expect(result).toEqual(mockTransaction);
      expect(mockPaymentTransactionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'txn123', tenantId: 'tenant1' },
      });
    });

    it('should throw error if transaction not found', async () => {
      mockPaymentTransactionRepo.findOne.mockResolvedValue(null);

      await expect(service.getTransaction('tenant1', 'invalid')).rejects.toThrow('Transaction not found');
    });
  });

  describe('handleWebhook', () => {
    it('should handle VNPay webhook successfully', async () => {
      const tenantId = 'tenant1';
      const gateway = 'vnpay';
      const payload = { vnp_ResponseCode: '00', vnp_TxnRef: 'order123' };

      const mockTransaction = {
        id: 'txn123',
        tenantId,
        transactionId: 'vnp_txn123',
        status: 'pending',
      };

      const mockWebhook = {
        id: 'webhook123',
        gateway,
        payload,
        processed: false,
      };

      mockPaymentWebhookRepo.create.mockReturnValue(mockWebhook);
      mockPaymentWebhookRepo.save.mockResolvedValue(mockWebhook);
      mockVNPayService.verifyPaymentCallback.mockReturnValue({
        success: true,
        message: 'Payment verified',
        transactionId: 'vnp_txn123',
      });
      mockPaymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      mockPaymentTransactionRepo.save.mockResolvedValue({
        ...mockTransaction,
        status: 'success',
      });

      await service.handleWebhook(tenantId, gateway, payload);

      expect(mockPaymentWebhookRepo.create).toHaveBeenCalled();
      expect(mockPaymentWebhookRepo.save).toHaveBeenCalledTimes(2);
      expect(mockVNPayService.verifyPaymentCallback).toHaveBeenCalledWith(payload);
    });

    it('should handle Momo webhook successfully', async () => {
      const tenantId = 'tenant1';
      const gateway = 'momo';
      const payload = { resultCode: 0, orderId: 'order123' };

      mockPaymentWebhookRepo.create.mockReturnValue({});
      mockPaymentWebhookRepo.save.mockResolvedValue({});
      mockMomoService.verifyIPN.mockReturnValue({
        success: true,
        message: 'Payment verified',
        transactionId: 'momo_txn123',
      });
      mockPaymentTransactionRepo.findOne.mockResolvedValue({
        id: 'txn123',
        transactionId: 'momo_txn123',
        status: 'pending',
      });
      mockPaymentTransactionRepo.save.mockResolvedValue({});

      await service.handleWebhook(tenantId, gateway, payload);

      expect(mockMomoService.verifyIPN).toHaveBeenCalledWith(payload);
      expect(mockPaymentWebhookRepo.save).toHaveBeenCalled();
    });

    it('should handle Stripe webhook successfully', async () => {
      const tenantId = 'tenant1';
      const gateway = 'stripe';
      const payload = { type: 'payment_intent.succeeded', data: { object: { id: 'pi_123' } } };
      const signature = 'valid_signature';

      mockPaymentWebhookRepo.create.mockReturnValue({});
      mockPaymentWebhookRepo.save.mockResolvedValue({});
      mockStripeService.verifyWebhookSignature.mockReturnValue(true);
      mockStripeService.handleWebhookEvent.mockResolvedValue({
        success: true,
        message: 'Webhook processed',
        transactionId: 'pi_123',
      });
      mockPaymentTransactionRepo.findOne.mockResolvedValue({
        id: 'txn123',
        transactionId: 'pi_123',
        status: 'pending',
      });
      mockPaymentTransactionRepo.save.mockResolvedValue({});

      await service.handleWebhook(tenantId, gateway, payload, signature);

      expect(mockStripeService.verifyWebhookSignature).toHaveBeenCalled();
      expect(mockStripeService.handleWebhookEvent).toHaveBeenCalledWith(payload);
    });

    it('should throw error for invalid Stripe signature', async () => {
      const tenantId = 'tenant1';
      const gateway = 'stripe';
      const payload = {};
      const signature = 'invalid_signature';

      mockPaymentWebhookRepo.create.mockReturnValue({});
      mockPaymentWebhookRepo.save.mockResolvedValue({});
      mockStripeService.verifyWebhookSignature.mockReturnValue(false);

      await expect(service.handleWebhook(tenantId, gateway, payload, signature)).rejects.toThrow(
        'Invalid webhook signature',
      );
    });

    it('should throw error for unsupported gateway', async () => {
      const tenantId = 'tenant1';
      const gateway = 'invalid';
      const payload = {};

      mockPaymentWebhookRepo.create.mockReturnValue({});
      mockPaymentWebhookRepo.save.mockResolvedValue({});

      await expect(service.handleWebhook(tenantId, gateway, payload)).rejects.toThrow(
        'Unsupported gateway',
      );
    });
  });

  describe('listTransactions', () => {
    it('should list transactions with filters', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'txn1', orderId: 'order1', status: 'success' },
          { id: 'txn2', orderId: 'order1', status: 'pending' },
        ]),
      };

      mockPaymentTransactionRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.listTransactions('tenant1', {
        orderId: 'order1',
        limit: 10,
        offset: 0,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should list transactions with status filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'txn1', status: 'success' }]),
      };

      mockPaymentTransactionRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.listTransactions('tenant1', {
        status: 'success',
        limit: 10,
        offset: 0,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should list transactions with gateway filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'txn1', gateway: 'vnpay' }]),
      };

      mockPaymentTransactionRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.listTransactions('tenant1', {
        gateway: 'vnpay',
        limit: 10,
        offset: 0,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle pagination with offset', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'txn3', orderId: 'order3' }]),
      };

      mockPaymentTransactionRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.listTransactions('tenant1', {
        limit: 5,
        offset: 5,
      });

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(5);
      expect(result.total).toBe(10);
    });
  });

  describe('createPayment - edge cases', () => {
    it('should throw error for unsupported gateway', async () => {
      const dto: CreatePaymentDto = {
        orderId: 'order123',
        gateway: 'invalid' as any,
        amount: 100000,
        currency: 'VND',
        paymentMethod: 'bank_transfer',
        orderInfo: 'Test payment',
      };

      mockPaymentTransactionRepo.create.mockReturnValue({});
      mockPaymentTransactionRepo.save.mockResolvedValue({});

      await expect(service.createPayment('tenant1', dto)).rejects.toThrow();
    });
  });
});

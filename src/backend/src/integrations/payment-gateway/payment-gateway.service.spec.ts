import { Test, TestingModule } from '@nestjs/testing';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentWebhook } from './entities/payment-webhook.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VNPayService } from './providers/vnpay/vnpay.service';
import { MomoService } from './providers/momo/momo.service';
import { StripeService } from './providers/stripe/stripe.service';
import { PayPalService } from './providers/paypal/paypal.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentGatewayService', () => {
  let _paymentWebhookRepo: jest.Mocked<Repository<PaymentWebhook>>;
  let permissionService: jest.Mocked<PermissionService>;
  let service: PaymentGatewayService;
  let paymentTransactionRepo: jest.Mocked<Repository<PaymentTransaction>>;
  let __paymentWebhookRepo: jest.Mocked<Repository<PaymentWebhook>>;
  let vnpayService: jest.Mocked<VNPayService>;
  let momoService: jest.Mocked<MomoService>;
  let stripeService: jest.Mocked<StripeService>;
  let paypalService: jest.Mocked<PayPalService>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    email: 'test@example.com',
    roles: ['admin'],
  } as User;

  const mockTransaction: Partial<PaymentTransaction> = {
    id: 'txn-123',
    tenantId: 'tenant-123',
    orderId: 'order-123',
    gateway: 'vnpay',
    amount: 100000,
    currency: 'VND',
    status: 'pending',
    transactionId: 'VNP123456',
    paymentUrl: 'https://sandbox.vnpayment.vn/...',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPaymentTransactionRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    const mockPaymentWebhookRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockVNPayService = {
      createPaymentUrl: jest.fn(),
      verifyPaymentCallback: jest.fn(),
      refundTransaction: jest.fn(),
    };

    const mockMomoService = {
      createPayment: jest.fn(),
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
    };

    const mockPermissionService = {
      checkPermission: jest.fn().mockResolvedValue(true),
    };

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
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<PaymentGatewayService>(PaymentGatewayService);
    paymentTransactionRepo = module.get(getRepositoryToken(PaymentTransaction));
    paymentWebhookRepo = module.get(getRepositoryToken(PaymentWebhook));
    vnpayService = module.get(VNPayService);
    momoService = module.get(MomoService);
    stripeService = module.get(StripeService);
    paypalService = module.get(PayPalService);
    permissionService = module.get(PermissionService);
  });

  describe('createPayment', () => {
    it('should create payment with VNPay gateway', async () => {
      const dto = {
        orderId: 'order-123',
        amount: 100000,
        gateway: 'vnpay' as const,
        orderInfo: 'Test payment',
        ipAddress: '127.0.0.1',
      };

      vnpayService.createPaymentUrl.mockReturnValue('https://sandbox.vnpayment.vn/...');

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValueOnce({ ...mockTransaction, status: 'pending' } as PaymentTransaction)
        .mockResolvedValueOnce({ ...mockTransaction, status: 'processing' } as PaymentTransaction);

      const result = await service.createPayment(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.status).toBe('processing');
      expect(vnpayService.createPaymentUrl).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalledTimes(2);
    });

    it('should create payment with Momo gateway', async () => {
      const dto = {
        orderId: 'order-456',
        amount: 200000,
        gateway: 'momo' as const,
        orderInfo: 'Test payment',
      };

      momoService.createPayment.mockResolvedValue({
        payUrl: 'https://test.momo.vn/...',
        qrCodeUrl: 'https://test.momo.vn/qr',
        deeplink: 'momo://...',
      });

      const __saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValueOnce({ ...mockTransaction, status: 'pending' } as PaymentTransaction)
        .mockResolvedValueOnce({
          ...mockTransaction,
          status: 'processing',
          gateway: 'momo',
        } as PaymentTransaction);

      const result = await service.createPayment(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.gateway).toBe('momo');
      expect(momoService.createPayment).toHaveBeenCalled();
    });

    it('should create payment with Stripe gateway', async () => {
      const dto = {
        orderId: 'order-789',
        amount: 100,
        currency: 'USD',
        gateway: 'stripe' as const,
        orderInfo: 'Test payment',
        customerInfo: { email: 'test@example.com' },
      };

      stripeService.createPaymentIntent.mockResolvedValue({
        clientSecret: 'pi_secret_123',
        paymentIntentId: 'pi_123',
      });

      const __saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValueOnce({ ...mockTransaction, status: 'pending' } as PaymentTransaction)
        .mockResolvedValueOnce({
          ...mockTransaction,
          status: 'processing',
          gateway: 'stripe',
        } as PaymentTransaction);

      const result = await service.createPayment(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.gateway).toBe('stripe');
      expect(stripeService.createPaymentIntent).toHaveBeenCalled();
    });

    it('should create payment with PayPal gateway', async () => {
      const dto = {
        orderId: 'order-999',
        amount: 150,
        currency: 'USD',
        gateway: 'paypal' as const,
        orderInfo: 'Test payment',
        returnUrl: 'http://localhost/return',
        cancelUrl: 'http://localhost/cancel',
      };

      paypalService.createOrder.mockResolvedValue({
        approvalUrl: 'https://paypal.com/...',
        orderId: 'PAYPAL123',
      });

      const __saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValueOnce({ ...mockTransaction, status: 'pending' } as PaymentTransaction)
        .mockResolvedValueOnce({
          ...mockTransaction,
          status: 'processing',
          gateway: 'paypal',
        } as PaymentTransaction);

      const result = await service.createPayment(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.gateway).toBe('paypal');
      expect(paypalService.createOrder).toHaveBeenCalled();
    });

    it('should throw error for unsupported gateway', async () => {
      const dto = {
        orderId: 'order-123',
        amount: 100000,
        gateway: 'unsupported' as any,
      };

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'pending' } as PaymentTransaction);

      await expect(service.createPayment(mockUser, dto)).rejects.toThrow(BadRequestException);
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should handle payment creation error and update status to failed', async () => {
      const dto = {
        orderId: 'order-123',
        amount: 100000,
        gateway: 'vnpay' as const,
      };

      vnpayService.createPaymentUrl.mockImplementation(() => {
        throw new Error('Payment creation failed');
      });

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValueOnce({ ...mockTransaction, status: 'pending' } as PaymentTransaction)
        .mockResolvedValueOnce({ ...mockTransaction, status: 'failed' } as PaymentTransaction);

      await expect(service.createPayment(mockUser, dto)).rejects.toThrow();
      expect(_saveSpy).toHaveBeenCalledTimes(2);
      expect(_saveSpy).toHaveBeenLastCalledWith(
        mockUser,
        expect.objectContaining({ status: 'failed' }),
      );
    });

    it('should use default currency VND when not specified', async () => {
      const dto = {
        orderId: 'order-123',
        amount: 100000,
        gateway: 'vnpay' as const,
      };

      vnpayService.createPaymentUrl.mockReturnValue('https://sandbox.vnpayment.vn/...');

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, currency: 'VND' } as PaymentTransaction);

      await service.createPayment(mockUser, dto);

      expect(_saveSpy).toHaveBeenCalledWith(mockUser, expect.objectContaining({ currency: 'VND' }));
    });
  });

  describe('verifyPayment', () => {
    it('should verify successful VNPay payment', async () => {
      const dto = {
        transactionId: 'txn-123',
        gateway: 'vnpay',
        params: {
          vnp_ResponseCode: '00',
          vnp_TransactionNo: 'VNP123456',
        },
      };

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue(mockTransaction as PaymentTransaction);

      vnpayService.verifyPaymentCallback.mockReturnValue({
        success: true,
        message: 'Payment successful',
        transactionId: 'VNP123456',
      });

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'success' } as PaymentTransaction);

      const result = await service.verifyPayment(mockUser, dto);

      expect(result.success).toBe(true);
      expect(result.transaction.status).toBe('success');
      expect(vnpayService.verifyPaymentCallback).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should verify failed payment', async () => {
      const dto = {
        transactionId: 'txn-123',
        gateway: 'vnpay',
        params: {
          vnp_ResponseCode: '24',
        },
      };

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue(mockTransaction as PaymentTransaction);

      vnpayService.verifyPaymentCallback.mockReturnValue({
        success: false,
        message: 'Payment cancelled',
      });

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'failed' } as PaymentTransaction);

      const result = await service.verifyPayment(mockUser, dto);

      expect(result.success).toBe(false);
      expect(result.transaction.status).toBe('failed');
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should throw error if transaction not found', async () => {
      const dto = {
        transactionId: 'notfound',
        gateway: 'vnpay',
        params: {},
      };

      jest.spyOn(service['secureTransactionRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.verifyPayment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should verify Momo payment', async () => {
      const dto = {
        transactionId: 'txn-456',
        gateway: 'momo',
        params: {
          resultCode: 0,
        },
      };

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue({ ...mockTransaction, gateway: 'momo' } as PaymentTransaction);

      momoService.verifyIPN.mockReturnValue({
        success: true,
        message: 'Payment successful',
        transactionId: 'MOMO123',
      });

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'success' } as PaymentTransaction);

      const result = await service.verifyPayment(mockUser, dto);

      expect(result.success).toBe(true);
      expect(momoService.verifyIPN).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should verify Stripe payment via webhook', async () => {
      const dto = {
        transactionId: 'txn-789',
        gateway: 'stripe',
        params: {},
      };

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue({ ...mockTransaction, gateway: 'stripe' } as PaymentTransaction);

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'success' } as PaymentTransaction);

      const result = await service.verifyPayment(mockUser, dto);

      expect(result.success).toBe(true);
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should throw error for unsupported gateway', async () => {
      const dto = {
        transactionId: 'txn-123',
        gateway: 'unsupported',
        params: {},
      };

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue(mockTransaction as PaymentTransaction);

      await expect(service.verifyPayment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhook', () => {
    it('should handle VNPay webhook', async () => {
      const payload = {
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'VNP123456',
      };

      vnpayService.verifyPaymentCallback.mockReturnValue({
        success: true,
        message: 'Payment successful',
        transactionId: 'VNP123456',
      });

      const _saveSpy = jest
        .spyOn(service['secureWebhookRepo'], 'save')
        .mockResolvedValueOnce({ id: 'webhook-123', processed: false } as any)
        .mockResolvedValueOnce({ id: 'webhook-123', processed: true } as any);

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue(mockTransaction as PaymentTransaction);

      jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'success' } as PaymentTransaction);

      await service.handleWebhook(mockUser, 'vnpay', payload);

      expect(vnpayService.verifyPaymentCallback).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle Momo webhook', async () => {
      const payload = {
        resultCode: 0,
        transId: 'MOMO123',
      };

      momoService.verifyIPN.mockReturnValue({
        success: true,
        message: 'Payment successful',
        transactionId: 'MOMO123',
      });

      const _saveSpy = jest
        .spyOn(service['secureWebhookRepo'], 'save')
        .mockResolvedValue({ id: 'webhook-456', processed: true } as any);

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue({ ...mockTransaction, gateway: 'momo' } as PaymentTransaction);

      jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'success' } as PaymentTransaction);

      await service.handleWebhook(mockUser, 'momo', payload);

      expect(momoService.verifyIPN).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should handle Stripe webhook with valid signature', async () => {
      const payload = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      };
      const signature = 'valid_signature';

      stripeService.verifyWebhookSignature.mockReturnValue(true);
      stripeService.handleWebhookEvent.mockResolvedValue({
        success: true,
        message: 'Payment successful',
        transactionId: 'pi_123',
      });

      const _saveSpy = jest
        .spyOn(service['secureWebhookRepo'], 'save')
        .mockResolvedValue({ id: 'webhook-789', processed: true } as any);

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue({ ...mockTransaction, gateway: 'stripe' } as PaymentTransaction);

      jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'success' } as PaymentTransaction);

      await service.handleWebhook(mockUser, 'stripe', payload, signature);

      expect(stripeService.verifyWebhookSignature).toHaveBeenCalled();
      expect(stripeService.handleWebhookEvent).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should throw error for invalid Stripe webhook signature', async () => {
      const payload = {
        type: 'payment_intent.succeeded',
      };
      const signature = 'invalid_signature';

      stripeService.verifyWebhookSignature.mockReturnValue(false);

      const _saveSpy = jest
        .spyOn(service['secureWebhookRepo'], 'save')
        .mockResolvedValue({ id: 'webhook-999', processed: false } as any);

      await expect(service.handleWebhook(mockUser, 'stripe', payload, signature)).rejects.toThrow();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should throw error for unsupported gateway', async () => {
      const payload = {};

      const _saveSpy = jest
        .spyOn(service['secureWebhookRepo'], 'save')
        .mockResolvedValue({ id: 'webhook-111', processed: false } as any);

      await expect(service.handleWebhook(mockUser, 'unsupported', payload)).rejects.toThrow();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should handle webhook when transaction not found', async () => {
      const payload = {
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'VNP999999',
      };

      vnpayService.verifyPaymentCallback.mockReturnValue({
        success: true,
        message: 'Payment successful',
        transactionId: 'VNP999999',
      });

      const _saveSpy = jest
        .spyOn(service['secureWebhookRepo'], 'save')
        .mockResolvedValue({ id: 'webhook-222', processed: true } as any);

      jest.spyOn(service['secureTransactionRepo'], 'findOne').mockResolvedValue(null);

      await service.handleWebhook(mockUser, 'vnpay', payload);

      expect(_saveSpy).toHaveBeenCalled();
    });
  });

  describe('refundPayment', () => {
    it('should refund VNPay payment', async () => {
      const dto = {
        transactionId: 'txn-123',
      };

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue({ ...mockTransaction, status: 'success' } as PaymentTransaction);

      vnpayService.refundTransaction.mockResolvedValue({});

      const _saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'refunded' } as PaymentTransaction);

      const result = await service.refundPayment(mockUser, dto);

      expect(result.status).toBe('refunded');
      expect(vnpayService.refundTransaction).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should refund Momo payment', async () => {
      const dto = {
        transactionId: 'txn-456',
        amount: 50000,
        reason: 'Customer request',
      };

      jest.spyOn(service['secureTransactionRepo'], 'findOne').mockResolvedValue({
        ...mockTransaction,
        gateway: 'momo',
        status: 'success',
      } as PaymentTransaction);

      momoService.refundTransaction.mockResolvedValue({});

      const __saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'refunded' } as PaymentTransaction);

      const result = await service.refundPayment(mockUser, dto);

      expect(result.status).toBe('refunded');
      expect(momoService.refundTransaction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        50000,
        'Customer request',
      );
    });

    it('should refund Stripe payment', async () => {
      const dto = {
        transactionId: 'txn-789',
        amount: 75,
        reason: 'Defective product',
      };

      jest.spyOn(service['secureTransactionRepo'], 'findOne').mockResolvedValue({
        ...mockTransaction,
        gateway: 'stripe',
        status: 'success',
      } as PaymentTransaction);

      stripeService.refundPayment.mockResolvedValue({});

      const __saveSpy = jest
        .spyOn(service['secureTransactionRepo'], 'save')
        .mockResolvedValue({ ...mockTransaction, status: 'refunded' } as PaymentTransaction);

      const result = await service.refundPayment(mockUser, dto);

      expect(result.status).toBe('refunded');
      expect(stripeService.refundPayment).toHaveBeenCalledWith(
        mockTransaction.transactionId,
        75,
        'Defective product',
      );
    });

    it('should throw error if transaction not found', async () => {
      const dto = {
        transactionId: 'notfound',
      };

      jest.spyOn(service['secureTransactionRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.refundPayment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if transaction not successful', async () => {
      const dto = {
        transactionId: 'txn-123',
      };

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue({ ...mockTransaction, status: 'pending' } as PaymentTransaction);

      await expect(service.refundPayment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error for unsupported gateway', async () => {
      const dto = {
        transactionId: 'txn-123',
      };

      jest.spyOn(service['secureTransactionRepo'], 'findOne').mockResolvedValue({
        ...mockTransaction,
        gateway: 'unsupported',
        status: 'success',
      } as PaymentTransaction);

      await expect(service.refundPayment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should handle refund error', async () => {
      const dto = {
        transactionId: 'txn-123',
      };

      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue({ ...mockTransaction, status: 'success' } as PaymentTransaction);

      vnpayService.refundTransaction.mockRejectedValue(new Error('Refund failed'));

      await expect(service.refundPayment(mockUser, dto)).rejects.toThrow();
    });
  });

  describe('getTransaction', () => {
    it('should get transaction by ID', async () => {
      jest
        .spyOn(service['secureTransactionRepo'], 'findOne')
        .mockResolvedValue(mockTransaction as PaymentTransaction);

      const result = await service.getTransaction(mockUser, 'txn-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('txn-123');
    });

    it('should throw error if transaction not found', async () => {
      jest.spyOn(service['secureTransactionRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.getTransaction(mockUser, 'notfound')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listTransactions', () => {
    it('should list all transactions', async () => {
      const mockTransactions = [mockTransaction, { ...mockTransaction, id: 'txn-456' }];

      jest
        .spyOn(service['secureTransactionRepo'], 'find')
        .mockResolvedValue(mockTransactions as PaymentTransaction[]);
      paymentTransactionRepo.count.mockResolvedValue(2);

      const result = await service.listTransactions(mockUser);

      expect(result).toBeDefined();
      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter transactions by orderId', async () => {
      jest
        .spyOn(service['secureTransactionRepo'], 'find')
        .mockResolvedValue([mockTransaction] as PaymentTransaction[]);
      paymentTransactionRepo.count.mockResolvedValue(1);

      const result = await service.listTransactions(mockUser, { orderId: 'order-123' });

      expect(result.transactions).toHaveLength(1);
    });

    it('should filter transactions by gateway', async () => {
      jest
        .spyOn(service['secureTransactionRepo'], 'find')
        .mockResolvedValue([mockTransaction] as PaymentTransaction[]);
      paymentTransactionRepo.count.mockResolvedValue(1);

      const result = await service.listTransactions(mockUser, { gateway: 'vnpay' });

      expect(result.transactions).toHaveLength(1);
    });

    it('should filter transactions by status', async () => {
      jest
        .spyOn(service['secureTransactionRepo'], 'find')
        .mockResolvedValue([mockTransaction] as PaymentTransaction[]);
      paymentTransactionRepo.count.mockResolvedValue(1);

      const result = await service.listTransactions(mockUser, { status: 'success' });

      expect(result.transactions).toHaveLength(1);
    });

    it('should paginate results', async () => {
      jest
        .spyOn(service['secureTransactionRepo'], 'find')
        .mockResolvedValue([mockTransaction] as PaymentTransaction[]);
      paymentTransactionRepo.count.mockResolvedValue(100);

      const result = await service.listTransactions(mockUser, { limit: 10, offset: 20 });

      expect(result.total).toBe(100);
    });

    it('should use default limit and offset', async () => {
      jest
        .spyOn(service['secureTransactionRepo'], 'find')
        .mockResolvedValue([mockTransaction] as PaymentTransaction[]);
      paymentTransactionRepo.count.mockResolvedValue(1);

      const result = await service.listTransactions(mockUser);

      expect(result).toBeDefined();
    });
  });
});

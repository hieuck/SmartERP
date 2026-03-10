import { Test, TestingModule } from '@nestjs/testing';
import { PaymentGatewayController } from './payment-gateway.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { CreatePaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';
import { createMockUser } from '@/common/test/test-helpers';

describe('PaymentGatewayController', () => {
  let controller: PaymentGatewayController;
  let service: jest.Mocked<PaymentGatewayService>;

  const mockPaymentGatewayService = {
    createPayment: jest.fn(),
    verifyPayment: jest.fn(),
    handleWebhook: jest.fn(),
    refundPayment: jest.fn(),
    getTransaction: jest.fn(),
    listTransactions: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentGatewayController],
      providers: [
        {
          provide: PaymentGatewayService,
          useValue: mockPaymentGatewayService,
        },
      ],
    }).compile();

    controller = module.get<PaymentGatewayController>(PaymentGatewayController);
    service = module.get(PaymentGatewayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create payment', async () => {
      const dto: CreatePaymentDto = {
        orderId: 'order-1',
        amount: 1000000,
        gateway: 'vnpay',
        returnUrl: 'https://example.com/return',
      } as CreatePaymentDto;

      const req = { tenantId: 'tenant-1' } as any;
      const result = { paymentUrl: 'https://vnpay.com/payment' };

      service.createPayment.mockResolvedValue(result as any);

      expect(await controller.createPayment(req, dto)).toEqual(result);
      expect(service.createPayment).toHaveBeenCalledWith('tenant-1', dto);
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment', async () => {
      const dto: VerifyPaymentDto = {
        transactionId: 'txn-1',
        gateway: 'vnpay',
        params: {},
      } as VerifyPaymentDto;

      const req = { tenantId: 'tenant-1' } as any;
      const result = { success: true, transactionId: 'txn-1' };

      service.verifyPayment.mockResolvedValue(result as any);

      expect(await controller.verifyPayment(req, dto)).toEqual(result);
      expect(service.verifyPayment).toHaveBeenCalledWith('tenant-1', dto);
    });
  });

  describe('vnpayReturn', () => {
    it('should handle VNPay return callback', async () => {
      const query = { vnp_TxnRef: 'order-1', vnp_ResponseCode: '00' };

      const result = await controller.vnpayReturn(query);

      expect(result).toEqual({
        message: 'Payment callback received',
        params: query,
      });
    });
  });

  describe('vnpayIPN', () => {
    it('should handle VNPay IPN webhook', async () => {
      const req = { tenantId: 'tenant-1' } as any;
      const body = { vnp_TxnRef: 'order-1', vnp_ResponseCode: '00' };

      service.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.vnpayIPN(req, body);

      expect(result).toEqual({ RspCode: '00', Message: 'success' });
      expect(service.handleWebhook).toHaveBeenCalledWith('tenant-1', 'vnpay', body);
    });
  });

  describe('momoReturn', () => {
    it('should handle Momo return callback', async () => {
      const query = { orderId: 'order-1', resultCode: 0 };

      const result = await controller.momoReturn(query);

      expect(result).toEqual({
        message: 'Payment callback received',
        params: query,
      });
    });
  });

  describe('momoIPN', () => {
    it('should handle Momo IPN webhook', async () => {
      const req = { tenantId: 'tenant-1' } as any;
      const body = { orderId: 'order-1', resultCode: 0 };

      service.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.momoIPN(req, body);

      expect(result).toEqual({ resultCode: 0, message: 'success' });
      expect(service.handleWebhook).toHaveBeenCalledWith('tenant-1', 'momo', body);
    });
  });

  describe('stripeWebhook', () => {
    it('should handle Stripe webhook', async () => {
      const req = { tenantId: 'tenant-1' } as any;
      const body = { type: 'payment_intent.succeeded' };
      const signature = 'stripe-signature';

      service.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.stripeWebhook(req, body, signature);

      expect(result).toEqual({ received: true });
      expect(service.handleWebhook).toHaveBeenCalledWith('tenant-1', 'stripe', body, signature);
    });
  });

  describe('refundPayment', () => {
    it('should refund payment', async () => {
      const dto: RefundPaymentDto = {
        transactionId: 'txn-1',
        amount: 500000,
        reason: 'Customer request',
      } as RefundPaymentDto;

      const req = { tenantId: 'tenant-1' } as any;
      const result = { success: true, refundId: 'refund-1' };

      service.refundPayment.mockResolvedValue(result as any);

      expect(await controller.refundPayment(req, dto)).toEqual(result);
      expect(service.refundPayment).toHaveBeenCalledWith('tenant-1', dto);
    });
  });

  describe('getTransaction', () => {
    it('should get transaction by id', async () => {
      const req = { tenantId: 'tenant-1' } as any;
      const transaction = {
        id: 'txn-1',
        orderId: 'order-1',
        amount: 1000000,
        status: 'completed',
      };

      service.getTransaction.mockResolvedValue(transaction as any);

      expect(await controller.getTransaction(req, 'txn-1')).toEqual(transaction);
      expect(service.getTransaction).toHaveBeenCalledWith('tenant-1', 'txn-1');
    });
  });

  describe('listTransactions', () => {
    it('should list transactions', async () => {
      const req = { tenantId: 'tenant-1' } as any;
      const transactions = [
        { id: 'txn-1', orderId: 'order-1', amount: 1000000 },
        { id: 'txn-2', orderId: 'order-2', amount: 2000000 },
      ];

      service.listTransactions.mockResolvedValue(transactions as any);

      const result = await controller.listTransactions(req, 'order-1', 'vnpay', 'completed', 10, 0);

      expect(result).toEqual(transactions);
      expect(service.listTransactions).toHaveBeenCalledWith('tenant-1', {
        orderId: 'order-1',
        gateway: 'vnpay',
        status: 'completed',
        limit: 10,
        offset: 0,
      });
    });
  });
});

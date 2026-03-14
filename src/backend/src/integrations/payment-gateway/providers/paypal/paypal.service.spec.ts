import { Test, TestingModule } from '@nestjs/testing';
import { PayPalService, PayPalPaymentParams } from './paypal.service';

describe('PayPalService', () => {
  let service: PayPalService;

  const mockPaymentParams: PayPalPaymentParams = {
    orderId: 'order-123',
    amount: 100.50,
    currency: 'USD',
    description: 'Test payment',
    returnUrl: 'https://example.com/return',
    cancelUrl: 'https://example.com/cancel',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayPalService],
    }).compile();

    service = module.get<PayPalService>(PayPalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize PayPal service', () => {
      expect(service).toBeDefined();
    });
  });

  describe('createOrder', () => {
    it('should create PayPal order successfully', async () => {
      const result = await service.createOrder(mockPaymentParams);

      expect(result.orderId).toBeDefined();
      expect(result.orderId).toContain('PAYPAL-');
      expect(result.approvalUrl).toBeDefined();
      expect(result.approvalUrl).toContain('paypal.com');
      expect(result.error).toBeUndefined();
    });

    it('should create order with minimal params', async () => {
      const minimalParams: PayPalPaymentParams = {
        orderId: 'order-456',
        amount: 50,
        currency: 'USD',
        description: 'Minimal payment',
      };

      const result = await service.createOrder(minimalParams);

      expect(result.orderId).toBeDefined();
      expect(result.approvalUrl).toBeDefined();
    });

    it('should create order with different currencies', async () => {
      const params = { ...mockPaymentParams, currency: 'EUR' };
      const result = await service.createOrder(params);

      expect(result.orderId).toBeDefined();
    });

    it('should create order with large amount', async () => {
      const params = { ...mockPaymentParams, amount: 999999.99 };
      const result = await service.createOrder(params);

      expect(result.orderId).toBeDefined();
    });

    it('should create order with zero amount', async () => {
      const params = { ...mockPaymentParams, amount: 0 };
      const result = await service.createOrder(params);

      expect(result.orderId).toBeDefined();
    });
  });

  describe('captureOrder', () => {
    it('should capture PayPal order successfully', async () => {
      const result = await service.captureOrder('PAYPAL-123456');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment captured successfully');
      expect(result.transactionId).toBeDefined();
      expect(result.transactionId).toContain('CAPTURE');
      expect(result.amount).toBe(100.0);
    });

    it('should capture order with different order IDs', async () => {
      const result1 = await service.captureOrder('ORDER-1');
      const result2 = await service.captureOrder('ORDER-2');

      expect(result1.transactionId).not.toBe(result2.transactionId);
    });

    it('should handle capture with empty order ID', async () => {
      const result = await service.captureOrder('');

      expect(result.success).toBe(true);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature successfully', () => {
      const webhookId = 'webhook-123';
      const headers = {
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://api.paypal.com/cert',
        'paypal-transmission-id': 'trans-123',
        'paypal-transmission-sig': 'sig-123',
        'paypal-transmission-time': '2024-01-01T00:00:00Z',
      };
      const body = { event_type: 'PAYMENT.CAPTURE.COMPLETED' };

      const result = service.verifyWebhookSignature(webhookId, headers, body);

      expect(result).toBe(true);
    });

    it('should verify with empty headers', () => {
      const result = service.verifyWebhookSignature('webhook-123', {}, {});

      expect(result).toBe(true);
    });

    it('should verify with minimal data', () => {
      const result = service.verifyWebhookSignature('', {}, {});

      expect(result).toBe(true);
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle PAYMENT.CAPTURE.COMPLETED event', async () => {
      const event = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'capture-123',
          amount: { value: '100.50' },
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment completed');
      expect(result.transactionId).toBe('capture-123');
      expect(result.amount).toBe(100.50);
    });

    it('should handle PAYMENT.CAPTURE.DENIED event', async () => {
      const event = {
        event_type: 'PAYMENT.CAPTURE.DENIED',
        resource: {
          id: 'capture-456',
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Payment denied');
      expect(result.transactionId).toBe('capture-456');
    });

    it('should handle PAYMENT.CAPTURE.REFUNDED event', async () => {
      const event = {
        event_type: 'PAYMENT.CAPTURE.REFUNDED',
        resource: {
          id: 'capture-789',
          amount: { value: '50.25' },
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment refunded');
      expect(result.transactionId).toBe('capture-789');
      expect(result.amount).toBe(50.25);
    });

    it('should handle unknown event type', async () => {
      const event = {
        event_type: 'UNKNOWN.EVENT',
        resource: {
          id: 'resource-123',
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Event received');
    });

    it('should handle event without amount', async () => {
      const event = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'capture-999',
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(0);
    });
  });

  describe('refundPayment', () => {
    it('should refund payment successfully', async () => {
      const result = await service.refundPayment('capture-123', 50.0, 'Customer request');

      expect(result.id).toBeDefined();
      expect(result.id).toContain('REFUND');
      expect(result.status).toBe('COMPLETED');
    });

    it('should refund without amount (full refund)', async () => {
      const result = await service.refundPayment('capture-456');

      expect(result.id).toBeDefined();
      expect(result.status).toBe('COMPLETED');
    });

    it('should refund without note', async () => {
      const result = await service.refundPayment('capture-789', 25.0);

      expect(result.id).toBeDefined();
    });

    it('should refund with zero amount', async () => {
      const result = await service.refundPayment('capture-000', 0);

      expect(result.id).toBeDefined();
    });
  });

  describe('getOrderDetails', () => {
    it('should get order details successfully', async () => {
      const result = await service.getOrderDetails('order-123');

      expect(result.id).toBe('order-123');
      expect(result.status).toBe('COMPLETED');
    });

    it('should get details for different orders', async () => {
      const result1 = await service.getOrderDetails('order-1');
      const result2 = await service.getOrderDetails('order-2');

      expect(result1.id).toBe('order-1');
      expect(result2.id).toBe('order-2');
    });

    it('should get details with empty order ID', async () => {
      const result = await service.getOrderDetails('');

      expect(result.id).toBe('');
    });
  });
});

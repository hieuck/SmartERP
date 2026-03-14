import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  let service: StripeService;

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeService],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent with required params', async () => {
      const params = {
        orderId: 'ORDER123',
        amount: 100,
        currency: 'USD',
        description: 'Test payment',
      };

      const result = await service.createPaymentIntent(params);

      expect(result).toBeDefined();
      expect(result.clientSecret).toBeDefined();
      expect(result.paymentIntentId).toBeDefined();
      expect(result.clientSecret).toContain('pi_mock_');
      expect(result.clientSecret).toContain('_secret_mock');
      expect(result.paymentIntentId).toContain('pi_mock_');
    });

    it('should create payment intent with customer email', async () => {
      const params = {
        orderId: 'ORDER456',
        amount: 200,
        currency: 'USD',
        description: 'Test payment with email',
        customerEmail: 'test@example.com',
      };

      const result = await service.createPaymentIntent(params);

      expect(result).toBeDefined();
      expect(result.clientSecret).toBeDefined();
      expect(result.paymentIntentId).toBeDefined();
    });

    it('should create payment intent with metadata', async () => {
      const params = {
        orderId: 'ORDER789',
        amount: 150,
        currency: 'EUR',
        description: 'Test payment',
        metadata: {
          customerId: 'CUST123',
          invoiceId: 'INV456',
        },
      };

      const result = await service.createPaymentIntent(params);

      expect(result).toBeDefined();
      expect(result.clientSecret).toBeDefined();
    });

    it('should handle different currencies', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'VND'];

      for (const currency of currencies) {
        const params = {
          orderId: `ORDER_${currency}`,
          amount: 100,
          currency,
          description: `Test payment in ${currency}`,
        };

        const result = await service.createPaymentIntent(params);

        expect(result).toBeDefined();
        expect(result.clientSecret).toBeDefined();
      }
    });

    it('should handle zero amount', async () => {
      const params = {
        orderId: 'ORDER_ZERO',
        amount: 0,
        currency: 'USD',
        description: 'Zero amount payment',
      };

      const result = await service.createPaymentIntent(params);

      expect(result).toBeDefined();
    });

    it('should handle large amounts', async () => {
      const params = {
        orderId: 'ORDER_LARGE',
        amount: 999999.99,
        currency: 'USD',
        description: 'Large amount payment',
      };

      const result = await service.createPaymentIntent(params);

      expect(result).toBeDefined();
      expect(result.clientSecret).toBeDefined();
    });

    it('should handle decimal amounts', async () => {
      const params = {
        orderId: 'ORDER_DECIMAL',
        amount: 123.45,
        currency: 'USD',
        description: 'Decimal amount payment',
      };

      const result = await service.createPaymentIntent(params);

      expect(result).toBeDefined();
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: {} });
      const signature = 'valid_signature';

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should handle empty payload', () => {
      const payload = '';
      const signature = 'signature';

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toBe(true); // Mock always returns true
    });

    it('should handle empty signature', () => {
      const payload = JSON.stringify({ type: 'test' });
      const signature = '';

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should handle malformed JSON payload', () => {
      const payload = 'not a json';
      const signature = 'signature';

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            amount: 10000,
          },
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment successful');
      expect(result.transactionId).toBe('pi_123456');
      expect(result.amount).toBe(100); // 10000 / 100
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_789012',
            amount: 5000,
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Card declined');
      expect(result.transactionId).toBe('pi_789012');
      expect(result.amount).toBe(50);
    });

    it('should handle payment_intent.payment_failed without error message', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_345678',
            amount: 7500,
          },
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Payment failed');
      expect(result.transactionId).toBe('pi_345678');
    });

    it('should handle charge.refunded event', async () => {
      const event = {
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_123456',
            amount_refunded: 8000,
          },
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Refund successful');
      expect(result.transactionId).toBe('ch_123456');
      expect(result.amount).toBe(80);
    });

    it('should handle unknown event type', async () => {
      const event = {
        type: 'unknown.event',
        data: {
          object: {},
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Event received');
      expect(result.transactionId).toBeUndefined();
    });

    it('should handle event with missing data', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_999999',
            amount: 0,
          },
        },
      };

      const result = await service.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(0);
    });
  });

  describe('retrievePaymentIntent', () => {
    it('should retrieve payment intent by ID', async () => {
      const paymentIntentId = 'pi_123456';

      const result = await service.retrievePaymentIntent(paymentIntentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(paymentIntentId);
    });

    it('should handle empty payment intent ID', async () => {
      const paymentIntentId = '';

      const result = await service.retrievePaymentIntent(paymentIntentId);

      expect(result).toBeDefined();
      expect(result.id).toBe('');
    });

    it('should handle special characters in ID', async () => {
      const paymentIntentId = 'pi_test_123_abc';

      const result = await service.retrievePaymentIntent(paymentIntentId);

      expect(result).toBeDefined();
    });
  });

  describe('refundPayment', () => {
    it('should refund payment with payment intent ID', async () => {
      const paymentIntentId = 'pi_123456';

      const result = await service.refundPayment(paymentIntentId);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.id).toContain('re_mock_');
    });

    it('should refund payment with partial amount', async () => {
      const paymentIntentId = 'pi_789012';
      const amount = 50;

      const result = await service.refundPayment(paymentIntentId, amount);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should refund payment with reason', async () => {
      const paymentIntentId = 'pi_345678';
      const amount = 100;
      const reason = 'Customer requested refund';

      const result = await service.refundPayment(paymentIntentId, amount, reason);

      expect(result).toBeDefined();
    });

    it('should handle full refund without amount', async () => {
      const paymentIntentId = 'pi_999999';

      const result = await service.refundPayment(paymentIntentId);

      expect(result).toBeDefined();
    });

    it('should handle zero amount refund', async () => {
      const paymentIntentId = 'pi_000000';
      const amount = 0;

      const result = await service.refundPayment(paymentIntentId, amount);

      expect(result).toBeDefined();
    });
  });

  describe('createCustomer', () => {
    it('should create customer with email', async () => {
      const email = 'test@example.com';

      const result = await service.createCustomer(email);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.id).toContain('cus_mock_');
    });

    it('should create customer with name', async () => {
      const email = 'john@example.com';
      const name = 'John Doe';

      const result = await service.createCustomer(email, name);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should create customer with metadata', async () => {
      const email = 'jane@example.com';
      const name = 'Jane Smith';
      const metadata = {
        userId: 'USER123',
        tenantId: 'TENANT456',
      };

      const result = await service.createCustomer(email, name, metadata);

      expect(result).toBeDefined();
    });

    it('should handle empty email', async () => {
      const email = '';

      const result = await service.createCustomer(email);

      expect(result).toBeDefined();
    });

    it('should handle special characters in email', async () => {
      const email = 'test+tag@example.co.uk';

      const result = await service.createCustomer(email);

      expect(result).toBeDefined();
    });

    it('should handle unicode characters in name', async () => {
      const email = 'test@example.com';
      const name = 'Nguyễn Văn A';

      const result = await service.createCustomer(email, name);

      expect(result).toBeDefined();
    });
  });
});

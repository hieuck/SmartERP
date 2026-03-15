import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Order } from './entities/order.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { PaymentStatus } from '../enums/ecommerce.enum';
import { ProcessPaymentDto } from './dto/payment.dto';
import { VerifyPaymentDto } from './dto/payment.dto';
import { RefundDto } from './dto/refund.dto';

describe('PaymentService', () => {
  let service: PaymentService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let _permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['user'],
  };

  // Helper function to create fresh mock order
  const createMockOrder = (overrides = {}): Order =>
    ({
      id: 'order-1',
      orderNumber: 'ORD-001',
      customerId: 'customer-1',
      customer: null,
      cartId: 'cart-1',
      status: 'pending' as any,
      paymentStatus: PaymentStatus.PENDING,
      shippingStatus: 'pending' as any,
      items: [],
      subtotal: 100,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 100,
      couponCode: null,
      customerEmail: 'customer@example.com',
      customerPhone: '0123456789',
      shippingAddress: {
        street: '123 Main St',
        city: 'Hanoi',
        country: 'Vietnam',
        postalCode: '100000',
      },
      billingAddress: {
        street: '123 Main St',
        city: 'Hanoi',
        country: 'Vietnam',
        postalCode: '100000',
      },
      paymentMethod: null,
      paymentTransactionId: null,
      paidAt: null,
      shippingMethod: null,
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
      customerNotes: null,
      internalNotes: null,
      cancelledBy: null,
      cancellationReason: null,
      cancelledAt: null,
      tenantId: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      generateOrderNumber: jest.fn(),
      calculateTotals: jest.fn(),
      validate: jest.fn(),
      itemCount: 0,
      isPaid: false,
      canBeCancelled: true,
      isCompleted: false,
      ...overrides,
    }) as Order;

  beforeEach(async () => {
    const mockOrderRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockPermissionService = {
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, where) => where),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    orderRepository = module.get(getRepositoryToken(Order));
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    const processDto: ProcessPaymentDto = {
      orderId: 'order-1',
      amount: 100,
      paymentMethod: 'cod',
      paymentToken: undefined,
      paymentDetails: undefined,
    };

    beforeEach(() => {
      // Reset mock order to PENDING status before each test
      orderRepository.findOne.mockReset();
    });

    it('should process COD payment successfully', async () => {
      const freshOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(freshOrder);
      orderRepository.save.mockResolvedValue({
        ...freshOrder,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'cod',
      } as any);

      const result = await service.processPayment(processDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('COD-');
      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.processPayment(processDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processPayment(processDto, mockUser)).rejects.toThrow(
        'Order with ID order-1 not found',
      );
    });

    it('should throw BadRequestException when order already paid', async () => {
      const paidOrder = createMockOrder({ paymentStatus: PaymentStatus.PAID });
      orderRepository.findOne.mockResolvedValue(paidOrder);

      await expect(service.processPayment(processDto, mockUser)).rejects.toThrow(
        'Order is already paid',
      );
    });

    it('should throw BadRequestException when amount mismatch', async () => {
      const freshOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(freshOrder);

      const wrongAmountDto = { ...processDto, amount: 200 };

      await expect(service.processPayment(wrongAmountDto, mockUser)).rejects.toThrow(
        'Payment amount 200 does not match order total 100',
      );
    });

    it('should process Stripe payment successfully', async () => {
      const freshOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(freshOrder);
      orderRepository.save.mockResolvedValue({
        ...freshOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const stripeDto = { ...processDto, paymentMethod: 'stripe', paymentToken: 'tok_123' };
      const result = await service.processPayment(stripeDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('STRIPE-');
    });

    it('should process PayPal payment successfully', async () => {
      const freshOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(freshOrder);
      orderRepository.save.mockResolvedValue({
        ...freshOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const paypalDto = { ...processDto, paymentMethod: 'paypal', paymentToken: 'tok_123' };
      const result = await service.processPayment(paypalDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('PAYPAL-');
    });

    it('should process VNPay payment successfully', async () => {
      const freshOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(freshOrder);
      orderRepository.save.mockResolvedValue({
        ...freshOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const vnpayDto = { ...processDto, paymentMethod: 'vnpay' };
      const result = await service.processPayment(vnpayDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('VNPAY-');
    });

    it('should process Momo payment successfully', async () => {
      const freshOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(freshOrder);
      orderRepository.save.mockResolvedValue({
        ...freshOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const momoDto = { ...processDto, paymentMethod: 'momo' };
      const result = await service.processPayment(momoDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('MOMO-');
    });

    it('should throw BadRequestException for unsupported payment method', async () => {
      const freshOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(freshOrder);

      const unsupportedDto = { ...processDto, paymentMethod: 'bitcoin' };

      await expect(service.processPayment(unsupportedDto, mockUser)).rejects.toThrow(
        'Unsupported payment method: bitcoin',
      );
    });

    it('should mark payment as failed when payment fails', async () => {
      const freshOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(freshOrder);
      orderRepository.save.mockResolvedValue({
        ...freshOrder,
        paymentStatus: PaymentStatus.FAILED,
      } as any);

      // Mock payment failure by overriding processCOD
      jest.spyOn(service as any, 'processCOD').mockResolvedValue({
        success: false,
        transactionId: '',
        message: 'Payment failed',
      });

      const result = await service.processPayment(processDto, mockUser);

      expect(result.success).toBe(false);
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.FAILED,
        }),
      );
    });
  });

  describe('verifyPayment', () => {
    const verifyDto: VerifyPaymentDto = {
      orderId: 'order-1',
      transactionId: 'TXN-123',
      paymentMethod: 'cod',
    };

    it('should verify COD payment successfully', async () => {
      const mockOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const result = await service.verifyPayment(verifyDto, mockUser);

      expect(result.verified).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.message).toBe('Payment verified successfully');
    });

    it('should throw BadRequestException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyPayment(verifyDto, mockUser)).rejects.toThrow(
        'Order with ID order-1 not found',
      );
    });

    it('should verify Stripe payment successfully', async () => {
      const mockOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const stripeDto = { ...verifyDto, paymentMethod: 'stripe' };
      const result = await service.verifyPayment(stripeDto, mockUser);

      expect(result.verified).toBe(true);
    });

    it('should verify PayPal payment successfully', async () => {
      const mockOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const paypalDto = { ...verifyDto, paymentMethod: 'paypal' };
      const result = await service.verifyPayment(paypalDto, mockUser);

      expect(result.verified).toBe(true);
    });

    it('should verify VNPay payment successfully', async () => {
      const mockOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const vnpayDto = { ...verifyDto, paymentMethod: 'vnpay' };
      const result = await service.verifyPayment(vnpayDto, mockUser);

      expect(result.verified).toBe(true);
    });

    it('should verify Momo payment successfully', async () => {
      const mockOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const momoDto = { ...verifyDto, paymentMethod: 'momo' };
      const result = await service.verifyPayment(momoDto, mockUser);

      expect(result.verified).toBe(true);
    });

    it('should throw BadRequestException for unsupported payment method', async () => {
      const mockOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      const unsupportedDto = { ...verifyDto, paymentMethod: 'bitcoin' };

      await expect(service.verifyPayment(unsupportedDto, mockUser)).rejects.toThrow(
        'Unsupported payment method: bitcoin',
      );
    });

    it('should not update status if already paid', async () => {
      const paidOrder = createMockOrder({ paymentStatus: PaymentStatus.PAID });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);

      const result = await service.verifyPayment(verifyDto, mockUser);

      expect(result.verified).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(orderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('refundPayment', () => {
    const refundDto: RefundDto = {
      orderId: 'order-1',
      amount: 100,
      reason: 'Customer request',
    };

    it('should refund COD payment successfully', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'cod',
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);
      orderRepository.save.mockResolvedValue({
        ...paidOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      } as any);

      const result = await service.refundPayment(refundDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('COD-REFUND-');
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.REFUNDED,
        }),
      );
    });

    it('should throw BadRequestException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.refundPayment(refundDto, mockUser)).rejects.toThrow(
        'Order with ID order-1 not found',
      );
    });

    it('should throw BadRequestException when order not paid', async () => {
      const unpaidOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(unpaidOrder as any);

      await expect(service.refundPayment(refundDto, mockUser)).rejects.toThrow(
        'Order must be paid before refunding',
      );
    });

    it('should refund Stripe payment successfully', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'stripe',
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);
      orderRepository.save.mockResolvedValue({
        ...paidOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      } as any);

      const result = await service.refundPayment(refundDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('STRIPE-REFUND-');
    });

    it('should refund PayPal payment successfully', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'paypal',
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);
      orderRepository.save.mockResolvedValue({
        ...paidOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      } as any);

      const result = await service.refundPayment(refundDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('PAYPAL-REFUND-');
    });

    it('should refund VNPay payment successfully', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'vnpay',
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);
      orderRepository.save.mockResolvedValue({
        ...paidOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      } as any);

      const result = await service.refundPayment(refundDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('VNPAY-REFUND-');
    });

    it('should refund Momo payment successfully', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'momo',
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);
      orderRepository.save.mockResolvedValue({
        ...paidOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      } as any);

      const result = await service.refundPayment(refundDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('MOMO-REFUND-');
    });

    it('should throw BadRequestException for unsupported payment method', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'bitcoin',
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);

      await expect(service.refundPayment(refundDto, mockUser)).rejects.toThrow(
        'Unsupported payment method: bitcoin',
      );
    });

    it('should use full order total when amount not specified', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'cod',
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);
      orderRepository.save.mockResolvedValue({
        ...paidOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      } as any);

      const partialDto = { orderId: 'order-1', reason: 'Customer request' };
      const result = await service.refundPayment(partialDto as RefundDto, mockUser);

      expect(result.success).toBe(true);
    });

    it('should handle null paymentMethod gracefully', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: null,
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);

      await expect(service.refundPayment(refundDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should handle undefined paymentMethod gracefully', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: undefined,
      });
      orderRepository.findOne.mockResolvedValue(paidOrder as any);

      await expect(service.refundPayment(refundDto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty orderId', async () => {
      const dto: ProcessPaymentDto = {
        orderId: '',
        amount: 100,
        paymentMethod: 'cod',
      };

      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.processPayment(dto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should handle null user', async () => {
      const dto: ProcessPaymentDto = {
        orderId: 'order-1',
        amount: 100,
        paymentMethod: 'cod',
      };

      await expect(service.processPayment(dto, null as any)).rejects.toThrow();
    });

    it('should handle zero amount', async () => {
      const zeroAmountOrder = createMockOrder({ total: 0, paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(zeroAmountOrder as any);

      const dto: ProcessPaymentDto = {
        orderId: 'order-1',
        amount: 0,
        paymentMethod: 'cod',
      };

      orderRepository.save.mockResolvedValue({
        ...zeroAmountOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const result = await service.processPayment(dto, mockUser);
      expect(result.success).toBe(true);
    });

    it('should handle negative amount', async () => {
      const mockOrder = createMockOrder({ paymentStatus: PaymentStatus.PENDING });
      orderRepository.findOne.mockResolvedValue(mockOrder as any);

      const dto: ProcessPaymentDto = {
        orderId: 'order-1',
        amount: -100,
        paymentMethod: 'cod',
      };

      await expect(service.processPayment(dto, mockUser)).rejects.toThrow(
        'Payment amount -100 does not match order total 100',
      );
    });

    it('should handle very large amount', async () => {
      const largeAmount = 999999999;
      const largeAmountOrder = createMockOrder({
        total: largeAmount,
        paymentStatus: PaymentStatus.PENDING,
      });
      orderRepository.findOne.mockResolvedValue(largeAmountOrder as any);
      orderRepository.save.mockResolvedValue({
        ...largeAmountOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      const dto: ProcessPaymentDto = {
        orderId: 'order-1',
        amount: largeAmount,
        paymentMethod: 'cod',
      };

      const result = await service.processPayment(dto, mockUser);
      expect(result.success).toBe(true);
    });
  });
});

/**
 * PaymentService Unit Tests
 * Coverage target: >90%
 * 
 * Test cases:
 * 1. processPayment - All payment methods (COD, Stripe, PayPal, VNPay, Momo)
 * 2. processPayment - Error cases (not found, already paid, amount mismatch, unsupported)
 * 3. verifyPayment - All payment methods
 * 4. verifyPayment - Error cases
 * 5. refundPayment - All payment methods
 * 6. refundPayment - Error cases (not found, not paid, unsupported)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Order } from './entities/order.entity';
import { PermissionService } from '@common/security/permission.service';
import { PaymentStatus } from '../enums/ecommerce.enum';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockOrderRepository: any;
  let mockPermissionService: any;

  const mockUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'ORD-001',
    total: 100,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: null,
    paymentTransactionId: null,
    paidAt: null,
  };

  beforeEach(async () => {
    mockOrderRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };

    mockPermissionService = {
      checkPermission: jest.fn().mockResolvedValue(true),
      filterByTenant: jest.fn((user, query) => query),
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    it('should process COD payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.processPayment(
        {
          orderId: 'order-123',
          amount: 100,
          paymentMethod: 'cod',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('COD-');
      expect(result.message).toContain('Cash on delivery');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should process Stripe payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.processPayment(
        {
          orderId: 'order-123',
          amount: 100,
          paymentMethod: 'stripe',
          paymentToken: 'tok_123',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('STRIPE-');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should process PayPal payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.processPayment(
        {
          orderId: 'order-123',
          amount: 100,
          paymentMethod: 'paypal',
          paymentToken: 'tok_123',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('PAYPAL-');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should process VNPay payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.processPayment(
        {
          orderId: 'order-123',
          amount: 100,
          paymentMethod: 'vnpay',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('VNPAY-');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should process Momo payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.processPayment(
        {
          orderId: 'order-123',
          amount: 100,
          paymentMethod: 'momo',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('MOMO-');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should throw error when order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.processPayment(
          {
            orderId: 'non-existent',
            amount: 100,
            paymentMethod: 'cod',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when order already paid', async () => {
      mockOrderRepository.findOne.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      });

      await expect(
        service.processPayment(
          {
            orderId: 'order-123',
            amount: 100,
            paymentMethod: 'cod',
          },
          mockUser,
        ),
      ).rejects.toThrow('Order is already paid');
    });

    it('should throw error when amount mismatch', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });

      await expect(
        service.processPayment(
          {
            orderId: 'order-123',
            amount: 200,
            paymentMethod: 'cod',
          },
          mockUser,
        ),
      ).rejects.toThrow('does not match order total');
    });

    it('should throw error for unsupported payment method', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });

      await expect(
        service.processPayment(
          {
            orderId: 'order-123',
            amount: 100,
            paymentMethod: 'bitcoin',
          },
          mockUser,
        ),
      ).rejects.toThrow('Unsupported payment method');
    });
  });

  describe('verifyPayment', () => {
    it('should verify COD payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.verifyPayment(
        {
          orderId: 'order-123',
          transactionId: 'COD-ORD-001',
          paymentMethod: 'cod',
        },
        mockUser,
      );

      expect(result.verified).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.message).toContain('verified successfully');
    });

    it('should verify Stripe payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.verifyPayment(
        {
          orderId: 'order-123',
          transactionId: 'STRIPE-123',
          paymentMethod: 'stripe',
        },
        mockUser,
      );

      expect(result.verified).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should verify PayPal payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.verifyPayment(
        {
          orderId: 'order-123',
          transactionId: 'PAYPAL-123',
          paymentMethod: 'paypal',
        },
        mockUser,
      );

      expect(result.verified).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should verify VNPay payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.verifyPayment(
        {
          orderId: 'order-123',
          transactionId: 'VNPAY-123',
          paymentMethod: 'vnpay',
        },
        mockUser,
      );

      expect(result.verified).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should verify Momo payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });

      const result = await service.verifyPayment(
        {
          orderId: 'order-123',
          transactionId: 'MOMO-123',
          paymentMethod: 'momo',
        },
        mockUser,
      );

      expect(result.verified).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should throw error when order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.verifyPayment(
          {
            orderId: 'non-existent',
            transactionId: 'TXN-123',
            paymentMethod: 'cod',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for unsupported payment method', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });

      await expect(
        service.verifyPayment(
          {
            orderId: 'order-123',
            transactionId: 'TXN-123',
            paymentMethod: 'bitcoin',
          },
          mockUser,
        ),
      ).rejects.toThrow('Unsupported payment method');
    });

    it('should not update order if already paid', async () => {
      mockOrderRepository.findOne.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      });

      const result = await service.verifyPayment(
        {
          orderId: 'order-123',
          transactionId: 'COD-ORD-001',
          paymentMethod: 'cod',
        },
        mockUser,
      );

      expect(result.verified).toBe(true);
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('refundPayment', () => {
    const paidOrder = {
      ...mockOrder,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'cod',
      paymentTransactionId: 'COD-ORD-001',
    };

    it('should refund COD payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...paidOrder });
      mockOrderRepository.save.mockResolvedValue({ ...paidOrder, paymentStatus: PaymentStatus.REFUNDED });

      const result = await service.refundPayment(
        {
          orderId: 'order-123',
          reason: 'Customer request',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('COD-REFUND-');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should refund Stripe payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...paidOrder, paymentMethod: 'stripe' });
      mockOrderRepository.save.mockResolvedValue({ ...paidOrder, paymentStatus: PaymentStatus.REFUNDED });

      const result = await service.refundPayment(
        {
          orderId: 'order-123',
          reason: 'Customer request',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('STRIPE-REFUND-');
    });

    it('should refund PayPal payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...paidOrder, paymentMethod: 'paypal' });
      mockOrderRepository.save.mockResolvedValue({ ...paidOrder, paymentStatus: PaymentStatus.REFUNDED });

      const result = await service.refundPayment(
        {
          orderId: 'order-123',
          reason: 'Customer request',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('PAYPAL-REFUND-');
    });

    it('should refund VNPay payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...paidOrder, paymentMethod: 'vnpay' });
      mockOrderRepository.save.mockResolvedValue({ ...paidOrder, paymentStatus: PaymentStatus.REFUNDED });

      const result = await service.refundPayment(
        {
          orderId: 'order-123',
          reason: 'Customer request',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('VNPAY-REFUND-');
    });

    it('should refund Momo payment successfully', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...paidOrder, paymentMethod: 'momo' });
      mockOrderRepository.save.mockResolvedValue({ ...paidOrder, paymentStatus: PaymentStatus.REFUNDED });

      const result = await service.refundPayment(
        {
          orderId: 'order-123',
          reason: 'Customer request',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('MOMO-REFUND-');
    });

    it('should refund with custom amount', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...paidOrder });
      mockOrderRepository.save.mockResolvedValue({ ...paidOrder, paymentStatus: PaymentStatus.REFUNDED });

      const result = await service.refundPayment(
        {
          orderId: 'order-123',
          amount: 50,
          reason: 'Partial refund',
        },
        mockUser,
      );

      expect(result.success).toBe(true);
    });

    it('should throw error when order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refundPayment(
          {
            orderId: 'non-existent',
            reason: 'Test',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when order not paid', async () => {
      mockOrderRepository.findOne.mockResolvedValue({ ...mockOrder });

      await expect(
        service.refundPayment(
          {
            orderId: 'order-123',
            reason: 'Test',
          },
          mockUser,
        ),
      ).rejects.toThrow('Order must be paid before refunding');
    });

    it('should throw error for unsupported payment method', async () => {
      mockOrderRepository.findOne.mockResolvedValue({
        ...paidOrder,
        paymentMethod: 'bitcoin',
      });

      await expect(
        service.refundPayment(
          {
            orderId: 'order-123',
            reason: 'Test',
          },
          mockUser,
        ),
      ).rejects.toThrow('Unsupported payment method');
    });
  });
});

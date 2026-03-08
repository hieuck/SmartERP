import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from '../../../common/security/permission.service';
import { Order, PaymentStatus } from './entities/order.entity';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let orderRepository: Repository<Order>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant1',
    roles: ['user'],
  } as any;

  const mockOrderRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockPermissionService = {
    canRead: jest.fn().mockResolvedValue(true),
    canWrite: jest.fn().mockResolvedValue(true),
    canDelete: jest.fn().mockResolvedValue(true),
    buildSecureQuery: jest.fn((qb, user) => qb),
  };

  beforeEach(async () => {
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
    orderRepository = module.get(getRepositoryToken(Order));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    it('should process COD payment successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        total: 100,
        paymentStatus: PaymentStatus.PENDING,
      };

      const dto = {
        orderId: 'order-1',
        paymentMethod: 'cod',
        amount: 100,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      });

      const result = await service.processPayment(dto, mockUser);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('COD');
    });

    it('should throw BadRequestException if order not found', async () => {
      const dto = {
        orderId: 'invalid-order',
        paymentMethod: 'cod',
        amount: 100,
      };

      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.processPayment(dto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already paid', async () => {
      const mockOrder = {
        id: 'order-1',
        total: 100,
        paymentStatus: PaymentStatus.PAID,
      };

      const dto = {
        orderId: 'order-1',
        paymentMethod: 'cod',
        amount: 100,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.processPayment(dto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount mismatch', async () => {
      const mockOrder = {
        id: 'order-1',
        total: 100,
        paymentStatus: PaymentStatus.PENDING,
      };

      const dto = {
        orderId: 'order-1',
        paymentMethod: 'cod',
        amount: 200,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.processPayment(dto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        paymentStatus: PaymentStatus.PENDING,
      };

      const dto = {
        orderId: 'order-1',
        transactionId: 'txn-123',
        paymentMethod: 'stripe',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      });

      const result = await service.verifyPayment(dto, mockUser);

      expect(result.verified).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
    });
  });

  describe('refundPayment', () => {
    it('should refund payment successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        total: 100,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'stripe',
      };

      const dto = {
        orderId: 'order-1',
        reason: 'Defective product',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      });

      const result = await service.refundPayment(dto, mockUser);

      expect(result.success).toBe(true);
      expect(result.refundId).toContain('REFUND');
    });

    it('should throw BadRequestException if order not paid', async () => {
      const mockOrder = {
        id: 'order-1',
        paymentStatus: PaymentStatus.PENDING,
      };

      const dto = {
        orderId: 'order-1',
        reason: 'Test',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.refundPayment(dto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });
});

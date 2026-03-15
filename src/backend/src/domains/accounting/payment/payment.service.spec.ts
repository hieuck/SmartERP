import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<Repository<Payment>>;
  let cacheService: jest.Mocked<CacheService>;
  let _permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['user'],
  };

  const mockPayment: Payment = {
    id: 'payment-1',
    orderId: 'order-1',
    amount: 100,
    status: 'pending',
    tenantId: 'tenant-1',
    createdBy: 'user-1',
  } as Payment;

  beforeEach(async () => {
    const mockPaymentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const mockCache = {
      getOrSet: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const mockPermission = {
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((_user, where) => where),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepo,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: PermissionService,
          useValue: mockPermission,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepository = module.get(getRepositoryToken(Payment));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should find all payments', async () => {
      paymentRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([mockPayment]);
      expect(paymentRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no payments', async () => {
      paymentRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should find payment by id with cache', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(mockPayment);
        return fn();
      });

      const result = await service.findOne(mockUser, 'payment-1');

      expect(result).toEqual(mockPayment);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(null);
        return fn();
      });

      await expect(service.findOne(mockUser, 'payment-999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUser, 'payment-999')).rejects.toThrow(
        'Payment with ID payment-999 not found',
      );
    });

    it('should handle null id', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(null);
        return fn();
      });

      await expect(service.findOne(mockUser, null as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle empty id', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(null);
        return fn();
      });

      await expect(service.findOne(mockUser, '')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrder', () => {
    it('should find payments by order id', async () => {
      paymentRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.findByOrder(mockUser, 'order-1');

      expect(result).toEqual([mockPayment]);
      expect(paymentRepository.find).toHaveBeenCalledWith({
        where: { orderId: 'order-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no payments for order', async () => {
      paymentRepository.find.mockResolvedValue([]);

      const result = await service.findByOrder(mockUser, 'order-999');

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find payments by status', async () => {
      paymentRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.findByStatus(mockUser, 'pending');

      expect(result).toEqual([mockPayment]);
      expect(paymentRepository.find).toHaveBeenCalledWith({
        where: { status: 'pending' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no payments with status', async () => {
      paymentRepository.find.mockResolvedValue([]);

      const result = await service.findByStatus(mockUser, 'completed');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create payment successfully', async () => {
      paymentRepository.save.mockResolvedValue(mockPayment);

      const data = { orderId: 'order-1', amount: 100 };
      const result = await service.create(mockUser, data);

      expect(result).toEqual(mockPayment);
      expect(paymentRepository.save).toHaveBeenCalledWith({
        ...data,
        status: 'pending',
        tenantId: 'tenant-1',
        createdBy: 'user-1',
      });
    });

    it('should use provided status', async () => {
      paymentRepository.save.mockResolvedValue(mockPayment);

      const data = { orderId: 'order-1', amount: 100, status: 'completed' };
      await service.create(mockUser, data);

      expect(paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' }),
      );
    });

    it('should handle zero amount', async () => {
      paymentRepository.save.mockResolvedValue(mockPayment);

      const data = { orderId: 'order-1', amount: 0 };
      const result = await service.create(mockUser, data);

      expect(result).toBeDefined();
    });

    it('should handle negative amount', async () => {
      paymentRepository.save.mockResolvedValue(mockPayment);

      const data = { orderId: 'order-1', amount: -100 };
      const result = await service.create(mockUser, data);

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update payment successfully', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(mockPayment);
        return fn();
      });
      paymentRepository.save.mockResolvedValue({ ...mockPayment, amount: 200 });
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.update(mockUser, 'payment-1', { amount: 200 });

      expect(result.amount).toBe(200);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(null);
        return fn();
      });

      await expect(service.update(mockUser, 'payment-999', { amount: 200 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove payment successfully', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(mockPayment);
        return fn();
      });
      paymentRepository.remove.mockResolvedValue(mockPayment);
      cacheService.del.mockResolvedValue(undefined);

      await service.remove(mockUser, 'payment-1');

      expect(paymentRepository.remove).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(null);
        return fn();
      });

      await expect(service.remove(mockUser, 'payment-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('should complete payment successfully', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(mockPayment);
        return fn();
      });
      paymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
        transactionId: 'TXN-123',
        paymentDate: new Date(),
      });
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.complete(mockUser, 'payment-1', 'TXN-123');

      expect(result.status).toBe('completed');
      expect(result.transactionId).toBe('TXN-123');
      expect(result.paymentDate).toBeDefined();
    });

    it('should throw BadRequestException when payment not pending or processing', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue({ ...mockPayment, status: 'completed' });
        return fn();
      });

      await expect(service.complete(mockUser, 'payment-1', 'TXN-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.complete(mockUser, 'payment-1', 'TXN-123')).rejects.toThrow(
        'Only pending or processing payments can be completed',
      );
    });

    it('should complete processing payment', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue({ ...mockPayment, status: 'processing' });
        return fn();
      });
      paymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
        paymentDate: new Date(),
      });
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.complete(mockUser, 'payment-1', 'TXN-123');

      expect(result.status).toBe('completed');
    });
  });

  describe('fail', () => {
    beforeEach(() => {
      // Reset all mocks before each test in this describe block
      jest.clearAllMocks();
    });

    it('should fail payment successfully', async () => {
      const pendingPayment = { ...mockPayment, status: 'pending' };
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(pendingPayment);
        return fn();
      });
      paymentRepository.save.mockResolvedValue({
        ...pendingPayment,
        status: 'failed',
        notes: '\nFailed: Insufficient funds',
      });
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.fail(mockUser, 'payment-1', 'Insufficient funds');

      expect(result.status).toBe('failed');
      expect(result.notes).toContain('Failed: Insufficient funds');
    });

    it('should throw BadRequestException when payment already completed', async () => {
      const completedPayment = { ...mockPayment, status: 'completed' };
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(completedPayment);
        return fn();
      });

      await expect(service.fail(mockUser, 'payment-1', 'Reason')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.fail(mockUser, 'payment-1', 'Reason')).rejects.toThrow(
        'Cannot fail a completed payment',
      );
    });

    it('should append to existing notes', async () => {
      const paymentWithNotes = { ...mockPayment, status: 'pending', notes: 'Existing notes' };
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(paymentWithNotes);
        return fn();
      });
      paymentRepository.save.mockResolvedValue({
        ...mockPayment,
        notes: 'Existing notes\nFailed: New reason',
      });
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.fail(mockUser, 'payment-1', 'New reason');

      expect(result.notes).toContain('Existing notes');
      expect(result.notes).toContain('Failed: New reason');
    });
  });

  describe('refund', () => {
    beforeEach(() => {
      // Reset all mocks before each test in this describe block
      jest.clearAllMocks();
    });

    it('should refund payment successfully', async () => {
      const completedPayment = { ...mockPayment, status: 'completed' };
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(completedPayment);
        return fn();
      });
      paymentRepository.save.mockResolvedValue({
        ...completedPayment,
        status: 'refunded',
      });
      cacheService.del.mockResolvedValue(undefined);

      const result = await service.refund(mockUser, 'payment-1');

      expect(result.status).toBe('refunded');
    });

    it('should throw BadRequestException when payment not completed', async () => {
      const pendingPayment = { ...mockPayment, status: 'pending' };
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        paymentRepository.findOne.mockResolvedValue(pendingPayment);
        return fn();
      });

      await expect(service.refund(mockUser, 'payment-1')).rejects.toThrow(BadRequestException);
      await expect(service.refund(mockUser, 'payment-1')).rejects.toThrow(
        'Only completed payments can be refunded',
      );
    });
  });

  describe('count', () => {
    it('should count payments', async () => {
      paymentRepository.find.mockResolvedValue([mockPayment, mockPayment]);

      const result = await service.count(mockUser);

      expect(result).toBe(2);
    });

    it('should return 0 when no payments', async () => {
      paymentRepository.find.mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getTotalAmount', () => {
    it('should calculate total amount', async () => {
      paymentRepository.find.mockResolvedValue([
        { ...mockPayment, amount: 100 },
        { ...mockPayment, amount: 200 },
        { ...mockPayment, amount: 150 },
      ]);

      const result = await service.getTotalAmount(mockUser);

      expect(result).toBe(450);
    });

    it('should filter by status', async () => {
      paymentRepository.find.mockResolvedValue([
        { ...mockPayment, amount: 100, status: 'completed' },
        { ...mockPayment, amount: 200, status: 'completed' },
      ]);

      const result = await service.getTotalAmount(mockUser, 'completed');

      expect(result).toBe(300);
    });

    it('should return 0 when no payments', async () => {
      paymentRepository.find.mockResolvedValue([]);

      const result = await service.getTotalAmount(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getPaymentsByDateRange', () => {
    it('should get payments by date range', async () => {
      paymentRepository.find.mockResolvedValue([mockPayment]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getPaymentsByDateRange(mockUser, startDate, endDate);

      expect(result).toEqual([mockPayment]);
      expect(paymentRepository.find).toHaveBeenCalledWith({
        where: {
          paymentDate: Between(startDate, endDate),
        },
        order: { paymentDate: 'DESC' },
      });
    });

    it('should return empty array when no payments in range', async () => {
      paymentRepository.find.mockResolvedValue([]);

      const result = await service.getPaymentsByDateRange(
        mockUser,
        new Date('2025-01-01'),
        new Date('2025-12-31'),
      );

      expect(result).toEqual([]);
    });
  });

  describe('getPaymentStatistics', () => {
    it('should calculate payment statistics', async () => {
      paymentRepository.find.mockResolvedValue([
        { ...mockPayment, amount: 100, status: 'completed' },
        { ...mockPayment, amount: 200, status: 'completed' },
        { ...mockPayment, amount: 50, status: 'pending' },
        { ...mockPayment, amount: 75, status: 'failed' },
        { ...mockPayment, amount: 100, status: 'refunded' },
      ]);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result.total).toBe(5);
      expect(result.completed).toBe(2);
      expect(result.pending).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.refunded).toBe(1);
      expect(result.totalAmount).toBe(525);
      expect(result.completedAmount).toBe(300);
      expect(result.successRate).toBe(40);
    });

    it('should handle empty payments', async () => {
      paymentRepository.find.mockResolvedValue([]);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result.total).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it('should calculate 100% success rate', async () => {
      paymentRepository.find.mockResolvedValue([
        { ...mockPayment, status: 'completed' },
        { ...mockPayment, status: 'completed' },
      ]);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result.successRate).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large amount', async () => {
      paymentRepository.save.mockResolvedValue(mockPayment);

      const data = { orderId: 'order-1', amount: 999999999 };
      const result = await service.create(mockUser, data);

      expect(result).toBeDefined();
    });
  });
});

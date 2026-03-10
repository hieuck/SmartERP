import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPayment = {
    id: '1',
    tenantId: 'tenant-1',
    orderId: 'order-1',
    amount: 1000,
    status: 'pending',
    paymentMethod: 'cash',
    transactionId: null,
    paymentDate: null,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  const mockPermissionService = {
    checkPermission: jest.fn().mockResolvedValue(true),
    hasPermission: jest.fn().mockResolvedValue(true),
    buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
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

  describe('findAll', () => {
    it('should return all payments for a tenant', async () => {
      mockRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([mockPayment]);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockPayment);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockPayment);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrder', () => {
    it('should return payments for an order', async () => {
      mockRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.findByOrder(mockUser, 'order-1');

      expect(result).toEqual([mockPayment]);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findByStatus', () => {
    it('should return payments by status', async () => {
      mockRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.findByStatus(mockUser, 'pending');

      expect(result).toEqual([mockPayment]);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createData = {
        orderId: 'order-1',
        amount: 1000,
        paymentMethod: 'cash',
      };

      mockRepository.save.mockResolvedValue({ ...mockPayment, ...createData });

      const result = await service.create(mockUser, createData);

      expect(result).toEqual({ ...mockPayment, ...createData });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create payment with custom status', async () => {
      const createData = {
        orderId: 'order-1',
        amount: 1000,
        paymentMethod: 'cash',
        status: 'completed',
      };

      mockRepository.save.mockResolvedValue({ ...mockPayment, ...createData });

      const result = await service.create(mockUser, createData);

      expect(result.status).toBe('completed');
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const updateData = { amount: 1500 };
      mockCacheService.getOrSet.mockResolvedValue(mockPayment);
      mockRepository.save.mockResolvedValue({ ...mockPayment, ...updateData });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update(mockUser, '1', updateData);

      expect(result.amount).toBe(1500);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUser, '999', { amount: 1500 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a payment', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockPayment);
      mockRepository.findOne.mockResolvedValue(mockPayment);
      mockRepository.remove.mockResolvedValue(mockPayment);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove(mockUser, '1');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockPayment);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('should complete a pending payment', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockPayment);
      mockRepository.save.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
        transactionId: 'txn-123',
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.complete(mockUser, '1', 'txn-123');

      expect(result.status).toBe('completed');
      expect(result.transactionId).toBe('txn-123');
      expect(result.paymentDate).toBeDefined();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should complete a processing payment', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...mockPayment,
        status: 'processing',
      });
      mockRepository.save.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.complete(mockUser, '1', 'txn-123');

      expect(result.status).toBe('completed');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment is not pending or processing', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
      });

      await expect(service.complete(mockUser, '1', 'txn-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('fail', () => {
    it('should fail a payment', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: 'pending',
      };
      mockCacheService.getOrSet.mockResolvedValue(pendingPayment);
      mockRepository.save.mockResolvedValue({
        ...pendingPayment,
        status: 'failed',
        notes: '\nFailed: Insufficient funds',
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.fail(mockUser, '1', 'Insufficient funds');

      expect(result.status).toBe('failed');
      expect(result.notes).toContain('Failed: Insufficient funds');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment is completed', async () => {
      const completedPayment = {
        ...mockPayment,
        status: 'completed',
      };
      mockCacheService.getOrSet.mockResolvedValue(completedPayment);

      await expect(service.fail(mockUser, '1', 'Test reason')).rejects.toThrow(BadRequestException);
    });
  });

  describe('refund', () => {
    it('should refund a completed payment', async () => {
      const completedPayment = {
        ...mockPayment,
        status: 'completed',
      };
      mockCacheService.getOrSet.mockResolvedValue(completedPayment);
      mockRepository.save.mockResolvedValue({
        ...completedPayment,
        status: 'refunded',
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.refund(mockUser, '1');

      expect(result.status).toBe('refunded');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment is not completed', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: 'pending',
      };
      mockCacheService.getOrSet.mockResolvedValue(pendingPayment);

      await expect(service.refund(mockUser, '1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('count', () => {
    it('should return payment count', async () => {
      mockRepository.find.mockResolvedValue([mockPayment, mockPayment]);

      const result = await service.count(mockUser);

      expect(result).toBe(2);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('getTotalAmount', () => {
    it('should return total amount for all payments', async () => {
      mockRepository.find.mockResolvedValue([
        { ...mockPayment, amount: 1000 },
        { ...mockPayment, amount: 2000 },
        { ...mockPayment, amount: 1500 },
      ]);

      const result = await service.getTotalAmount(mockUser);

      expect(result).toBe(4500);
    });

    it('should return total amount for specific status', async () => {
      mockRepository.find.mockResolvedValue([
        { ...mockPayment, amount: 1000, status: 'completed' },
        { ...mockPayment, amount: 2000, status: 'completed' },
      ]);

      const result = await service.getTotalAmount(mockUser, 'completed');

      expect(result).toBe(3000);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('getPaymentsByDateRange', () => {
    it('should return payments within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.getPaymentsByDateRange(mockUser, startDate, endDate);

      expect(result).toEqual([mockPayment]);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('getPaymentStatistics', () => {
    it('should return payment statistics', async () => {
      mockRepository.find.mockResolvedValue([
        { ...mockPayment, status: 'completed', amount: 1000 },
        { ...mockPayment, status: 'completed', amount: 2000 },
        { ...mockPayment, status: 'pending', amount: 500 },
        { ...mockPayment, status: 'failed', amount: 300 },
        { ...mockPayment, status: 'refunded', amount: 200 },
      ]);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result).toEqual({
        total: 5,
        completed: 2,
        pending: 1,
        failed: 1,
        refunded: 1,
        totalAmount: 4000,
        completedAmount: 3000,
        successRate: 40,
      });
    });

    it('should handle empty payment list', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        refunded: 0,
        totalAmount: 0,
        completedAmount: 0,
        successRate: 0,
      });
    });
  });
});

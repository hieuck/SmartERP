import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between } from 'typeorm';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

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

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
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
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all payments for a tenant', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockPayment]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([mockPayment]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('payment');
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockPayment);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockPayment);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrder', () => {
    it('should return payments for an order', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockPayment]);

      const result = await service.findByOrder('order-1', mockUser);

      expect(result).toEqual([mockPayment]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('payment');
    });
  });

  describe('findByStatus', () => {
    it('should return payments by status', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockPayment]);

      const result = await service.findByStatus('pending', mockUser);

      expect(result).toEqual([mockPayment]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('payment');
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createData = {
        orderId: 'order-1',
        amount: 1000,
        paymentMethod: 'cash',
      };

      mockRepository.create.mockReturnValue({ ...mockPayment, ...createData });
      mockRepository.save.mockResolvedValue({ ...mockPayment, ...createData });

      const result = await service.create(createData, mockUser);

      expect(result).toEqual({ ...mockPayment, ...createData });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createData,
        tenantId: 'tenant-1',
        status: 'pending',
      });
    });

    it('should create payment with custom status', async () => {
      const createData = {
        orderId: 'order-1',
        amount: 1000,
        paymentMethod: 'cash',
        status: 'completed',
      };

      mockRepository.create.mockReturnValue({ ...mockPayment, ...createData });
      mockRepository.save.mockResolvedValue({ ...mockPayment, ...createData });

      const result = await service.create(createData, mockUser);

      expect(result.status).toBe('completed');
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const updateData = { amount: 1500 };
      mockCacheService.getOrSet.mockResolvedValue(mockPayment);
      mockRepository.save.mockResolvedValue({ ...mockPayment, ...updateData });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateData, mockUser);

      expect(result.amount).toBe(1500);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', { amount: 1500 }, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a payment', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockPayment);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove('1', mockUser);

      expect(mockRepository.softDelete).toHaveBeenCalledWith('1');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', mockUser)).rejects.toThrow(NotFoundException);
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

      const result = await service.complete('1', 'txn-123', mockUser);

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

      const result = await service.complete('1', 'txn-123', mockUser);

      expect(result.status).toBe('completed');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment is not pending or processing', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
      });

      await expect(service.complete('1', 'txn-123', mockUser)).rejects.toThrow(
        BadRequestException,
      );
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

      const result = await service.fail('1', 'Insufficient funds', mockUser);

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

      await expect(service.fail('1', 'Test reason', mockUser)).rejects.toThrow(
        BadRequestException,
      );
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

      const result = await service.refund('1', mockUser);

      expect(result.status).toBe('refunded');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment is not completed', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: 'pending',
      };
      mockCacheService.getOrSet.mockResolvedValue(pendingPayment);

      await expect(service.refund('1', mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('count', () => {
    it('should return payment count', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count(mockUser);

      expect(result).toBe(10);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
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
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', status: 'completed' },
      });
    });
  });

  describe('getPaymentsByDateRange', () => {
    it('should return payments within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockRepository.find.mockResolvedValue([mockPayment]);

      const result = await service.getPaymentsByDateRange(startDate, endDate, mockUser);

      expect(result).toEqual([mockPayment]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          paymentDate: Between(startDate, endDate),
        },
        order: { paymentDate: 'DESC' },
      });
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

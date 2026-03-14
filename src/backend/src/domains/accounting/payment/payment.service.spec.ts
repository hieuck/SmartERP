import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';

// Mock SecureRepository
jest.mock('@/common/security/secure-repository');

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<Repository<Payment>>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;

  // Mock user
  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['admin'],
  } as any;

  // Helper to create fresh mock payment
  const createMockPayment = (overrides = {}): Payment => ({
    id: 'payment-1',
    orderId: 'order-1',
    amount: 1000,
    paymentMethod: 'credit_card',
    status: 'pending',
    paymentDate: null,
    transactionId: null,
    currency: 'VND',
    notes: null,
    metadata: null,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  } as any);

  beforeEach(async () => {
    // Create mock repositories
    const mockPaymentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockCache = {
      getOrSet: jest.fn(),
      del: jest.fn(),
    };

    const mockPermission = {
      checkPermission: jest.fn(),
    };

    // Mock SecureRepository methods
    const mockSecureRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    (SecureRepository as jest.Mock).mockImplementation(() => mockSecureRepo);

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
    it('should return all payments ordered by createdAt DESC', async () => {
      const mockPayments = [
        createMockPayment(),
        createMockPayment({ id: 'payment-2', orderId: 'order-2' }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.findAll(mockUser);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockPayments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no payments found', async () => {
      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return payment from cache if exists', async () => {
      const mockPayment = createMockPayment();

      cacheService.getOrSet.mockResolvedValue(mockPayment);

      const result = await service.findOne(mockUser, 'payment-1');

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });

    it('should fetch payment from database if not in cache', async () => {
      const mockPayment = createMockPayment();

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);

      const result = await service.findOne(mockUser, 'payment-1');

      expect(secureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'payment-1' },
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException when payment not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockUser, 'nonexistent')).rejects.toThrow(
        'Payment with ID nonexistent not found',
      );
    });
  });

  describe('findByOrder', () => {
    it('should return payments for specific order', async () => {
      const mockPayments = [
        createMockPayment({ orderId: 'order-1' }),
        createMockPayment({ id: 'payment-2', orderId: 'order-1' }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.findByOrder(mockUser, 'order-1');

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { orderId: 'order-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockPayments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no payments for order', async () => {
      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.findByOrder(mockUser, 'order-999');

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should return payments with specific status', async () => {
      const mockPayments = [
        createMockPayment({ status: 'completed' }),
        createMockPayment({ id: 'payment-2', status: 'completed' }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.findByStatus(mockUser, 'completed');

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { status: 'completed' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockPayments);
    });

    it('should return empty array when no payments with status', async () => {
      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.findByStatus(mockUser, 'refunded');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create payment with default status pending', async () => {
      const dto = {
        orderId: 'order-1',
        amount: 1000,
        paymentMethod: 'credit_card',
        currency: 'VND',
      };

      const mockPayment = createMockPayment(dto);

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.save.mockResolvedValue(mockPayment);

      const result = await service.create(mockUser, dto as any);

      expect(secureRepo.save).toHaveBeenCalledWith(mockUser, {
        ...dto,
        status: 'pending',
      });
      expect(result).toEqual(mockPayment);
      expect(result.status).toBe('pending');
    });

    it('should create payment with custom status', async () => {
      const dto = {
        orderId: 'order-1',
        amount: 1000,
        paymentMethod: 'bank_transfer',
        status: 'processing',
      };

      const mockPayment = createMockPayment(dto);

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.save.mockResolvedValue(mockPayment);

      const result = await service.create(mockUser, dto as any);

      expect(result.status).toBe('processing');
    });
  });

  describe('update', () => {
    it('should update payment and invalidate cache', async () => {
      const mockPayment = createMockPayment();
      const updateData = { notes: 'Updated notes' };

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);
      secureRepo.save.mockResolvedValue({
        ...mockPayment,
        ...updateData,
      });

      const result = await service.update(mockUser, 'payment-1', updateData);

      expect(secureRepo.save).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw NotFoundException when payment not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockUser, 'nonexistent', { notes: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove payment and invalidate cache', async () => {
      const mockPayment = createMockPayment();

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);
      secureRepo.remove.mockResolvedValue(mockPayment);

      await service.remove(mockUser, 'payment-1');

      expect(secureRepo.remove).toHaveBeenCalledWith(mockUser, mockPayment);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('complete', () => {
    it('should complete pending payment', async () => {
      const mockPayment = createMockPayment({ status: 'pending' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);
      secureRepo.save.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
        transactionId: 'txn-123',
        paymentDate: expect.any(Date),
      });

      const result = await service.complete(mockUser, 'payment-1', 'txn-123');

      expect(result.status).toBe('completed');
      expect(result.transactionId).toBe('txn-123');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should complete processing payment', async () => {
      const mockPayment = createMockPayment({ status: 'processing' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);
      secureRepo.save.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
        transactionId: 'txn-456',
      });

      const result = await service.complete(mockUser, 'payment-1', 'txn-456');

      expect(result.status).toBe('completed');
    });

    it('should throw BadRequestException when payment is completed', async () => {
      const mockPayment = createMockPayment({ status: 'completed' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);

      await expect(
        service.complete(mockUser, 'payment-1', 'txn-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.complete(mockUser, 'payment-1', 'txn-123'),
      ).rejects.toThrow('Only pending or processing payments can be completed');
    });

    it('should throw BadRequestException when payment is failed', async () => {
      const mockPayment = createMockPayment({ status: 'failed' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);

      await expect(
        service.complete(mockUser, 'payment-1', 'txn-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('fail', () => {
    it('should fail pending payment with reason', async () => {
      const mockPayment = createMockPayment({ status: 'pending' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);
      secureRepo.save.mockResolvedValue({
        ...mockPayment,
        status: 'failed',
        notes: '\nFailed: Insufficient funds',
      });

      const result = await service.fail(mockUser, 'payment-1', 'Insufficient funds');

      expect(result.status).toBe('failed');
      expect(result.notes).toContain('Failed: Insufficient funds');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should append failure reason to existing notes', async () => {
      const mockPayment = createMockPayment({
        status: 'processing',
        notes: 'Initial notes',
      });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);
      secureRepo.save.mockResolvedValue({
        ...mockPayment,
        status: 'failed',
        notes: 'Initial notes\nFailed: Card declined',
      });

      const result = await service.fail(mockUser, 'payment-1', 'Card declined');

      expect(result.notes).toContain('Initial notes');
      expect(result.notes).toContain('Failed: Card declined');
    });

    it('should throw BadRequestException when payment is completed', async () => {
      const mockPayment = createMockPayment({ status: 'completed' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);

      await expect(
        service.fail(mockUser, 'payment-1', 'Test reason'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.fail(mockUser, 'payment-1', 'Test reason'),
      ).rejects.toThrow('Cannot fail a completed payment');
    });
  });

  describe('refund', () => {
    it('should refund completed payment', async () => {
      const mockPayment = createMockPayment({
        status: 'completed',
        transactionId: 'txn-123',
      });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);
      secureRepo.save.mockResolvedValue({
        ...mockPayment,
        status: 'refunded',
      });

      const result = await service.refund(mockUser, 'payment-1');

      expect(result.status).toBe('refunded');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment is not completed', async () => {
      const mockPayment = createMockPayment({ status: 'pending' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);

      await expect(service.refund(mockUser, 'payment-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refund(mockUser, 'payment-1')).rejects.toThrow(
        'Only completed payments can be refunded',
      );
    });

    it('should throw BadRequestException when payment is failed', async () => {
      const mockPayment = createMockPayment({ status: 'failed' });

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.findOne.mockResolvedValue(mockPayment);

      await expect(service.refund(mockUser, 'payment-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('count', () => {
    it('should return total count of payments', async () => {
      const mockPayments = [
        createMockPayment(),
        createMockPayment({ id: 'payment-2' }),
        createMockPayment({ id: 'payment-3' }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.count(mockUser);

      expect(result).toBe(3);
    });

    it('should return 0 when no payments', async () => {
      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getTotalAmount', () => {
    it('should return total amount of all payments', async () => {
      const mockPayments = [
        createMockPayment({ amount: 1000 }),
        createMockPayment({ id: 'payment-2', amount: 2000 }),
        createMockPayment({ id: 'payment-3', amount: 1500 }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.getTotalAmount(mockUser);

      expect(result).toBe(4500);
    });

    it('should return total amount for specific status', async () => {
      const mockPayments = [
        createMockPayment({ amount: 1000, status: 'completed' }),
        createMockPayment({ id: 'payment-2', amount: 2000, status: 'completed' }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.getTotalAmount(mockUser, 'completed');

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { status: 'completed' },
      });
      expect(result).toBe(3000);
    });

    it('should return 0 when no payments', async () => {
      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.getTotalAmount(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getPaymentsByDateRange', () => {
    it('should return payments within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockPayments = [
        createMockPayment({ paymentDate: new Date('2024-01-15') }),
        createMockPayment({ id: 'payment-2', paymentDate: new Date('2024-01-20') }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.getPaymentsByDateRange(mockUser, startDate, endDate);

      expect(secureRepo.find).toHaveBeenCalledWith(mockUser, {
        where: {
          paymentDate: Between(startDate, endDate),
        },
        order: { paymentDate: 'DESC' },
      });
      expect(result).toEqual(mockPayments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no payments in range', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.getPaymentsByDateRange(mockUser, startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe('getPaymentStatistics', () => {
    it('should return comprehensive payment statistics', async () => {
      const mockPayments = [
        createMockPayment({ amount: 1000, status: 'completed' }),
        createMockPayment({ id: 'payment-2', amount: 2000, status: 'completed' }),
        createMockPayment({ id: 'payment-3', amount: 1500, status: 'completed' }),
        createMockPayment({ id: 'payment-4', amount: 500, status: 'pending' }),
        createMockPayment({ id: 'payment-5', amount: 800, status: 'pending' }),
        createMockPayment({ id: 'payment-6', amount: 300, status: 'failed' }),
        createMockPayment({ id: 'payment-7', amount: 1000, status: 'refunded' }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result.total).toBe(7);
      expect(result.completed).toBe(3);
      expect(result.pending).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.refunded).toBe(1);
      expect(result.totalAmount).toBe(7100);
      expect(result.completedAmount).toBe(4500);
      expect(result.successRate).toBeCloseTo(42.86, 2);
    });

    it('should return zero statistics when no payments', async () => {
      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue([]);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.refunded).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.completedAmount).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it('should calculate 100% success rate when all completed', async () => {
      const mockPayments = [
        createMockPayment({ amount: 1000, status: 'completed' }),
        createMockPayment({ id: 'payment-2', amount: 2000, status: 'completed' }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result.successRate).toBe(100);
    });

    it('should handle mixed payment statuses correctly', async () => {
      const mockPayments = [
        createMockPayment({ amount: 1000, status: 'completed' }),
        createMockPayment({ id: 'payment-2', amount: 500, status: 'pending' }),
        createMockPayment({ id: 'payment-3', amount: 300, status: 'processing' }),
      ];

      const secureRepo = (service as any).securePaymentRepo;
      secureRepo.find.mockResolvedValue(mockPayments);

      const result = await service.getPaymentStatistics(mockUser);

      expect(result.total).toBe(3);
      expect(result.completed).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.successRate).toBeCloseTo(33.33, 2);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { createMockUser } from '@/common/test/test-helpers';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  const mockPaymentService = {
    findAll: jest.fn(),
    findByOrder: jest.fn(),
    findByStatus: jest.fn(),
    getPaymentStatistics: jest.fn(),
    count: jest.fn(),
    getTotalAmount: jest.fn(),
    getPaymentsByDateRange: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    complete: jest.fn(),
    fail: jest.fn(),
    refund: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockTenantId = 'tenant-123';
  const mockPaymentId = 'payment-123';
  const mockOrderId = 'order-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all payments for tenant', async () => {
      const mockPayments = [
        { id: '1', amount: 1000, status: 'completed' },
        { id: '2', amount: 2000, status: 'pending' },
      ];
      mockPaymentService.findAll.mockResolvedValue(mockPayments);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockPayments);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findByOrder', () => {
    it('should return payments for specific order', async () => {
      const mockPayments = [{ id: '1', orderId: mockOrderId, amount: 1000 }];
      mockPaymentService.findByOrder.mockResolvedValue(mockPayments);

      const result = await controller.findByOrder(mockUser, mockOrderId);

      expect(result).toEqual(mockPayments);
      expect(service.findByOrder).toHaveBeenCalledWith(mockUser, mockOrderId);
    });
  });

  describe('findByStatus', () => {
    it('should return payments with specific status', async () => {
      const status = 'completed';
      const mockPayments = [{ id: '1', status, amount: 1000 }];
      mockPaymentService.findByStatus.mockResolvedValue(mockPayments);

      const result = await controller.findByStatus(mockUser, status);

      expect(result).toEqual(mockPayments);
      expect(service.findByStatus).toHaveBeenCalledWith(mockUser, status);
    });
  });

  describe('getStatistics', () => {
    it('should return payment statistics', async () => {
      const mockStats = {
        total: 10,
        completed: 7,
        pending: 2,
        failed: 1,
        totalAmount: 50000,
      };
      mockPaymentService.getPaymentStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics(mockUser);

      expect(result).toEqual(mockStats);
      expect(service.getPaymentStatistics).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('count', () => {
    it('should return payment count', async () => {
      const mockCount = 42;
      mockPaymentService.count.mockResolvedValue(mockCount);

      const result = await controller.count(mockUser);

      expect(result).toEqual(mockCount);
      expect(service.count).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getTotalAmount', () => {
    it('should return total payment amount', async () => {
      const status = 'completed';
      const mockTotal = 100000;
      mockPaymentService.getTotalAmount.mockResolvedValue(mockTotal);

      const result = await controller.getTotalAmount(mockUser, status);

      expect(result).toEqual(mockTotal);
      expect(service.getTotalAmount).toHaveBeenCalledWith(mockUser, status);
    });
  });

  describe('getByDateRange', () => {
    it('should return payments within date range', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';
      const mockPayments = [{ id: '1', amount: 1000, date: '2026-01-15' }];
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue(mockPayments);

      const result = await controller.getByDateRange(mockUser, startDate, endDate);

      expect(result).toEqual(mockPayments);
      expect(service.getPaymentsByDateRange).toHaveBeenCalledWith(
        mockUser,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('findOne', () => {
    it('should return payment by id', async () => {
      const mockPayment = { id: mockPaymentId, amount: 1000, status: 'completed' };
      mockPaymentService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne(mockUser, mockPaymentId);

      expect(result).toEqual(mockPayment);
      expect(service.findOne).toHaveBeenCalledWith(mockUser, mockPaymentId);
    });
  });

  describe('create', () => {
    it('should create new payment', async () => {
      const createDto: CreatePaymentDto = {
        orderId: mockOrderId,
        amount: 1000,
        method: PaymentMethod.CARD,
      };
      const mockCreated = { id: mockPaymentId, ...createDto };
      mockPaymentService.create.mockResolvedValue(mockCreated);

      const result = await controller.create(mockUser, createDto);

      expect(result).toEqual(mockCreated);
      expect(service.create).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('update', () => {
    it('should update payment', async () => {
      const updateDto: UpdatePaymentDto = { amount: 1500 };
      const mockUpdated = { id: mockPaymentId, amount: 1500 };
      mockPaymentService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(mockPaymentId, mockUser, updateDto);

      expect(result).toEqual(mockUpdated);
      expect(service.update).toHaveBeenCalledWith(mockUser, mockPaymentId, updateDto);
    });
  });

  describe('complete', () => {
    it('should complete payment', async () => {
      const transactionId = 'txn-123';
      const mockCompleted = { id: mockPaymentId, status: 'completed', transactionId };
      mockPaymentService.complete.mockResolvedValue(mockCompleted);

      const result = await controller.complete(mockUser, mockPaymentId, transactionId);

      expect(result).toEqual(mockCompleted);
      expect(service.complete).toHaveBeenCalledWith(mockUser, mockPaymentId, transactionId);
    });
  });

  describe('fail', () => {
    it('should fail payment', async () => {
      const reason = 'Insufficient funds';
      const mockFailed = { id: mockPaymentId, status: 'failed', failureReason: reason };
      mockPaymentService.fail.mockResolvedValue(mockFailed);

      const result = await controller.fail(mockUser, mockPaymentId, reason);

      expect(result).toEqual(mockFailed);
      expect(service.fail).toHaveBeenCalledWith(mockUser, mockPaymentId, reason);
    });
  });

  describe('refund', () => {
    it('should refund payment', async () => {
      const mockRefunded = { id: mockPaymentId, status: 'refunded' };
      mockPaymentService.refund.mockResolvedValue(mockRefunded);

      const result = await controller.refund(mockUser, mockPaymentId);

      expect(result).toEqual(mockRefunded);
      expect(service.refund).toHaveBeenCalledWith(mockUser, mockPaymentId);
    });
  });

  describe('remove', () => {
    it('should delete payment', async () => {
      mockPaymentService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, mockPaymentId);

      expect(result).toEqual({ message: 'Payment deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockUser, mockPaymentId);
    });
  });
});

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

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual(mockPayments);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('findByOrder', () => {
    it('should return payments for specific order', async () => {
      const mockPayments = [{ id: '1', orderId: mockOrderId, amount: 1000 }];
      mockPaymentService.findByOrder.mockResolvedValue(mockPayments);

      const result = await controller.findByOrder(mockOrderId, mockTenantId);

      expect(result).toEqual(mockPayments);
      expect(service.findByOrder).toHaveBeenCalledWith(mockOrderId, mockTenantId);
    });
  });

  describe('findByStatus', () => {
    it('should return payments with specific status', async () => {
      const status = 'completed';
      const mockPayments = [{ id: '1', status, amount: 1000 }];
      mockPaymentService.findByStatus.mockResolvedValue(mockPayments);

      const result = await controller.findByStatus(status, mockTenantId);

      expect(result).toEqual(mockPayments);
      expect(service.findByStatus).toHaveBeenCalledWith(status, mockTenantId);
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

      const result = await controller.getStatistics(mockTenantId);

      expect(result).toEqual(mockStats);
      expect(service.getPaymentStatistics).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('count', () => {
    it('should return payment count', async () => {
      const mockCount = 42;
      mockPaymentService.count.mockResolvedValue(mockCount);

      const result = await controller.count(mockTenantId);

      expect(result).toEqual(mockCount);
      expect(service.count).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('getTotalAmount', () => {
    it('should return total payment amount', async () => {
      const status = 'completed';
      const mockTotal = 100000;
      mockPaymentService.getTotalAmount.mockResolvedValue(mockTotal);

      const result = await controller.getTotalAmount(status, mockTenantId);

      expect(result).toEqual(mockTotal);
      expect(service.getTotalAmount).toHaveBeenCalledWith(mockTenantId, status);
    });
  });

  describe('getByDateRange', () => {
    it('should return payments within date range', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';
      const mockPayments = [{ id: '1', amount: 1000, date: '2026-01-15' }];
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue(mockPayments);

      const result = await controller.getByDateRange(startDate, endDate, mockTenantId);

      expect(result).toEqual(mockPayments);
      expect(service.getPaymentsByDateRange).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
        mockTenantId,
      );
    });
  });

  describe('findOne', () => {
    it('should return payment by id', async () => {
      const mockPayment = { id: mockPaymentId, amount: 1000, status: 'completed' };
      mockPaymentService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne(mockPaymentId, mockTenantId);

      expect(result).toEqual(mockPayment);
      expect(service.findOne).toHaveBeenCalledWith(mockPaymentId, mockTenantId);
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

      const result = await controller.create(createDto, mockTenantId);

      expect(result).toEqual(mockCreated);
      expect(service.create).toHaveBeenCalledWith(createDto, mockTenantId);
    });
  });

  describe('update', () => {
    it('should update payment', async () => {
      const updateDto: UpdatePaymentDto = { amount: 1500 };
      const mockUpdated = { id: mockPaymentId, amount: 1500 };
      mockPaymentService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(mockPaymentId, updateDto, mockTenantId);

      expect(result).toEqual(mockUpdated);
      expect(service.update).toHaveBeenCalledWith(mockPaymentId, updateDto, mockTenantId);
    });
  });

  describe('complete', () => {
    it('should complete payment', async () => {
      const transactionId = 'txn-123';
      const mockCompleted = { id: mockPaymentId, status: 'completed', transactionId };
      mockPaymentService.complete.mockResolvedValue(mockCompleted);

      const result = await controller.complete(mockPaymentId, transactionId, mockTenantId);

      expect(result).toEqual(mockCompleted);
      expect(service.complete).toHaveBeenCalledWith(mockPaymentId, transactionId, mockTenantId);
    });
  });

  describe('fail', () => {
    it('should fail payment', async () => {
      const reason = 'Insufficient funds';
      const mockFailed = { id: mockPaymentId, status: 'failed', failureReason: reason };
      mockPaymentService.fail.mockResolvedValue(mockFailed);

      const result = await controller.fail(mockPaymentId, reason, mockTenantId);

      expect(result).toEqual(mockFailed);
      expect(service.fail).toHaveBeenCalledWith(mockPaymentId, reason, mockTenantId);
    });
  });

  describe('refund', () => {
    it('should refund payment', async () => {
      const mockRefunded = { id: mockPaymentId, status: 'refunded' };
      mockPaymentService.refund.mockResolvedValue(mockRefunded);

      const result = await controller.refund(mockPaymentId, mockTenantId);

      expect(result).toEqual(mockRefunded);
      expect(service.refund).toHaveBeenCalledWith(mockPaymentId, mockTenantId);
    });
  });

  describe('remove', () => {
    it('should delete payment', async () => {
      mockPaymentService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockPaymentId, mockTenantId);

      expect(result).toEqual({ message: 'Payment deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockPaymentId, mockTenantId);
    });
  });
});

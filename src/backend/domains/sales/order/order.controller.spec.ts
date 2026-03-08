import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { BadRequestException } from '@nestjs/common';
import { createMockUser } from '@/common/test/test-helpers';

describe('OrderController (Unit)', () => {
  let controller: OrderController;
  let service: OrderService;

  const mockOrderService = {
    findAll: jest.fn(),
    getPendingOrders: jest.fn(),
    count: jest.fn(),
    getRecentOrders: jest.fn(),
    getTotalRevenue: jest.fn(),
    getRevenueByDateRange: jest.fn(),
    findByDateRange: jest.fn(),
    findByCustomer: jest.fn(),
    findByStatus: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    cancel: jest.fn(),
    ship: jest.fn(),
    deliver: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        { id: 'order-1', total: 100, tenantId: mockUser.tenantId },
        { id: 'order-2', total: 200, tenantId: mockUser.tenantId },
      ];
      mockOrderService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockOrders);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getPendingOrders', () => {
    it('should return pending orders', async () => {
      const mockOrders = [{ id: 'order-1', status: 'pending', tenantId: mockUser.tenantId }];
      mockOrderService.getPendingOrders.mockResolvedValue(mockOrders);

      const result = await controller.getPendingOrders(mockUser);

      expect(result).toEqual(mockOrders);
      expect(service.getPendingOrders).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('count', () => {
    it('should return order count', async () => {
      mockOrderService.count.mockResolvedValue(50);

      const result = await controller.count(mockUser);

      expect(result).toBe(50);
      expect(service.count).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with valid limit', async () => {
      const limit = '10';
      const mockOrders = [{ id: 'order-1', tenantId: mockUser.tenantId }];
      mockOrderService.getRecentOrders.mockResolvedValue(mockOrders);

      const result = await controller.getRecentOrders(mockUser, limit);

      expect(result).toEqual(mockOrders);
      expect(service.getRecentOrders).toHaveBeenCalledWith(mockUser, 10);
    });

    it('should throw BadRequestException for invalid limit', () => {
      const invalidLimit = 'invalid';

      expect(() => controller.getRecentOrders(mockUser, invalidLimit)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for negative limit', () => {
      const negativeLimit = '-5';

      expect(() => controller.getRecentOrders(mockUser, negativeLimit)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue', async () => {
      mockOrderService.getTotalRevenue.mockResolvedValue(10000);

      const result = await controller.getTotalRevenue(mockUser);

      expect(result).toBe(10000);
      expect(service.getTotalRevenue).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getRevenueByDateRange', () => {
    it('should return revenue by date range', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';
      mockOrderService.getRevenueByDateRange.mockResolvedValue(5000);

      const result = await controller.getRevenueByDateRange(startDate, mockUser, endDate);

      expect(result).toBe(5000);
      expect(service.getRevenueByDateRange).toHaveBeenCalledWith(
        mockUser,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('findByDateRange', () => {
    it('should return orders by date range', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';
      const mockOrders = [{ id: 'order-1', tenantId: mockUser.tenantId }];
      mockOrderService.findByDateRange.mockResolvedValue(mockOrders);

      const result = await controller.findByDateRange(startDate, mockUser, endDate);

      expect(result).toEqual(mockOrders);
      expect(service.findByDateRange).toHaveBeenCalledWith(
        mockUser,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('findByCustomer', () => {
    it('should return orders by customer', async () => {
      const customerId = 'customer-1';
      const mockOrders = [{ id: 'order-1', customerId, tenantId: mockUser.tenantId }];
      mockOrderService.findByCustomer.mockResolvedValue(mockOrders);

      const result = await controller.findByCustomer(mockUser, customerId);

      expect(result).toEqual(mockOrders);
      expect(service.findByCustomer).toHaveBeenCalledWith(mockUser, customerId);
    });
  });

  describe('findByStatus', () => {
    it('should return orders by status', async () => {
      const status = 'completed';
      const mockOrders = [{ id: 'order-1', status, tenantId: mockUser.tenantId }];
      mockOrderService.findByStatus.mockResolvedValue(mockOrders);

      const result = await controller.findByStatus(mockUser, status);

      expect(result).toEqual(mockOrders);
      expect(service.findByStatus).toHaveBeenCalledWith(mockUser, status);
    });
  });

  describe('findOne', () => {
    it('should return order by id', async () => {
      const orderId = 'order-1';
      const mockOrder = { id: orderId, total: 100, tenantId: mockUser.tenantId };
      mockOrderService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne(mockUser, orderId);

      expect(result).toEqual(mockOrder);
      expect(service.findOne).toHaveBeenCalledWith(mockUser, orderId);
    });
  });

  describe('create', () => {
    it('should create new order', async () => {
      const createDto = {
        customerId: 'customer-1',
        items: [{ productId: 'prod-1', quantity: 2 }],
      };
      const mockOrder = { id: 'order-1', ...createDto, tenantId: mockUser.tenantId };
      mockOrderService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(mockUser, createDto as any);

      expect(result).toEqual(mockOrder);
      expect(service.create).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('update', () => {
    it('should update order', async () => {
      const orderId = 'order-1';
      const updateDto = { status: 'processing' };
      const mockOrder = { id: orderId, ...updateDto, tenantId: mockUser.tenantId };
      mockOrderService.update.mockResolvedValue(mockOrder);

      const result = await controller.update(orderId, mockUser, updateDto as any);

      expect(result).toEqual(mockOrder);
      expect(service.update).toHaveBeenCalledWith(mockUser, orderId, updateDto);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const orderId = 'order-1';
      const status = 'shipped';
      const mockOrder = { id: orderId, status, tenantId: mockUser.tenantId };
      mockOrderService.updateStatus.mockResolvedValue(mockOrder);

      const result = await controller.updateStatus(orderId, mockUser, status);

      expect(result).toEqual(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(mockUser, orderId, status);
    });
  });

  describe('cancel', () => {
    it('should cancel order', async () => {
      const orderId = 'order-1';
      const mockOrder = { id: orderId, status: 'cancelled', tenantId: mockUser.tenantId };
      mockOrderService.cancel.mockResolvedValue(mockOrder);

      const result = await controller.cancel(mockUser, orderId);

      expect(result).toEqual(mockOrder);
      expect(service.cancel).toHaveBeenCalledWith(mockUser, orderId);
    });
  });

  describe('ship', () => {
    it('should ship order', async () => {
      const orderId = 'order-1';
      const trackingNumber = 'TRACK123';
      const mockOrder = { id: orderId, status: 'shipped', trackingNumber, tenantId: mockUser.tenantId };
      mockOrderService.ship.mockResolvedValue(mockOrder);

      const result = await controller.ship(orderId, mockUser, trackingNumber);

      expect(result).toEqual(mockOrder);
      expect(service.ship).toHaveBeenCalledWith(mockUser, orderId, trackingNumber);
    });
  });

  describe('deliver', () => {
    it('should deliver order', async () => {
      const orderId = 'order-1';
      const mockOrder = { id: orderId, status: 'delivered', tenantId: mockUser.tenantId };
      mockOrderService.deliver.mockResolvedValue(mockOrder);

      const result = await controller.deliver(mockUser, orderId);

      expect(result).toEqual(mockOrder);
      expect(service.deliver).toHaveBeenCalledWith(mockUser, orderId);
    });
  });

  describe('remove', () => {
    it('should delete order', async () => {
      const orderId = 'order-1';
      mockOrderService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, orderId);

      expect(result).toEqual({ message: 'Order deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockUser, orderId);
    });
  });
});

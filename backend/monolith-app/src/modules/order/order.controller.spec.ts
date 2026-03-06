import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { BadRequestException } from '@nestjs/common';

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
      const tenantId = 'tenant-123';
      const mockOrders = [
        { id: 'order-1', total: 100, tenantId },
        { id: 'order-2', total: 200, tenantId },
      ];
      mockOrderService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll(tenantId);

      expect(result).toEqual(mockOrders);
      expect(service.findAll).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getPendingOrders', () => {
    it('should return pending orders', async () => {
      const tenantId = 'tenant-123';
      const mockOrders = [{ id: 'order-1', status: 'pending', tenantId }];
      mockOrderService.getPendingOrders.mockResolvedValue(mockOrders);

      const result = await controller.getPendingOrders(tenantId);

      expect(result).toEqual(mockOrders);
      expect(service.getPendingOrders).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('count', () => {
    it('should return order count', async () => {
      const tenantId = 'tenant-123';
      mockOrderService.count.mockResolvedValue(50);

      const result = await controller.count(tenantId);

      expect(result).toBe(50);
      expect(service.count).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with valid limit', async () => {
      const tenantId = 'tenant-123';
      const limit = '10';
      const mockOrders = [{ id: 'order-1', tenantId }];
      mockOrderService.getRecentOrders.mockResolvedValue(mockOrders);

      const result = await controller.getRecentOrders(limit, tenantId);

      expect(result).toEqual(mockOrders);
      expect(service.getRecentOrders).toHaveBeenCalledWith(10, tenantId);
    });

    it('should throw BadRequestException for invalid limit', () => {
      const tenantId = 'tenant-123';
      const invalidLimit = 'invalid';

      expect(() => controller.getRecentOrders(invalidLimit, tenantId)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for negative limit', () => {
      const tenantId = 'tenant-123';
      const negativeLimit = '-5';

      expect(() => controller.getRecentOrders(negativeLimit, tenantId)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue', async () => {
      const tenantId = 'tenant-123';
      mockOrderService.getTotalRevenue.mockResolvedValue(10000);

      const result = await controller.getTotalRevenue(tenantId);

      expect(result).toBe(10000);
      expect(service.getTotalRevenue).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getRevenueByDateRange', () => {
    it('should return revenue by date range', async () => {
      const tenantId = 'tenant-123';
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';
      mockOrderService.getRevenueByDateRange.mockResolvedValue(5000);

      const result = await controller.getRevenueByDateRange(startDate, endDate, tenantId);

      expect(result).toBe(5000);
      expect(service.getRevenueByDateRange).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
        tenantId,
      );
    });
  });

  describe('findByDateRange', () => {
    it('should return orders by date range', async () => {
      const tenantId = 'tenant-123';
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';
      const mockOrders = [{ id: 'order-1', tenantId }];
      mockOrderService.findByDateRange.mockResolvedValue(mockOrders);

      const result = await controller.findByDateRange(startDate, endDate, tenantId);

      expect(result).toEqual(mockOrders);
      expect(service.findByDateRange).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
        tenantId,
      );
    });
  });

  describe('findByCustomer', () => {
    it('should return orders by customer', async () => {
      const tenantId = 'tenant-123';
      const customerId = 'customer-1';
      const mockOrders = [{ id: 'order-1', customerId, tenantId }];
      mockOrderService.findByCustomer.mockResolvedValue(mockOrders);

      const result = await controller.findByCustomer(customerId, tenantId);

      expect(result).toEqual(mockOrders);
      expect(service.findByCustomer).toHaveBeenCalledWith(customerId, tenantId);
    });
  });

  describe('findByStatus', () => {
    it('should return orders by status', async () => {
      const tenantId = 'tenant-123';
      const status = 'completed';
      const mockOrders = [{ id: 'order-1', status, tenantId }];
      mockOrderService.findByStatus.mockResolvedValue(mockOrders);

      const result = await controller.findByStatus(status, tenantId);

      expect(result).toEqual(mockOrders);
      expect(service.findByStatus).toHaveBeenCalledWith(status, tenantId);
    });
  });

  describe('findOne', () => {
    it('should return order by id', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-1';
      const mockOrder = { id: orderId, total: 100, tenantId };
      mockOrderService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne(orderId, tenantId);

      expect(result).toEqual(mockOrder);
      expect(service.findOne).toHaveBeenCalledWith(orderId, tenantId);
    });
  });

  describe('create', () => {
    it('should create new order', async () => {
      const tenantId = 'tenant-123';
      const createDto = {
        customerId: 'customer-1',
        items: [{ productId: 'prod-1', quantity: 2 }],
      };
      const mockOrder = { id: 'order-1', ...createDto, tenantId };
      mockOrderService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createDto as any, tenantId);

      expect(result).toEqual(mockOrder);
      expect(service.create).toHaveBeenCalledWith(createDto, tenantId);
    });
  });

  describe('update', () => {
    it('should update order', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-1';
      const updateDto = { status: 'processing' };
      const mockOrder = { id: orderId, ...updateDto, tenantId };
      mockOrderService.update.mockResolvedValue(mockOrder);

      const result = await controller.update(orderId, updateDto as any, tenantId);

      expect(result).toEqual(mockOrder);
      expect(service.update).toHaveBeenCalledWith(orderId, updateDto, tenantId);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-1';
      const status = 'shipped';
      const mockOrder = { id: orderId, status, tenantId };
      mockOrderService.updateStatus.mockResolvedValue(mockOrder);

      const result = await controller.updateStatus(orderId, status, tenantId);

      expect(result).toEqual(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(orderId, status, tenantId);
    });
  });

  describe('cancel', () => {
    it('should cancel order', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-1';
      const mockOrder = { id: orderId, status: 'cancelled', tenantId };
      mockOrderService.cancel.mockResolvedValue(mockOrder);

      const result = await controller.cancel(orderId, tenantId);

      expect(result).toEqual(mockOrder);
      expect(service.cancel).toHaveBeenCalledWith(orderId, tenantId);
    });
  });

  describe('ship', () => {
    it('should ship order', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-1';
      const trackingNumber = 'TRACK123';
      const mockOrder = { id: orderId, status: 'shipped', trackingNumber, tenantId };
      mockOrderService.ship.mockResolvedValue(mockOrder);

      const result = await controller.ship(orderId, trackingNumber, tenantId);

      expect(result).toEqual(mockOrder);
      expect(service.ship).toHaveBeenCalledWith(orderId, trackingNumber, tenantId);
    });
  });

  describe('deliver', () => {
    it('should deliver order', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-1';
      const mockOrder = { id: orderId, status: 'delivered', tenantId };
      mockOrderService.deliver.mockResolvedValue(mockOrder);

      const result = await controller.deliver(orderId, tenantId);

      expect(result).toEqual(mockOrder);
      expect(service.deliver).toHaveBeenCalledWith(orderId, tenantId);
    });
  });

  describe('remove', () => {
    it('should delete order', async () => {
      const tenantId = 'tenant-123';
      const orderId = 'order-1';
      mockOrderService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(orderId, tenantId);

      expect(result).toEqual({ message: 'Order deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(orderId, tenantId);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: Repository<Order>;

  const mockOrderRepository = {
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn()
  };

  const mockOrderItemRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository
  },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository
  },
      ]
  }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(getRepositoryToken(Order));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create order successfully', async () => {
      const dto = {
        customerEmail: 'test@example.com',
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            productSku: 'SKU-001',
            price: 50,
            quantity: 2
  },
        ],
        shippingAddress: { city: 'HCMC' }
  };

      const mockOrder = { id: 'order-1', ...dto };

      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderItemRepository.create.mockImplementation((data) => data);
      mockOrderRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(dto, 'tenant1');

      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return order by ID', async () => {
      const mockOrder = { id: 'order-1', orderNumber: 'ORD-2026-0001' };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1', 'tenant1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'tenant1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByOrderNumber', () => {
    it('should return order by order number', async () => {
      const mockOrder = { id: 'order-1', orderNumber: 'ORD-2026-0001' };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findByOrderNumber('ORD-2026-0001', 'tenant1');

      expect(result).toEqual(mockOrder);
    });
  });

  describe('findByCustomer', () => {
    it('should return orders by customer', async () => {
      const mockOrders = [
        { id: 'order-1', customerId: 'customer-1' },
        { id: 'order-2', customerId: 'customer-1' },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findByCustomer('customer-1', 'tenant1');

      expect(result).toEqual(mockOrders);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
  };

      const dto = {
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID
  };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, ...dto });

      const result = await service.updateStatus('order-1', dto, 'tenant1', {} as any);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });

  describe('cancel', () => {
    it('should cancel order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
        canBeCancelled: true
  };

      const dto = { reason: 'Customer request' };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED
  });

      const result = await service.cancel('order-1', dto, 'tenant1', { id: 'user-1' } as any);

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw BadRequestException if order cannot be cancelled', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DELIVERED,
        canBeCancelled: false
  };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.cancel('order-1', { reason: 'Test' }, 'tenant1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refund', () => {
    it('should refund order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        paymentStatus: PaymentStatus.PAID
  };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED
  });

      const result = await service.refund('order-1', 'Defective product', 'tenant1', {
        id: 'user-1'
  } as any);

      expect(result.status).toBe(OrderStatus.REFUNDED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should throw BadRequestException if order not paid', async () => {
      const mockOrder = {
        id: 'order-1',
        paymentStatus: PaymentStatus.PENDING
  };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.refund('order-1', 'Test', 'tenant1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatistics', () => {
    it('should return order statistics', async () => {
      const mockOrders = [
        { status: OrderStatus.PENDING, total: 100 },
        { status: OrderStatus.DELIVERED, total: 200 },
        { status: OrderStatus.DELIVERED, total: 150 },
      ];

      mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStatistics('tenant1');

      expect(result.totalOrders).toBe(3);
      expect(result.totalRevenue).toBe(450);
      expect(result.averageOrderValue).toBe(150);
    });
  });
});

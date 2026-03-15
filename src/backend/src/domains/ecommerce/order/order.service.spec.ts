import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { PermissionService, User } from '../../../common/security/permission.service';
import { OrderStatus } from './enums/order-status.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { ShippingStatus } from './enums/shipping-status.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['user'],
  };

  // Helper function to create complete mock Order
  const createMockOrder = (overrides: Partial<Order> = {}): Order => {
    const baseOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      customerId: 'user-1',
      customer: null as any,
      cartId: null,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      shippingStatus: ShippingStatus.PENDING,
      items: [],
      subtotal: 100,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 100,
      couponCode: null,
      customerEmail: 'test@example.com',
      customerPhone: '1234567890',
      shippingAddress: { street: '123 Main St', city: 'City', country: 'Country' },
      billingAddress: { street: '123 Main St', city: 'City', country: 'Country' },
      paymentMethod: 'cod',
      paymentTransactionId: null,
      paidAt: null,
      shippingMethod: 'standard',
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
      customerNotes: null,
      internalNotes: null,
      cancelledBy: null,
      cancellationReason: null,
      cancelledAt: null,
      tenantId: 'tenant-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      generateOrderNumber: jest.fn(),
      calculateTotals: jest.fn(),
      validate: jest.fn(),
      ...overrides,
    };

    // Add getters
    Object.defineProperties(baseOrder, {
      itemCount: {
        get: () => baseOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        enumerable: true,
      },
      isPaid: {
        get: () => baseOrder.paymentStatus === PaymentStatus.PAID,
        enumerable: true,
      },
      canBeCancelled: {
        get: () => baseOrder.status === OrderStatus.PENDING || baseOrder.status === OrderStatus.CONFIRMED,
        enumerable: true,
      },
      isCompleted: {
        get: () => baseOrder.status === OrderStatus.DELIVERED || baseOrder.status === OrderStatus.CANCELLED || baseOrder.status === OrderStatus.REFUNDED,
        enumerable: true,
      },
    });

    return baseOrder as any;
  };

  const mockOrder = createMockOrder();

  beforeEach(async () => {
    const mockOrderRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };

    const mockOrderItemRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockPermissionService = {
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, where) => where),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepo,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateOrderDto = {
      customerEmail: 'test@example.com',
      customerPhone: '1234567890',
      shippingAddress: '123 Main St',
      billingAddress: '123 Main St',
      shippingMethod: 'standard',
      paymentMethod: 'cod',
      items: [
        {
          productId: 'prod-1',
          productName: 'Product 1',
          productSku: 'SKU-1',
          price: 50,
          quantity: 2,
        },
      ],
    };

    it('should create order successfully', async () => {
      orderRepository.create.mockReturnValue(mockOrder as any);
      orderItemRepository.create.mockReturnValue({} as any);
      orderRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(createDto, mockUser);

      expect(orderRepository.create).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should use shippingAddress as billingAddress when not provided', async () => {
      const dtoWithoutBilling = { ...createDto, billingAddress: undefined };
      orderRepository.create.mockReturnValue(mockOrder as any);
      orderItemRepository.create.mockReturnValue({} as any);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.create(dtoWithoutBilling, mockUser);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          billingAddress: createDto.shippingAddress,
        }),
      );
    });

    it('should create order items', async () => {
      orderRepository.create.mockReturnValue(mockOrder as any);
      orderItemRepository.create.mockReturnValue({} as any);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.create(createDto, mockUser);

      expect(orderItemRepository.create).toHaveBeenCalledTimes(createDto.items.length);
    });

    it('should handle empty items array', async () => {
      const dtoWithNoItems = { ...createDto, items: [] };
      orderRepository.create.mockReturnValue(mockOrder as any);
      orderRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(dtoWithNoItems, mockUser);

      expect(result).toEqual(mockOrder);
    });
  });

  describe('findOne', () => {
    it('should find order by id successfully', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1', mockUser);

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-1', tenantId: 'tenant-1' },
        relations: ['items', 'customer'],
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('order-999', mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('order-999', mockUser)).rejects.toThrow(
        'Order with ID order-999 not found',
      );
    });

    it('should handle null id', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(null as any, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle empty id', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrderNumber', () => {
    it('should find order by order number successfully', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findByOrderNumber('ORD-001', mockUser);

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { orderNumber: 'ORD-001', tenantId: 'tenant-1' },
        relations: ['items', 'customer'],
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findByOrderNumber('ORD-999', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByOrderNumber('ORD-999', mockUser)).rejects.toThrow(
        'Order with number ORD-999 not found',
      );
    });
  });

  describe('findByCustomer', () => {
    it('should find orders by customer id', async () => {
      orderRepository.find.mockResolvedValue([mockOrder]);

      const result = await service.findByCustomer('user-1', mockUser);

      expect(result).toEqual([mockOrder]);
      expect(orderRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'user-1', tenantId: 'tenant-1' },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no orders found', async () => {
      orderRepository.find.mockResolvedValue([]);

      const result = await service.findByCustomer('user-999', mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
    });

    it('should find all orders without filters', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockOrder]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockOrder]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('order.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockOrder]);

      await service.findAll('tenant-1', { status: OrderStatus.PENDING });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('order.status = :status', {
        status: OrderStatus.PENDING,
      });
    });

    it('should filter by paymentStatus', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockOrder]);

      await service.findAll('tenant-1', { paymentStatus: PaymentStatus.PAID });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'order.paymentStatus = :paymentStatus',
        { paymentStatus: PaymentStatus.PAID },
      );
    });

    it('should filter by shippingStatus', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockOrder]);

      await service.findAll('tenant-1', { shippingStatus: ShippingStatus.SHIPPED });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'order.shippingStatus = :shippingStatus',
        { shippingStatus: ShippingStatus.SHIPPED },
      );
    });

    it('should filter by customerId', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockOrder]);

      await service.findAll('tenant-1', { customerId: 'user-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('order.customerId = :customerId', {
        customerId: 'user-1',
      });
    });

    it('should filter by date range', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockOrder]);
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.findAll('tenant-1', { startDate, endDate });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('order.createdAt >= :startDate', {
        startDate,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('order.createdAt <= :endDate', {
        endDate,
      });
    });

    it('should apply multiple filters', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockOrder]);

      await service.findAll('tenant-1', {
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        customerId: 'user-1',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateStatus', () => {
    const updateDto: UpdateOrderStatusDto = {
      status: OrderStatus.CONFIRMED,
    };

    it('should update order status successfully', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      const updatedOrder = createMockOrder({ status: OrderStatus.CONFIRMED });
      orderRepository.save.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('order-1', updateDto, 'tenant-1', mockUser);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('should set shippedAt when status is SHIPPED', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateStatus(
        'order-1',
        { status: OrderStatus.SHIPPED },
        'tenant-1',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shippedAt: expect.any(Date),
        }),
      );
    });

    it('should set deliveredAt when status is DELIVERED', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateStatus(
        'order-1',
        { status: OrderStatus.DELIVERED },
        'tenant-1',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveredAt: expect.any(Date),
        }),
      );
    });

    it('should set paidAt when paymentStatus is PAID', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateStatus(
        'order-1',
        { paymentStatus: PaymentStatus.PAID },
        'tenant-1',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paidAt: expect.any(Date),
        }),
      );
    });

    it('should update shippingStatus', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateStatus(
        'order-1',
        { shippingStatus: ShippingStatus.SHIPPED },
        'tenant-1',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingStatus: ShippingStatus.SHIPPED,
        }),
      );
    });

    it('should update trackingNumber', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateStatus(
        'order-1',
        { trackingNumber: 'TRACK-123' },
        'tenant-1',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          trackingNumber: 'TRACK-123',
        }),
      );
    });

    it('should update internalNotes', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateStatus(
        'order-1',
        { internalNotes: 'Test notes' },
        'tenant-1',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          internalNotes: 'Test notes',
        }),
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status to PAID', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      const updatedOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentTransactionId: 'TXN-123',
      });
      orderRepository.save.mockResolvedValue(updatedOrder);

      const result = await service.updatePaymentStatus(
        'order-1',
        PaymentStatus.PAID,
        'TXN-123',
        mockUser,
      );

      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(result.paymentTransactionId).toBe('TXN-123');
    });

    it('should set paidAt when payment is PAID', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updatePaymentStatus('order-1', PaymentStatus.PAID, 'TXN-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paidAt: expect.any(Date),
        }),
      );
    });

    it('should update order status to CONFIRMED when payment is PAID and order is PENDING', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updatePaymentStatus('order-1', PaymentStatus.PAID, 'TXN-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CONFIRMED,
        }),
      );
    });

    it('should not change order status if not PENDING', async () => {
      const shippedOrder = createMockOrder({ status: OrderStatus.SHIPPED });
      orderRepository.findOne.mockResolvedValue(shippedOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updatePaymentStatus('order-1', PaymentStatus.PAID, 'TXN-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.SHIPPED,
        }),
      );
    });
  });

  describe('updateShippingStatus', () => {
    it('should update shipping status to SHIPPED', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      const updatedOrder = createMockOrder({
        shippingStatus: ShippingStatus.SHIPPED,
        trackingNumber: 'TRACK-123',
      });
      orderRepository.save.mockResolvedValue(updatedOrder);

      const result = await service.updateShippingStatus(
        'order-1',
        ShippingStatus.SHIPPED,
        'TRACK-123',
        mockUser,
      );

      expect(result.shippingStatus).toBe(ShippingStatus.SHIPPED);
      expect(result.trackingNumber).toBe('TRACK-123');
    });

    it('should set order status to SHIPPED when shipping status is SHIPPED', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateShippingStatus('order-1', ShippingStatus.SHIPPED, 'TRACK-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.SHIPPED,
          shippedAt: expect.any(Date),
        }),
      );
    });

    it('should set order status to DELIVERED when shipping status is DELIVERED', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateShippingStatus(
        'order-1',
        ShippingStatus.DELIVERED,
        'TRACK-123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.DELIVERED,
          deliveredAt: expect.any(Date),
        }),
      );
    });
  });

  describe('cancel', () => {
    const cancelDto: CancelOrderDto = {
      reason: 'Customer request',
    };

    it('should cancel order successfully', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      const cancelledOrder = createMockOrder({
        status: OrderStatus.CANCELLED,
        cancelledBy: 'user-1',
        cancellationReason: 'Customer request',
      });
      orderRepository.save.mockResolvedValue(cancelledOrder);

      const result = await service.cancel('order-1', cancelDto, 'tenant-1', mockUser);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancelledBy).toBe('user-1');
      expect(result.cancellationReason).toBe('Customer request');
    });

    it('should throw BadRequestException when order cannot be cancelled', async () => {
      const deliveredOrder = createMockOrder({
        status: OrderStatus.DELIVERED,
      });
      orderRepository.findOne.mockResolvedValue(deliveredOrder);

      await expect(service.cancel('order-1', cancelDto, 'tenant-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel('order-1', cancelDto, 'tenant-1', mockUser)).rejects.toThrow(
        'Order cannot be cancelled',
      );
    });

    it('should set cancelledAt timestamp', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.cancel('order-1', cancelDto, 'tenant-1', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelledAt: expect.any(Date),
        }),
      );
    });
  });

  describe('refund', () => {
    it('should refund order successfully', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
      });
      orderRepository.findOne.mockResolvedValue(paidOrder);
      const refundedOrder = createMockOrder({
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
      });
      orderRepository.save.mockResolvedValue(refundedOrder);

      const result = await service.refund('order-1', 'Defective product', 'tenant-1', mockUser);

      expect(result.status).toBe(OrderStatus.REFUNDED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should throw BadRequestException when order not paid', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.refund('order-1', 'Defective product', 'tenant-1', mockUser),
      ).rejects.toThrow('Order must be paid before refunding');
    });

    it('should set cancellation reason and cancelledBy', async () => {
      const paidOrder = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
      });
      orderRepository.findOne.mockResolvedValue(paidOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.refund('order-1', 'Defective product', 'tenant-1', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cancellationReason: 'Defective product',
          cancelledBy: 'user-1',
          cancelledAt: expect.any(Date),
        }),
      );
    });
  });

  describe('getStatistics', () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
    });

    it('should calculate statistics correctly', async () => {
      const orders = [
        { ...mockOrder, total: 100, status: OrderStatus.PENDING },
        { ...mockOrder, total: 200, status: OrderStatus.CONFIRMED },
        { ...mockOrder, total: 150, status: OrderStatus.PENDING },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(orders);

      const result = await service.getStatistics('tenant-1');

      expect(result.totalOrders).toBe(3);
      expect(result.totalRevenue).toBe(450);
      expect(result.averageOrderValue).toBe(150);
      expect(result.ordersByStatus[OrderStatus.PENDING]).toBe(2);
      expect(result.ordersByStatus[OrderStatus.CONFIRMED]).toBe(1);
    });

    it('should handle empty orders', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getStatistics('tenant-1');

      expect(result.totalOrders).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
    });

    it('should filter by date range', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockOrder]);
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.getStatistics('tenant-1', startDate, endDate);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('order.createdAt >= :startDate', {
        startDate,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('order.createdAt <= :endDate', {
        endDate,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user', async () => {
      await expect(service.findOne('order-1', null as any)).rejects.toThrow();
    });

    it('should handle undefined tenantId', async () => {
      const userWithoutTenant = { ...mockUser, tenantId: undefined as any };
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('order-1', userWithoutTenant)).rejects.toThrow();
    });

    it('should handle very large order total', async () => {
      const largeOrder = createMockOrder({ total: 999999999 });
      orderRepository.findOne.mockResolvedValue(largeOrder);

      const result = await service.findOne('order-1', mockUser);

      expect(result.total).toBe(999999999);
    });

    it('should handle zero total', async () => {
      const zeroOrder = createMockOrder({ total: 0 });
      orderRepository.findOne.mockResolvedValue(zeroOrder);

      const result = await service.findOne('order-1', mockUser);

      expect(result.total).toBe(0);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { PermissionService, User } from '@common/security/permission.service';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../enums/ecommerce.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['customer'],
  };

  const mockOrderItem = {
    id: 'item-123',
    orderId: 'order-123',
    productId: 'product-123',
    productName: 'Test Product',
    productSku: 'TEST-001',
    productImage: 'image.jpg',
    price: 100,
    quantity: 2,
    selectedVariant: null,
    notes: null,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    get lineTotal() { return this.price * this.quantity; },
  } as unknown as OrderItem;

  const createMockOrder = (overrides: Partial<Order> = {}): Order => {
    const order = {
      id: 'order-123',
      orderNumber: 'ORD-2024-0001',
      customerId: 'user-123',
      cartId: null,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      shippingStatus: ShippingStatus.PENDING,
      items: [mockOrderItem],
      subtotal: 200,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 200,
      couponCode: null,
      customerEmail: 'test@example.com',
      customerPhone: '+84901234567',
      shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'HCMC' },
      billingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'HCMC' },
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
      tenantId: 'tenant-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: undefined,
      generateOrderNumber() {
        if (!this.orderNumber) {
          const year = new Date().getFullYear();
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          this.orderNumber = `ORD-${year}-${random}`;
        }
      },
      calculateTotals() {
        if (!this.items || this.items.length === 0) {
          this.subtotal = 0;
          this.total = 0;
          return;
        }
        this.subtotal = this.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        this.total = this.subtotal + this.tax + this.shipping - this.discount;
        if (this.total < 0) {
          this.total = 0;
        }
      },
      validate() {
        if (!this.customerEmail || this.customerEmail.trim().length === 0) {
          throw new Error('Customer email is required');
        }
        if (!this.shippingAddress) {
          throw new Error('Shipping address is required');
        }
        if (!this.billingAddress) {
          throw new Error('Billing address is required');
        }
        if (this.tax < 0) {
          throw new Error('Tax must be non-negative');
        }
        if (this.shipping < 0) {
          throw new Error('Shipping must be non-negative');
        }
        if (this.discount < 0) {
          throw new Error('Discount must be non-negative');
        }
      },
      get itemCount() { 
        if (!this.items) return 0;
        return this.items.reduce((sum, item) => sum + item.quantity, 0); 
      },
      get isPaid() { 
        return this.paymentStatus === PaymentStatus.PAID; 
      },
      get canBeCancelled() { 
        return this.status === OrderStatus.PENDING || this.status === OrderStatus.CONFIRMED; 
      },
      get isCompleted() {
        return this.status === OrderStatus.DELIVERED || 
               this.status === OrderStatus.CANCELLED || 
               this.status === OrderStatus.REFUNDED;
      },
      ...overrides,
    } as Order;
    return order;
  };

  const mockOrder = createMockOrder();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
          },
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
    const createOrderDto: CreateOrderDto = {
      customerEmail: 'test@example.com',
      customerPhone: '+84901234567',
      items: [
        {
          productId: 'product-123',
          productName: 'Test Product',
          productSku: 'TEST-001',
          productImage: 'image.jpg',
          price: 100,
          quantity: 2,
          selectedVariant: null,
          notes: null,
        },
      ],
      shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'HCMC' },
      billingAddress: null,
      shippingMethod: 'standard',
      paymentMethod: 'cod',
      couponCode: null,
      customerNotes: null,
    };

    it('should create order successfully', async () => {
      const order = createMockOrder();
      orderRepository.create.mockReturnValue(order);
      orderItemRepository.create.mockReturnValue(mockOrderItem);
      orderRepository.save.mockResolvedValue(order);

      const result = await service.create(createOrderDto, mockUser);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: mockUser.id,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shippingStatus: ShippingStatus.PENDING,
          customerEmail: createOrderDto.customerEmail,
          tenantId: mockUser.tenantId,
        }),
      );
      expect(orderItemRepository.create).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(result).toEqual(order);
    });

    it('should use shippingAddress as billingAddress when billingAddress is null', async () => {
      const order = createMockOrder();
      orderRepository.create.mockReturnValue(order);
      orderItemRepository.create.mockReturnValue(mockOrderItem);
      orderRepository.save.mockResolvedValue(order);

      await service.create(createOrderDto, mockUser);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          billingAddress: createOrderDto.shippingAddress,
        }),
      );
    });

    it('should create order items with correct data', async () => {
      const order = createMockOrder();
      orderRepository.create.mockReturnValue(order);
      orderItemRepository.create.mockReturnValue(mockOrderItem);
      orderRepository.save.mockResolvedValue(order);

      await service.create(createOrderDto, mockUser);

      expect(orderItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: createOrderDto.items[0].productId,
          productName: createOrderDto.items[0].productName,
          quantity: createOrderDto.items[0].quantity,
          price: createOrderDto.items[0].price,
          tenantId: mockUser.tenantId,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return order by id', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);

      const result = await service.findOne('order-123', mockUser);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        relations: ['items', 'customer'],
      });
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id', mockUser)).rejects.toThrow(
        'Order with ID invalid-id not found',
      );
    });
  });

  describe('findByOrderNumber', () => {
    it('should return order by order number', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);

      const result = await service.findByOrderNumber('ORD-2024-0001', mockUser);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { orderNumber: 'ORD-2024-0001' },
        relations: ['items', 'customer'],
      });
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByOrderNumber('INVALID-ORDER', mockUser),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findByOrderNumber('INVALID-ORDER', mockUser),
      ).rejects.toThrow('Order with number INVALID-ORDER not found');
    });
  });

  describe('findByCustomer', () => {
    it('should return orders by customer id', async () => {
      const order = createMockOrder();
      orderRepository.find.mockResolvedValue([order]);

      const result = await service.findByCustomer('user-123', mockUser);

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'user-123', tenantId: 'tenant-123' },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([order]);
    });

    it('should return empty array when no orders found', async () => {
      orderRepository.find.mockResolvedValue([]);

      const result = await service.findByCustomer('user-123', mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    const createMockQueryBuilder = () => {
      const order = createMockOrder();
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([order]),
      };
      return qb;
    };

    it('should return all orders for tenant', async () => {
      const order = createMockOrder();
      const qb = createMockQueryBuilder();
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findAll('tenant-123');

      expect(qb.where).toHaveBeenCalledWith('order.tenantId = :tenantId', {
        tenantId: 'tenant-123',
      });
      expect(qb.orderBy).toHaveBeenCalledWith('order.createdAt', 'DESC');
      expect(result).toHaveLength(1);
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder();
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll('tenant-123', { status: OrderStatus.PENDING });

      expect(qb.andWhere).toHaveBeenCalledWith('order.status = :status', {
        status: OrderStatus.PENDING,
      });
    });

    it('should filter by paymentStatus', async () => {
      const qb = createMockQueryBuilder();
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll('tenant-123', { paymentStatus: PaymentStatus.PAID });

      expect(qb.andWhere).toHaveBeenCalledWith('order.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatus.PAID,
      });
    });

    it('should filter by shippingStatus', async () => {
      const qb = createMockQueryBuilder();
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll('tenant-123', { shippingStatus: ShippingStatus.SHIPPED });

      expect(qb.andWhere).toHaveBeenCalledWith('order.shippingStatus = :shippingStatus', {
        shippingStatus: ShippingStatus.SHIPPED,
      });
    });

    it('should filter by customerId', async () => {
      const qb = createMockQueryBuilder();
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll('tenant-123', { customerId: 'user-123' });

      expect(qb.andWhere).toHaveBeenCalledWith('order.customerId = :customerId', {
        customerId: 'user-123',
      });
    });

    it('should filter by date range', async () => {
      const qb = createMockQueryBuilder();
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.findAll('tenant-123', { startDate, endDate });

      expect(qb.andWhere).toHaveBeenCalledWith('order.createdAt >= :startDate', { startDate });
      expect(qb.andWhere).toHaveBeenCalledWith('order.createdAt <= :endDate', { endDate });
    });
  });

  describe('updateStatus', () => {
    const updateDto: UpdateOrderStatusDto = {
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      shippingStatus: ShippingStatus.PROCESSING,
      trackingNumber: 'TRACK123',
      internalNotes: 'Test notes',
    };

    it('should update order status', async () => {
      const order = createMockOrder();
      const updatedOrder = createMockOrder({ status: OrderStatus.CONFIRMED });
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('order-123', updateDto, 'tenant-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CONFIRMED,
        }),
      );
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should set shippedAt when status is SHIPPED', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      await service.updateStatus(
        'order-123',
        { status: OrderStatus.SHIPPED },
        'tenant-123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.SHIPPED,
          shippedAt: expect.any(Date),
        }),
      );
    });

    it('should set deliveredAt when status is DELIVERED', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      await service.updateStatus(
        'order-123',
        { status: OrderStatus.DELIVERED },
        'tenant-123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.DELIVERED,
          deliveredAt: expect.any(Date),
        }),
      );
    });

    it('should set paidAt when paymentStatus is PAID', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(mockOrder);

      await service.updateStatus(
        'order-123',
        { paymentStatus: PaymentStatus.PAID },
        'tenant-123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.PAID,
          paidAt: expect.any(Date),
        }),
      );
    });

    it('should set paidAt when paymentStatus is PAID', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      await service.updateStatus(
        'order-123',
        { paymentStatus: PaymentStatus.PAID },
        'tenant-123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.PAID,
          paidAt: expect.any(Date),
        }),
      );
    });

    it('should not override shippedAt if already set', async () => {
      const shippedOrder = createMockOrder({ shippedAt: new Date('2024-01-01') });
      orderRepository.findOne.mockResolvedValue(shippedOrder);
      orderRepository.save.mockResolvedValue(shippedOrder);

      await service.updateStatus(
        'order-123',
        { status: OrderStatus.SHIPPED },
        'tenant-123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shippedAt: new Date('2024-01-01'),
        }),
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status and transaction id', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      const result = await service.updatePaymentStatus(
        'order-123',
        PaymentStatus.PAID,
        'txn-123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.PAID,
          paymentTransactionId: 'txn-123',
          paidAt: expect.any(Date),
        }),
      );
    });

    it('should update order status to CONFIRMED when payment is PAID and order is PENDING', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      await service.updatePaymentStatus('order-123', PaymentStatus.PAID, 'txn-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CONFIRMED,
        }),
      );
    });

    it('should not change order status if not PENDING', async () => {
      const confirmedOrder = createMockOrder({ status: OrderStatus.CONFIRMED });
      orderRepository.findOne.mockResolvedValue(confirmedOrder);
      orderRepository.save.mockResolvedValue(confirmedOrder);

      await service.updatePaymentStatus('order-123', PaymentStatus.PAID, 'txn-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CONFIRMED,
        }),
      );
    });
  });

  describe('updateShippingStatus', () => {
    it('should update shipping status and tracking number', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      const result = await service.updateShippingStatus(
        'order-123',
        ShippingStatus.SHIPPED,
        'TRACK123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingStatus: ShippingStatus.SHIPPED,
          trackingNumber: 'TRACK123',
        }),
      );
    });

    it('should update order status to SHIPPED when shipping status is SHIPPED', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      await service.updateShippingStatus(
        'order-123',
        ShippingStatus.SHIPPED,
        'TRACK123',
        mockUser,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.SHIPPED,
          shippedAt: expect.any(Date),
        }),
      );
    });

    it('should update order status to DELIVERED when shipping status is DELIVERED', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      await service.updateShippingStatus(
        'order-123',
        ShippingStatus.DELIVERED,
        'TRACK123',
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
      reason: 'Customer requested cancellation',
    };

    it('should cancel order successfully', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      const result = await service.cancel('order-123', cancelDto, 'tenant-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CANCELLED,
          cancelledBy: mockUser.id,
          cancellationReason: cancelDto.reason,
          cancelledAt: expect.any(Date),
        }),
      );
    });

    it('should throw BadRequestException when order cannot be cancelled', async () => {
      const shippedOrder = createMockOrder({ 
        status: OrderStatus.SHIPPED,
        get canBeCancelled() { return false; }
      });
      orderRepository.findOne.mockResolvedValue(shippedOrder);

      await expect(
        service.cancel('order-123', cancelDto, 'tenant-123', mockUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancel('order-123', cancelDto, 'tenant-123', mockUser),
      ).rejects.toThrow('Order cannot be cancelled');
    });
  });

  describe('refund', () => {
    it('should refund order successfully', async () => {
      const paidOrder = createMockOrder({ paymentStatus: PaymentStatus.PAID });
      orderRepository.findOne.mockResolvedValue(paidOrder);
      orderRepository.save.mockResolvedValue(paidOrder);

      const result = await service.refund('order-123', 'Product defective', 'tenant-123', mockUser);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
          cancellationReason: 'Product defective',
          cancelledBy: mockUser.id,
          cancelledAt: expect.any(Date),
        }),
      );
    });

    it('should throw BadRequestException when order is not paid', async () => {
      const order = createMockOrder();
      orderRepository.findOne.mockResolvedValue(order);

      await expect(
        service.refund('order-123', 'Product defective', 'tenant-123', mockUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.refund('order-123', 'Product defective', 'tenant-123', mockUser),
      ).rejects.toThrow('Order must be paid before refunding');
    });
  });

  describe('getStatistics', () => {
    it('should return order statistics', async () => {
      const orders = [
        createMockOrder({ total: 100, status: OrderStatus.PENDING }),
        createMockOrder({ total: 200, status: OrderStatus.CONFIRMED }),
        createMockOrder({ total: 300, status: OrderStatus.DELIVERED }),
      ];
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(orders),
      };
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getStatistics('tenant-123');

      expect(result).toEqual({
        totalOrders: 3,
        totalRevenue: 600,
        averageOrderValue: 200,
        ordersByStatus: {
          [OrderStatus.PENDING]: 1,
          [OrderStatus.CONFIRMED]: 1,
          [OrderStatus.DELIVERED]: 1,
        },
      });
    });

    it('should filter by date range', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.getStatistics('tenant-123', startDate, endDate);

      expect(qb.andWhere).toHaveBeenCalledWith('order.createdAt >= :startDate', { startDate });
      expect(qb.andWhere).toHaveBeenCalledWith('order.createdAt <= :endDate', { endDate });
    });

    it('should return zero values when no orders', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      orderRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getStatistics('tenant-123');

      expect(result).toEqual({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {},
      });
    });
  });
});

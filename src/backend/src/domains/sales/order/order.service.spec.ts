import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

describe('OrderService', () => {
  let service: OrderService;
  let _orderRepository: jest.Mocked<Repository<Order>>;
  let cacheService: jest.Mocked<CacheService>;
  let _permissionService: jest.Mocked<PermissionService>;
  let secureOrderRepo: jest.Mocked<SecureRepository<Order>>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const createMockOrder = (overrides?: Partial<Order>): Order => {
    return {
      id: 'order-1',
      orderNumber: 'ORD-001',
      customerId: 'customer-1',
      status: 'draft',
      totalAmount: 1000,
      items: [{ productId: 'prod-1', quantity: 2, price: 500 }] as any,
      tenantId: 'tenant-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      orderItems: [{ productId: 'prod-1', quantity: 2, price: 500 }],
      ...overrides,
    } as Order;
  };

  beforeEach(async () => {
    const mockOrderRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const mockCacheService = {
      getOrSet: jest.fn(),
      del: jest.fn(),
    };

    const mockPermissionService = {
      hasPermission: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
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

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(getRepositoryToken(Order));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);

    secureOrderRepo = (service as any).secureOrderRepo;
    secureOrderRepo.find = jest.fn();
    secureOrderRepo.findOne = jest.fn();
    secureOrderRepo.save = jest.fn();
    secureOrderRepo.remove = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1' }),
        createMockOrder({ id: 'order-2' }),
        createMockOrder({ id: 'order-3' }),
      ];

      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.findAll(mockUser, 1, 2);

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it('should return empty array when no orders exist', async () => {
      secureOrderRepo.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      secureOrderRepo.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return order from cache if available', async () => {
      const mockOrder = createMockOrder();
      cacheService.getOrSet.mockResolvedValue(mockOrder);

      const result = await service.findOne(mockUser, 'order-1');

      expect(result).toEqual(mockOrder);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from database when cache miss', async () => {
      const mockOrder = createMockOrder();

      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne(mockUser, 'order-1');

      expect(result).toEqual(mockOrder);
      expect(secureOrderRepo.findOne).toHaveBeenCalledWith(mockUser, { where: { id: 'order-1' } });
    });

    it('should throw NotFoundException when order not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUser, 'non-existent')).rejects.toThrow(
        'Order with ID non-existent not found',
      );
    });
  });

  describe('findByOrderNumber', () => {
    it('should return order by order number', async () => {
      const mockOrder = createMockOrder({ orderNumber: 'ORD-001' });
      secureOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.findByOrderNumber(mockUser, 'ORD-001');

      expect(result).toEqual(mockOrder);
      expect(secureOrderRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { orderNumber: 'ORD-001' },
      });
    });

    it('should return null when order number not found', async () => {
      secureOrderRepo.findOne.mockResolvedValue(null);

      const result = await service.findByOrderNumber(mockUser, 'NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create order successfully', async () => {
      const createDto: CreateOrderDto = {
        orderNumber: 'ORD-002',
        customerId: 'customer-1',
        items: [{ productId: 'prod-1', quantity: 2, price: 500 }],
      };

      secureOrderRepo.findOne.mockResolvedValue(null);
      secureOrderRepo.save.mockResolvedValue(createMockOrder({ orderNumber: 'ORD-002' }));

      const result = await service.create(mockUser, createDto);

      expect(result.orderNumber).toBe('ORD-002');
      expect(secureOrderRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when order number already exists', async () => {
      const createDto: CreateOrderDto = {
        orderNumber: 'ORD-001',
        customerId: 'customer-1',
        items: [],
      };

      secureOrderRepo.findOne.mockResolvedValue(createMockOrder());

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(mockUser, createDto)).rejects.toThrow(
        'Order with number ORD-001 already exists',
      );
    });

    it('should set default status to draft', async () => {
      const createDto: CreateOrderDto = {
        orderNumber: 'ORD-003',
        customerId: 'customer-1',
        items: [],
      };

      secureOrderRepo.findOne.mockResolvedValue(null);
      secureOrderRepo.save.mockImplementation(async (_user, order) => {
        return { ...order, id: 'order-3' } as Order;
      });

      await service.create(mockUser, createDto);

      expect(secureOrderRepo.save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ status: 'draft' }),
      );
    });

    it('should handle items array correctly', async () => {
      const createDto: CreateOrderDto = {
        orderNumber: 'ORD-004',
        customerId: 'customer-1',
        items: [{ productId: 'prod-1', quantity: 2, price: 500 }],
      };

      secureOrderRepo.findOne.mockResolvedValue(null);
      secureOrderRepo.save.mockImplementation(async (_user, order) => {
        return { ...order, id: 'order-4' } as Order;
      });

      await service.create(mockUser, createDto);

      expect(secureOrderRepo.save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ orderItems: createDto.items }),
      );
    });
  });

  describe('update', () => {
    it('should update order successfully', async () => {
      const mockOrder = createMockOrder();
      const updateDto: UpdateOrderDto = {
        notes: 'Updated notes',
      };

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, ...updateDto } as Order);

      const result = await service.update(mockUser, 'order-1', updateDto);

      expect(result.notes).toBe('Updated notes');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should check order number uniqueness when updating', async () => {
      const mockOrder = createMockOrder({ orderNumber: 'ORD-001' });
      const updateDto: UpdateOrderDto = {
        orderNumber: 'ORD-002',
      };

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.findOne.mockResolvedValue(null);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, ...updateDto } as Order);

      await service.update(mockUser, 'order-1', updateDto);

      expect(secureOrderRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { orderNumber: 'ORD-002' },
      });
    });

    it('should throw ConflictException when new order number exists', async () => {
      const mockOrder = createMockOrder({ orderNumber: 'ORD-001' });
      const updateDto: UpdateOrderDto = {
        orderNumber: 'ORD-002',
      };

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.findOne.mockResolvedValue(createMockOrder({ id: 'other-order' }));

      await expect(service.update(mockUser, 'order-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow updating same order number', async () => {
      const mockOrder = createMockOrder({ orderNumber: 'ORD-001' });
      const updateDto: UpdateOrderDto = {
        orderNumber: 'ORD-001',
        notes: 'Same order number',
      };

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, ...updateDto } as Order);

      const result = await service.update(mockUser, 'order-1', updateDto);

      expect(result.notes).toBe('Same order number');
      expect(secureOrderRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove order successfully', async () => {
      const mockOrder = createMockOrder();

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.remove.mockResolvedValue(undefined);

      await service.remove(mockUser, 'order-1');

      expect(secureOrderRepo.remove).toHaveBeenCalledWith(mockUser, mockOrder);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = createMockOrder({ status: 'draft' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, status: 'pending' } as Order);

      const result = await service.updateStatus(mockUser, 'order-1', 'pending');

      expect(result.status).toBe('pending');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('findByCustomer', () => {
    it('should return orders for customer', async () => {
      const mockOrders = [
        createMockOrder({ customerId: 'customer-1' }),
        createMockOrder({ customerId: 'customer-1' }),
      ];

      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.findByCustomer(mockUser, 'customer-1');

      expect(result).toHaveLength(2);
      expect(secureOrderRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { customerId: 'customer-1' },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return orders by status', async () => {
      const mockOrders = [
        createMockOrder({ status: 'pending' }),
        createMockOrder({ status: 'pending' }),
      ];

      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.findByStatus(mockUser, 'pending');

      expect(result).toHaveLength(2);
    });
  });

  describe('findByDateRange', () => {
    it('should return orders within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockOrders = [createMockOrder()];

      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.findByDateRange(mockUser, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(secureOrderRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { createdAt: Between(startDate, endDate) },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('count', () => {
    it('should return order count', async () => {
      const mockOrders = [createMockOrder(), createMockOrder(), createMockOrder()];
      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.count(mockUser);

      expect(result).toBe(3);
    });

    it('should return 0 when no orders exist', async () => {
      secureOrderRepo.find.mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getTotalRevenue', () => {
    it('should calculate total revenue excluding cancelled orders', async () => {
      const mockOrders = [
        createMockOrder({ totalAmount: 1000, status: 'completed' }),
        createMockOrder({ totalAmount: 2000, status: 'delivered' }),
        createMockOrder({ totalAmount: 500, status: 'cancelled' }),
      ];

      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.getTotalRevenue(mockUser);

      expect(result).toBe(3000);
    });

    it('should return 0 when no orders exist', async () => {
      secureOrderRepo.find.mockResolvedValue([]);

      const result = await service.getTotalRevenue(mockUser);

      expect(result).toBe(0);
    });

    it('should handle string totalAmount values', async () => {
      const mockOrders = [
        createMockOrder({ totalAmount: '1000' as any, status: 'completed' }),
        createMockOrder({ totalAmount: '2000' as any, status: 'delivered' }),
      ];

      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.getTotalRevenue(mockUser);

      expect(result).toBe(3000);
    });
  });

  describe('getRevenueByDateRange', () => {
    it('should calculate revenue for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockOrders = [
        createMockOrder({ totalAmount: 1000, status: 'completed' }),
        createMockOrder({ totalAmount: 2000, status: 'delivered' }),
      ];

      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.getRevenueByDateRange(mockUser, startDate, endDate);

      expect(result).toBe(3000);
    });
  });

  describe('cancel', () => {
    it('should cancel order successfully', async () => {
      const mockOrder = createMockOrder({ status: 'pending' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, status: 'cancelled' } as Order);

      const result = await service.cancel(mockUser, 'order-1');

      expect(result.status).toBe('cancelled');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when cancelling delivered order', async () => {
      const mockOrder = createMockOrder({ status: 'delivered' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.cancel(mockUser, 'order-1')).rejects.toThrow(BadRequestException);
      await expect(service.cancel(mockUser, 'order-1')).rejects.toThrow(
        'Cannot cancel a delivered or completed order',
      );
    });

    it('should throw BadRequestException when cancelling completed order', async () => {
      const mockOrder = createMockOrder({ status: 'completed' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.cancel(mockUser, 'order-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('ship', () => {
    it('should ship order successfully from draft', async () => {
      const mockOrder = createMockOrder({ status: 'draft' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, status: 'shipped' } as Order);

      const result = await service.ship(mockUser, 'order-1', 'TRACK-123');

      expect(result.status).toBe('shipped');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should ship order successfully from pending', async () => {
      const mockOrder = createMockOrder({ status: 'pending' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, status: 'shipped' } as Order);

      const result = await service.ship(mockUser, 'order-1', 'TRACK-123');

      expect(result.status).toBe('shipped');
    });

    it('should ship order successfully from processing', async () => {
      const mockOrder = createMockOrder({ status: 'processing' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, status: 'shipped' } as Order);

      const result = await service.ship(mockUser, 'order-1', 'TRACK-123');

      expect(result.status).toBe('shipped');
    });

    it('should throw BadRequestException when shipping delivered order', async () => {
      const mockOrder = createMockOrder({ status: 'delivered' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.ship(mockUser, 'order-1', 'TRACK-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ship(mockUser, 'order-1', 'TRACK-123')).rejects.toThrow(
        'Only draft, pending or processing orders can be shipped',
      );
    });
  });

  describe('deliver', () => {
    it('should deliver order successfully', async () => {
      const mockOrder = createMockOrder({ status: 'shipped' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);
      secureOrderRepo.save.mockResolvedValue({ ...mockOrder, status: 'delivered' } as Order);

      const result = await service.deliver(mockUser, 'order-1');

      expect(result.status).toBe('delivered');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when delivering non-shipped order', async () => {
      const mockOrder = createMockOrder({ status: 'pending' });

      cacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.deliver(mockUser, 'order-1')).rejects.toThrow(BadRequestException);
      await expect(service.deliver(mockUser, 'order-1')).rejects.toThrow(
        'Only shipped orders can be delivered',
      );
    });
  });

  describe('getPendingOrders', () => {
    it('should return pending orders', async () => {
      const mockOrders = [createMockOrder({ status: 'pending' })];
      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.getPendingOrders(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with limit', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1' }),
        createMockOrder({ id: 'order-2' }),
        createMockOrder({ id: 'order-3' }),
      ];

      secureOrderRepo.find.mockResolvedValue(mockOrders);

      const result = await service.getRecentOrders(mockUser, 2);

      expect(result).toHaveLength(2);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('OrderService', () => {
  let service: OrderService;

  const mockOrder: Order = {
    id: '1',
    orderNumber: 'ORD-001',
    customerId: 'customer-1',
    status: 'draft',
    totalAmount: 1000,
    notes: 'Test order',
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    customer: null,
    orderItems: [],
    invoices: [],
    payments: [],
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of orders for tenant', async () => {
      const orders = [mockOrder];
      mockRepository.findAndCount.mockResolvedValue([orders, 1]);

      const result = await service.findAll('tenant-1');

      expect(result.data).toEqual(orders);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockOrder);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrderNumber', () => {
    it('should return order by order number', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findByOrderNumber('ORD-001', 'tenant-1');

      expect(result).toEqual(mockOrder);
    });

    it('should return null if order not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByOrderNumber('ORD-999', 'tenant-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createDto: CreateOrderDto = {
      orderNumber: 'ORD-002',
      customerId: 'customer-1',
      items: [],
      notes: 'New order',
    };

    it('should create a new order', async () => {
      mockRepository.findOne.mockResolvedValue(null); // Order number doesn't exist
      mockRepository.create.mockReturnValue(mockOrder);
      mockRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(createDto, 'tenant-1');

      expect(result).toEqual(mockOrder);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: createDto.orderNumber,
          customerId: createDto.customerId,
          notes: createDto.notes,
          tenantId: 'tenant-1',
          status: 'draft',
          orderItems: createDto.items, // Changed from items to orderItems
        }),
      );
    });

    it('should throw ConflictException if order number already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.create(createDto, 'tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should use provided status if given', async () => {
      const dtoWithStatus = { ...createDto, status: 'pending' };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockOrder);
      mockRepository.save.mockResolvedValue(mockOrder);

      await service.create(dtoWithStatus, 'tenant-1');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
        }),
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateOrderDto = {
      notes: 'Updated notes',
    };

    it('should update an order', async () => {
      const updatedOrder = { ...mockOrder, ...updateDto };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockRepository.save.mockResolvedValue(updatedOrder);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateDto, 'tenant-1');

      expect(result).toEqual(updatedOrder);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if updating order number to existing one', async () => {
      const updateWithOrderNumber: UpdateOrderDto = { orderNumber: 'ORD-EXISTING' };
      const existingOrder = { ...mockOrder, id: '2', orderNumber: 'ORD-EXISTING' };

      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockRepository.findOne.mockResolvedValue(existingOrder);

      await expect(service.update('1', updateWithOrderNumber, 'tenant-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete an order', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove('1', 'tenant-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith(mockOrder.id);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: 'processing' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockRepository.save.mockResolvedValue(updatedOrder);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateStatus('1', 'processing', 'tenant-1');

      expect(result.status).toBe('processing');
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('findByCustomer', () => {
    it('should return orders for a customer', async () => {
      const orders = [mockOrder];
      mockRepository.find.mockResolvedValue(orders);

      const result = await service.findByCustomer('customer-1', 'tenant-1');

      expect(result).toEqual(orders);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', tenantId: 'tenant-1' },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return orders by status', async () => {
      const orders = [mockOrder];
      mockRepository.find.mockResolvedValue(orders);

      const result = await service.findByStatus('draft', 'tenant-1');

      expect(result).toEqual(orders);
    });
  });

  describe('findByDateRange', () => {
    it('should return orders within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const orders = [mockOrder];
      mockRepository.find.mockResolvedValue(orders);

      const result = await service.findByDateRange(startDate, endDate, 'tenant-1');

      expect(result).toEqual(orders);
    });
  });

  describe('count', () => {
    it('should return count of orders', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count('tenant-1');

      expect(result).toBe(10);
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue', async () => {
      const queryBuilder: {
        select: jest.Mock;
        where: jest.Mock;
        andWhere: jest.Mock;
        getRawOne: jest.Mock;
      } = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getTotalRevenue('tenant-1');

      expect(result).toBe(5000);
    });

    it('should return 0 if no orders', async () => {
      const queryBuilder: {
        select: jest.Mock;
        where: jest.Mock;
        andWhere: jest.Mock;
        getRawOne: jest.Mock;
      } = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getTotalRevenue('tenant-1');

      expect(result).toBe(0);
    });
  });

  describe('getRevenueByDateRange', () => {
    it('should return revenue for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const queryBuilder: {
        select: jest.Mock;
        where: jest.Mock;
        andWhere: jest.Mock;
        getRawOne: jest.Mock;
      } = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '3000' }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getRevenueByDateRange(startDate, endDate, 'tenant-1');

      expect(result).toBe(3000);
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockRepository.save.mockResolvedValue(cancelledOrder);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.cancel('1', 'tenant-1');

      expect(result.status).toBe('cancelled');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order is delivered', async () => {
      const deliveredOrder = { ...mockOrder, status: 'delivered' };
      mockCacheService.getOrSet.mockResolvedValue(deliveredOrder);

      await expect(service.cancel('1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if order is completed', async () => {
      const completedOrder = { ...mockOrder, status: 'completed' };
      mockCacheService.getOrSet.mockResolvedValue(completedOrder);

      await expect(service.cancel('1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('ship', () => {
    it('should ship a draft order', async () => {
      const draftOrder = { ...mockOrder, status: 'draft' };
      const shippedOrder = { ...mockOrder, status: 'shipped' };
      mockCacheService.getOrSet.mockResolvedValue(draftOrder);
      mockRepository.save.mockResolvedValue(shippedOrder);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.ship('1', 'TRACK-123', 'tenant-1');

      expect(result.status).toBe('shipped');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should ship a pending order', async () => {
      const pendingOrder = { ...mockOrder, status: 'pending' };
      const shippedOrder = { ...mockOrder, status: 'shipped' };
      mockCacheService.getOrSet.mockResolvedValue(pendingOrder);
      mockRepository.save.mockResolvedValue(shippedOrder);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.ship('1', 'TRACK-123', 'tenant-1');

      expect(result.status).toBe('shipped');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order is delivered', async () => {
      const deliveredOrder = { ...mockOrder, status: 'delivered' };
      mockCacheService.getOrSet.mockResolvedValue(deliveredOrder);

      await expect(service.ship('1', 'TRACK-123', 'tenant-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deliver', () => {
    it('should deliver a shipped order', async () => {
      const shippedOrder = { ...mockOrder, status: 'shipped' };
      const deliveredOrder = { ...mockOrder, status: 'delivered' };
      mockCacheService.getOrSet.mockResolvedValue(shippedOrder);
      mockRepository.save.mockResolvedValue(deliveredOrder);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.deliver('1', 'tenant-1');

      expect(result.status).toBe('delivered');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order is not shipped', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.deliver('1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingOrders', () => {
    it('should return pending orders', async () => {
      const pendingOrders = [{ ...mockOrder, status: 'pending' }];
      mockRepository.find.mockResolvedValue(pendingOrders);

      const result = await service.getPendingOrders('tenant-1');

      expect(result).toEqual(pendingOrders);
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with limit', async () => {
      const orders = [mockOrder];
      mockRepository.find.mockResolvedValue(orders);

      const result = await service.getRecentOrders(10, 'tenant-1');

      expect(result).toEqual(orders);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });
  });
});

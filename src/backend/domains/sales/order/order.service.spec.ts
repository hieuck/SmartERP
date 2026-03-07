import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('OrderService', () => {
  let service: OrderService;

  const mockOrderRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
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

  const mockUser = createMockUser();

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: '1', orderNumber: 'ORD-001' },
        { id: '2', orderNumber: 'ORD-002' },
      ];
      mockOrderRepository.findAndCount.mockResolvedValue([mockOrders, 2]);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual(mockOrders);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should find order by id', async () => {
      const mockOrder = { id: '1', orderNumber: 'ORD-001' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockOrder);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrderNumber', () => {
    it('should find order by order number', async () => {
      const mockOrder = { id: '1', orderNumber: 'ORD-001' };
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findByOrderNumber('ORD-001', mockUser);

      expect(result).toEqual(mockOrder);
    });
  });

  describe('create', () => {
    it('should create order', async () => {
      const orderData = { orderNumber: 'ORD-001', customerId: 'cust-1' };
      mockOrderRepository.findOne.mockResolvedValue(null);
      mockOrderRepository.create.mockReturnValue(orderData);
      mockOrderRepository.save.mockResolvedValue(orderData);

      const result = await service.create(orderData as any, mockUser);

      expect(result).toEqual(orderData);
    });

    it('should throw ConflictException if order number exists', async () => {
      const orderData = { orderNumber: 'ORD-001' };
      mockOrderRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(orderData as any, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update order', async () => {
      const mockOrder = { id: '1', orderNumber: 'ORD-001' };
      const updateDto = { status: 'processing' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, ...updateDto });

      const result = await service.update('1', updateDto, mockUser);

      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new order number exists', async () => {
      const mockOrder = { id: '1', orderNumber: 'ORD-001' };
      const updateDto = { orderNumber: 'ORD-002' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockOrderRepository.findOne.mockResolvedValue({ id: '2', orderNumber: 'ORD-002' });

      await expect(service.update('1', updateDto, mockUser)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove order', async () => {
      const mockOrder = { id: '1', orderNumber: 'ORD-001' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockOrderRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('1', mockUser);

      expect(mockOrderRepository.softDelete).toHaveBeenCalledWith('1');
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockOrder = { id: '1', status: 'draft' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'processing' });

      const result = await service.updateStatus('1', 'processing', mockUser);

      expect(result.status).toBe('processing');
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('findByCustomer', () => {
    it('should find orders by customer', async () => {
      const mockOrders = [{ id: '1', customerId: 'cust-1' }];
      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findByCustomer('cust-1', mockUser);

      expect(result).toEqual(mockOrders);
    });
  });

  describe('findByStatus', () => {
    it('should find orders by status', async () => {
      const mockOrders = [{ id: '1', status: 'pending' }];
      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findByStatus('pending', mockUser);

      expect(result).toEqual(mockOrders);
    });
  });

  describe('findByDateRange', () => {
    it('should find orders by date range', async () => {
      const mockOrders = [{ id: '1' }];
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findByDateRange(startDate, endDate, mockUser);

      expect(result).toEqual(mockOrders);
    });
  });

  describe('count', () => {
    it('should return order count', async () => {
      mockOrderRepository.count.mockResolvedValue(50);

      const result = await service.count(mockUser);

      expect(result).toBe(50);
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '10000' }),
      };
      mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTotalRevenue(mockUser);

      expect(result).toBe(10000);
    });

    it('should return 0 if no orders', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTotalRevenue(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getRevenueByDateRange', () => {
    it('should return revenue by date range', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
      };
      mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRevenueByDateRange(
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'tenant-1',
      );

      expect(result).toBe(5000);
    });
  });

  describe('cancel', () => {
    it('should cancel order', async () => {
      const mockOrder = { id: '1', status: 'pending' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

      const result = await service.cancel('1', mockUser);

      expect(result.status).toBe('cancelled');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException for delivered order', async () => {
      const mockOrder = { id: '1', status: 'delivered' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.cancel('1', mockUser)).rejects.toThrow(
        'Cannot cancel a delivered or completed order',
      );
    });

    it('should throw BadRequestException for completed order', async () => {
      const mockOrder = { id: '1', status: 'completed' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.cancel('1', mockUser)).rejects.toThrow(
        'Cannot cancel a delivered or completed order',
      );
    });
  });

  describe('ship', () => {
    it('should ship order', async () => {
      const mockOrder = { id: '1', status: 'pending' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'shipped' });

      const result = await service.ship('1', 'TRACK-123', mockUser);

      expect(result.status).toBe('shipped');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status', async () => {
      const mockOrder = { id: '1', status: 'delivered' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.ship('1', 'TRACK-123', mockUser)).rejects.toThrow(
        'Only draft, pending or processing orders can be shipped',
      );
    });
  });

  describe('deliver', () => {
    it('should deliver order', async () => {
      const mockOrder = { id: '1', status: 'shipped' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: 'delivered' });

      const result = await service.deliver('1', mockUser);

      expect(result.status).toBe('delivered');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-shipped order', async () => {
      const mockOrder = { id: '1', status: 'pending' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      await expect(service.deliver('1', mockUser)).rejects.toThrow(
        'Only shipped orders can be delivered',
      );
    });
  });

  describe('getPendingOrders', () => {
    it('should return pending orders', async () => {
      const mockOrders = [{ id: '1', status: 'pending' }];
      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.getPendingOrders(mockUser);

      expect(result).toEqual(mockOrders);
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders', async () => {
      const mockOrders = [{ id: '1' }, { id: '2' }];
      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.getRecentOrders(10, mockUser);

      expect(result).toEqual(mockOrders);
    });
  });
});

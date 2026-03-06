import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

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

      const result = await service.findAll('tenant-1', 1, 20);

      expect(result.data).toEqual(mockOrders);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should find order by id', async () => {
      const mockOrder = { id: '1', orderNumber: 'ORD-001' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockOrder);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrderNumber', () => {
    it('should find order by order number', async () => {
      const mockOrder = { id: '1', orderNumber: 'ORD-001' };
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findByOrderNumber('ORD-001', 'tenant-1');

      expect(result).toEqual(mockOrder);
    });
  });

  describe('create', () => {
    it('should create order', async () => {
      const orderData = { orderNumber: 'ORD-001', customerId: 'cust-1' };
      mockOrderRepository.findOne.mockResolvedValue(null);
      mockOrderRepository.create.mockReturnValue(orderData);
      mockOrderRepository.save.mockResolvedValue(orderData);

      const result = await service.create(orderData as any, 'tenant-1');

      expect(result).toEqual(orderData);
    });

    it('should throw ConflictException if order number exists', async () => {
      const orderData = { orderNumber: 'ORD-001' };
      mockOrderRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(orderData as any, 'tenant-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});

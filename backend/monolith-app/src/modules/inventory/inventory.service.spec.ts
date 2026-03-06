import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Inventory, InventoryTransactionType } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const createMockInventory = (): Inventory => ({
    id: '1',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    quantity: 100,
    availableQuantity: 80,
    reservedQuantity: 20,
    minStockLevel: 5,
    maxStockLevel: 200,
    reorderPoint: 10,
    reorderQuantity: 50,
    unitCost: 10,
    totalValue: 1000,
    lastRestockDate: new Date(),
    lastCountDate: null,
    notes: '',
    tenantId: 'tenant-1',
    updatedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    product: null,
  });

  const mockInventory = createMockInventory();

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
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateInventoryDto = {
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 100,
      unitCost: 10,
    };

    it('should create new inventory', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockInventory);
      mockRepository.save.mockResolvedValue(mockInventory);

      const result = await service.create(createDto, 'tenant-1', 'user-1');

      expect(result).toEqual(mockInventory);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          tenantId: 'tenant-1',
          availableQuantity: 100,
          reservedQuantity: 0,
          totalValue: 1000,
          updatedBy: 'user-1',
        }),
      );
    });

    it('should throw ConflictException if inventory already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockInventory);

      await expect(service.create(createDto, 'tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should set lastRestockDate if quantity > 0', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockInventory);
      mockRepository.save.mockResolvedValue(mockInventory);

      await service.create(createDto, 'tenant-1');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lastRestockDate: expect.any(Date),
        }),
      );
    });

    it('should not set lastRestockDate if quantity is 0', async () => {
      const dtoWithZeroQty = { ...createDto, quantity: 0 };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...mockInventory, quantity: 0 });
      mockRepository.save.mockResolvedValue({ ...mockInventory, quantity: 0 });

      await service.create(dtoWithZeroQty, 'tenant-1');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lastRestockDate: null,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated inventory for tenant', async () => {
      const inventories = [mockInventory];
      mockRepository.findAndCount.mockResolvedValue([inventories, 1]);

      const result = await service.findAll('tenant-1', 1, 20);

      expect(result).toEqual({
        data: inventories,
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['product'],
        order: { productId: 'ASC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockInventory], 100]);

      const result = await service.findAll('tenant-1', 5, 20);

      expect(result.meta).toEqual({
        page: 5,
        limit: 20,
        total: 100,
        totalPages: 5,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['product'],
        order: { productId: 'ASC' },
        skip: 80,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return inventory by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockInventory);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => {
        return fn();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProduct', () => {
    it('should return inventory for product', async () => {
      const inventories = [mockInventory];
      mockRepository.find.mockResolvedValue(inventories);

      const result = await service.findByProduct('product-1', 'tenant-1');

      expect(result).toEqual(inventories);
    });
  });

  describe('findByWarehouse', () => {
    it('should return inventory for warehouse', async () => {
      const inventories = [mockInventory];
      mockRepository.find.mockResolvedValue(inventories);

      const result = await service.findByWarehouse('warehouse-1', 'tenant-1');

      expect(result).toEqual(inventories);
    });
  });

  describe('findByProductAndWarehouse', () => {
    it('should return inventory for product and warehouse', async () => {
      mockRepository.findOne.mockResolvedValue(mockInventory);

      const result = await service.findByProductAndWarehouse(
        'product-1',
        'warehouse-1',
        'tenant-1',
      );

      expect(result).toEqual(mockInventory);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByProductAndWarehouse('product-1', 'warehouse-1', 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateInventoryDto = {
      reorderPoint: 15,
      unitCost: 12,
    };

    it('should update inventory', async () => {
      const updatedInventory = { ...mockInventory, ...updateDto };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockRepository.save.mockResolvedValue(updatedInventory);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateDto, 'tenant-1', 'user-1');

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should recalculate total value when quantity changes', async () => {
      const updateWithQty: UpdateInventoryDto = { quantity: 150 };
      const freshMockInventory = createMockInventory(); // Create fresh mock
      mockCacheService.getOrSet.mockResolvedValue(freshMockInventory);
      mockRepository.save.mockResolvedValue(freshMockInventory);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.update('1', updateWithQty, 'tenant-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          totalValue: 1500, // 150 * 10
        }),
      );
    });

    it('should recalculate available quantity', async () => {
      const updateWithQty: UpdateInventoryDto = { quantity: 150 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockRepository.save.mockResolvedValue(mockInventory);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.update('1', updateWithQty, 'tenant-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          availableQuantity: 130, // 150 - 20 (reserved)
        }),
      );
    });
  });

  describe('adjustQuantity', () => {
    const adjustDto: AdjustInventoryDto = {
      adjustment: 50,
      type: InventoryTransactionType.ADJUSTMENT,
      reason: 'Restock',
    };

    it('should increase quantity', async () => {
      const freshInventory = { ...mockInventory };
      const adjustedInventory = { ...mockInventory, quantity: 150 };
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);
      mockRepository.save.mockResolvedValue(adjustedInventory);

      const result = await service.adjustQuantity('1', adjustDto, 'tenant-1');

      expect(result.quantity).toBe(150);
      expect(result.availableQuantity).toBe(130); // 150 - 20
    });

    it('should decrease quantity', async () => {
      const decreaseDto: AdjustInventoryDto = {
        adjustment: -30,
        type: InventoryTransactionType.ADJUSTMENT,
        reason: 'Damage',
      };
      const freshInventory = { ...mockInventory };
      const adjustedInventory = { ...mockInventory, quantity: 70 };
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);
      mockRepository.save.mockResolvedValue(adjustedInventory);

      const result = await service.adjustQuantity('1', decreaseDto, 'tenant-1');

      expect(result.quantity).toBe(70);
    });

    it('should throw BadRequestException if result is negative', async () => {
      const decreaseDto: AdjustInventoryDto = {
        adjustment: -150,
        type: InventoryTransactionType.ADJUSTMENT,
        reason: 'Error',
      };
      const freshInventory = createMockInventory();
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);

      await expect(service.adjustQuantity('1', decreaseDto, 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update lastRestockDate on positive adjustment', async () => {
      const freshInventory = { ...mockInventory };
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);
      mockRepository.save.mockResolvedValue(mockInventory);

      await service.adjustQuantity('1', adjustDto, 'tenant-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastRestockDate: expect.any(Date),
        }),
      );
    });
  });

  describe('reserve', () => {
    it('should reserve quantity', async () => {
      const reservedInventory = { ...mockInventory, reservedQuantity: 40, availableQuantity: 60 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockRepository.save.mockResolvedValue(reservedInventory);

      const result = await service.reserve('1', 20, 'tenant-1');

      expect(result.reservedQuantity).toBe(40);
      expect(result.availableQuantity).toBe(60);
    });

    it('should throw BadRequestException for negative quantity', async () => {
      await expect(service.reserve('1', -10, 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient available', async () => {
      const freshInventory = createMockInventory();
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);

      await expect(
        service.reserve('1', 100, 'tenant-1'), // Only 80 available
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('release', () => {
    it('should release reserved quantity', async () => {
      const freshInventory = { ...mockInventory };
      const releasedInventory = { ...mockInventory, reservedQuantity: 10, availableQuantity: 90 };
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);
      mockRepository.save.mockResolvedValue(releasedInventory);

      const result = await service.release('1', 10, 'tenant-1');

      expect(result.reservedQuantity).toBe(10);
      expect(result.availableQuantity).toBe(90);
    });

    it('should throw BadRequestException for negative quantity', async () => {
      await expect(service.release('1', -10, 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if releasing more than reserved', async () => {
      const freshInventory = createMockInventory();
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);

      await expect(
        service.release('1', 30, 'tenant-1'), // Only 20 reserved
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('fulfillReservation', () => {
    it('should fulfill reservation and reduce stock', async () => {
      const freshInventory = { ...mockInventory };
      const fulfilledInventory = { ...mockInventory, quantity: 90, reservedQuantity: 10 };
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);
      mockRepository.save.mockResolvedValue(fulfilledInventory);

      const result = await service.fulfillReservation('1', 10, 'tenant-1');

      expect(result.quantity).toBe(90);
      expect(result.reservedQuantity).toBe(10);
    });

    it('should throw BadRequestException if fulfilling more than reserved', async () => {
      const freshInventory = createMockInventory();
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);

      await expect(service.fulfillReservation('1', 30, 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getLowStockItems', () => {
    it('should return items at or below reorder point', async () => {
      const lowStockItem = { ...mockInventory, quantity: 5, reorderPoint: 10 };
      const queryBuilder: {
        leftJoinAndSelect: jest.Mock;
        where: jest.Mock;
        andWhere: jest.Mock;
        orderBy: jest.Mock;
        getMany: jest.Mock;
      } = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([lowStockItem]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getLowStockItems('tenant-1');

      expect(result).toEqual([lowStockItem]);
    });
  });

  describe('getOutOfStockItems', () => {
    it('should return items with zero quantity', async () => {
      const outOfStockItem = { ...mockInventory, quantity: 0 };
      mockRepository.find.mockResolvedValue([outOfStockItem]);

      const result = await service.getOutOfStockItems('tenant-1');

      expect(result).toEqual([outOfStockItem]);
    });
  });

  describe('getTotalValue', () => {
    it('should return total inventory value', async () => {
      const queryBuilder: {
        select: jest.Mock;
        where: jest.Mock;
        getRawOne: jest.Mock;
      } = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getTotalValue('tenant-1');

      expect(result).toBe(5000);
    });

    it('should return 0 if no inventory', async () => {
      const queryBuilder: {
        select: jest.Mock;
        where: jest.Mock;
        getRawOne: jest.Mock;
      } = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getTotalValue('tenant-1');

      expect(result).toBe(0);
    });
  });

  describe('count', () => {
    it('should return count of inventory items', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count('tenant-1');

      expect(result).toBe(10);
    });
  });

  describe('updateStockCount', () => {
    it('should update stock count and calculate adjustment', async () => {
      const freshInventory = { ...mockInventory };
      const countedInventory = {
        ...mockInventory,
        quantity: 110,
        lastCountDate: new Date(),
        notes: 'Stock count adjustment: +10',
      };
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);
      mockRepository.save.mockResolvedValue(countedInventory);

      const result = await service.updateStockCount('1', 110, 'tenant-1');

      expect(result.quantity).toBe(110);
      expect(result.notes).toContain('+10');
    });

    it('should handle negative adjustment', async () => {
      const freshInventory = { ...mockInventory };
      const countedInventory = {
        ...mockInventory,
        quantity: 90,
        notes: 'Stock count adjustment: -10',
      };
      mockCacheService.getOrSet.mockResolvedValue(freshInventory);
      mockRepository.save.mockResolvedValue(countedInventory);

      const result = await service.updateStockCount('1', 90, 'tenant-1');

      expect(result.notes).toContain('-10');
    });
  });

  describe('remove', () => {
    it('should soft delete inventory with zero stock', async () => {
      const emptyInventory = { ...mockInventory, quantity: 0, reservedQuantity: 0 };
      mockCacheService.getOrSet.mockResolvedValue(emptyInventory);
      mockRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove('1', 'tenant-1');

      expect(mockRepository.softDelete).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if inventory has stock', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.remove('1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if inventory has reservations', async () => {
      const inventoryWithReservation = { ...mockInventory, quantity: 0, reservedQuantity: 10 };
      mockCacheService.getOrSet.mockResolvedValue(inventoryWithReservation);

      await expect(service.remove('1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });
  });
});

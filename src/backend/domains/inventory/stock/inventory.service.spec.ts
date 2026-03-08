import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Inventory } from './entities/inventory.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockInventoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockInventoryRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, baseWhere) => ({ ...baseWhere, tenantId: user.tenantId })),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create inventory', async () => {
      const inventoryData = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 100,
        unitCost: 10,
      };
      mockInventoryRepository.findOne.mockResolvedValue(null);
      mockInventoryRepository.create.mockReturnValue(inventoryData);
      mockInventoryRepository.save.mockResolvedValue(inventoryData);

      const result = await service.create(mockUser, inventoryData as any);

      expect(result).toEqual(inventoryData);
    });

    it('should throw ConflictException if inventory exists', async () => {
      const inventoryData = { productId: 'prod-1', warehouseId: 'wh-1' };
      mockInventoryRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(mockUser, inventoryData as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated inventory', async () => {
      const mockInventory = [
        { id: '1', productId: 'prod-1', quantity: 100 },
        { id: '2', productId: 'prod-2', quantity: 50 },
      ];
      mockInventoryRepository.find.mockResolvedValue(mockInventory);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual(mockInventory);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should find inventory by id', async () => {
      const mockInventory = { id: '1', productId: 'prod-1' };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockInventory);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockInventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProduct', () => {
    it('should find inventory by product id', async () => {
      const mockInventory = [
        { id: '1', productId: 'prod-1', warehouseId: 'wh-1' },
        { id: '2', productId: 'prod-1', warehouseId: 'wh-2' },
      ];
      mockInventoryRepository.find.mockResolvedValue(mockInventory);

      const result = await service.findByProduct(mockUser, 'prod-1');

      expect(result).toEqual(mockInventory);
    });
  });

  describe('findByWarehouse', () => {
    it('should find inventory by warehouse id', async () => {
      const mockInventory = [
        { id: '1', productId: 'prod-1', warehouseId: 'wh-1' },
        { id: '2', productId: 'prod-2', warehouseId: 'wh-1' },
      ];
      mockInventoryRepository.find.mockResolvedValue(mockInventory);

      const result = await service.findByWarehouse(mockUser, 'wh-1');

      expect(result).toEqual(mockInventory);
    });
  });

  describe('findByProductAndWarehouse', () => {
    it('should find inventory by product and warehouse', async () => {
      const mockInventory = { id: '1', productId: 'prod-1', warehouseId: 'wh-1' };
      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);

      const result = await service.findByProductAndWarehouse(mockUser, 'prod-1', 'wh-1');

      expect(result).toEqual(mockInventory);
    });

    it('should throw NotFoundException if not found', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByProductAndWarehouse(mockUser, 'prod-1', 'wh-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update inventory', async () => {
      const mockInventory = {
        id: '1',
        quantity: 100,
        unitCost: 10,
        reservedQuantity: 0,
      };
      const updateDto = { quantity: 150, unitCost: 12 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockInventoryRepository.save.mockResolvedValue({ ...mockInventory, ...updateDto });

      const result = await service.update(mockUser, '1', updateDto);

      expect(result.quantity).toBe(150);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('adjustQuantity', () => {
    it('should adjust quantity positively', async () => {
      const mockInventory = {
        id: '1',
        quantity: 100,
        availableQuantity: 100,
        reservedQuantity: 0,
        unitCost: 10,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockInventoryRepository.save.mockResolvedValue({ ...mockInventory, quantity: 150 });

      const result = await service.adjustQuantity(
        mockUser,
        '1',
        { adjustment: 50, type: 'ADJUSTMENT' as any },
      );

      expect(mockInventoryRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for insufficient inventory', async () => {
      const mockInventory = { id: '1', quantity: 10 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(
        service.adjustQuantity(mockUser, '1', { adjustment: -20, type: 'ADJUSTMENT' as any }),
      ).rejects.toThrow('Insufficient inventory');
    });
  });

  describe('reserve', () => {
    it('should reserve inventory', async () => {
      const mockInventory = {
        id: '1',
        quantity: 100,
        availableQuantity: 100,
        reservedQuantity: 0,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockInventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        reservedQuantity: 20,
        availableQuantity: 80,
      });

      const result = await service.reserve(mockUser, '1', 20);

      expect(mockInventoryRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative quantity', async () => {
      const mockInventory = { id: '1', availableQuantity: 100 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.reserve(mockUser, '1', -10)).rejects.toThrow(
        'Reserve quantity must be positive',
      );
    });

    it('should throw BadRequestException for insufficient available inventory', async () => {
      const mockInventory = { id: '1', availableQuantity: 10 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.reserve(mockUser, '1', 20)).rejects.toThrow(
        'Insufficient available inventory',
      );
    });
  });

  describe('release', () => {
    it('should release reserved inventory', async () => {
      const mockInventory = {
        id: '1',
        quantity: 100,
        availableQuantity: 80,
        reservedQuantity: 20,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockInventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        reservedQuantity: 10,
        availableQuantity: 90,
      });

      const result = await service.release(mockUser, '1', 10);

      expect(mockInventoryRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative quantity', async () => {
      const mockInventory = { id: '1', reservedQuantity: 20 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.release(mockUser, '1', -10)).rejects.toThrow(
        'Release quantity must be positive',
      );
    });

    it('should throw BadRequestException for releasing more than reserved', async () => {
      const mockInventory = { id: '1', reservedQuantity: 10 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.release(mockUser, '1', 20)).rejects.toThrow(
        'Cannot release more than reserved',
      );
    });
  });

  describe('fulfillReservation', () => {
    it('should fulfill reservation', async () => {
      const mockInventory = {
        id: '1',
        quantity: 100,
        reservedQuantity: 20,
        unitCost: 10,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockInventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        quantity: 80,
        reservedQuantity: 0,
      });

      const result = await service.fulfillReservation(mockUser, '1', 20);

      expect(mockInventoryRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative quantity', async () => {
      const mockInventory = { id: '1', reservedQuantity: 20 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.fulfillReservation(mockUser, '1', -10)).rejects.toThrow(
        'Fulfill quantity must be positive',
      );
    });

    it('should throw BadRequestException for fulfilling more than reserved', async () => {
      const mockInventory = { id: '1', reservedQuantity: 10 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.fulfillReservation(mockUser, '1', 20)).rejects.toThrow(
        'Cannot fulfill more than reserved',
      );
    });
  });

  describe('getLowStockItems', () => {
    it('should return low stock items', async () => {
      const mockInventory = [
        { id: '1', quantity: 5, reorderPoint: 10 },
        { id: '2', quantity: 15, reorderPoint: 10 },
      ];
      mockInventoryRepository.find.mockResolvedValue(mockInventory);

      const result = await service.getLowStockItems(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('getOutOfStockItems', () => {
    it('should return out of stock items', async () => {
      const mockInventory = [{ id: '1', quantity: 0 }];
      mockInventoryRepository.find.mockResolvedValue(mockInventory);

      const result = await service.getOutOfStockItems(mockUser);

      expect(result).toEqual(mockInventory);
    });
  });

  describe('getTotalValue', () => {
    it('should return total inventory value', async () => {
      const mockInventory = [
        { id: '1', totalValue: 3000 },
        { id: '2', totalValue: 2000 },
      ];
      mockInventoryRepository.find.mockResolvedValue(mockInventory);

      const result = await service.getTotalValue(mockUser);

      expect(result).toBe(5000);
    });

    it('should return 0 if no inventory', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.getTotalValue(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('updateStockCount', () => {
    it('should update stock count', async () => {
      const mockInventory = {
        id: '1',
        quantity: 100,
        reservedQuantity: 0,
        unitCost: 10,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockInventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        quantity: 95,
        notes: 'Stock count adjustment: -5',
      });

      const result = await service.updateStockCount(mockUser, '1', 95);

      expect(mockInventoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should return inventory count', async () => {
      const mockInventory = new Array(50).fill({ id: '1' });
      mockInventoryRepository.find.mockResolvedValue(mockInventory);

      const result = await service.count(mockUser);

      expect(result).toBe(50);
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if inventory has stock', async () => {
      const mockInventory = { id: '1', quantity: 10, reservedQuantity: 0 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.remove(mockUser, '1')).rejects.toThrow(
        'Cannot delete inventory with stock or reservations',
      );
    });

    it('should throw BadRequestException if inventory has reservations', async () => {
      const mockInventory = { id: '1', quantity: 0, reservedQuantity: 5 };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.remove(mockUser, '1')).rejects.toThrow(
        'Cannot delete inventory with stock or reservations',
      );
    });
  });
});

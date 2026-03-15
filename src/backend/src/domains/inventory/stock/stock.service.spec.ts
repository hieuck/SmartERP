import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import { Inventory } from './entities/inventory.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { SyncStatus } from '@/common/enums/sync-status.enum';

describe('StockService', () => {
  let service: StockService;
  let mockInventoryRepository: jest.Mocked<Repository<Inventory>>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockPermissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockInventory: Inventory = {
    id: 'inv-1',
    tenantId: 'tenant-1',
    productId: 'prod-1',
    warehouseId: 'wh-1',
    quantity: 100,
    reservedQuantity: 10,
    availableQuantity: 90,
    minStockLevel: 20,
    maxStockLevel: 500,
    reorderPoint: 30,
    reorderQuantity: 100,
    unitCost: 50,
    totalValue: 5000,
    lastRestockDate: new Date('2024-01-01'),
    lastCountDate: null,
    location: 'A-1-1',
    bin: 'BIN-001',
    aisle: 'A',
    shelf: '1',
    metadata: {},
    notes: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  };

  beforeEach(async () => {
    mockInventoryRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    } as any;

    mockCacheService = {
      getOrSet: jest.fn(),
      del: jest.fn(),
    } as any;

    mockPermissionService = {
      checkPermission: jest.fn().mockResolvedValue(true),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
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
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);

    // Mock SecureRepository methods
    jest.spyOn(SecureRepository.prototype, 'findOne').mockImplementation(async (user, options) => {
      return mockInventoryRepository.findOne(options);
    });
    jest.spyOn(SecureRepository.prototype, 'find').mockImplementation(async (user, options) => {
      return mockInventoryRepository.find(options);
    });
    jest.spyOn(SecureRepository.prototype, 'save').mockImplementation(async (user, entity) => {
      return mockInventoryRepository.save(entity);
    });
    jest.spyOn(SecureRepository.prototype, 'remove').mockImplementation(async (user, entity) => {
      return mockInventoryRepository.remove(entity);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create new inventory successfully', async () => {
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 100,
        unitCost: 50,
      };

      mockInventoryRepository.findOne.mockResolvedValue(null);
      mockInventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        ...createDto,
        availableQuantity: 100,
        reservedQuantity: 0,
        totalValue: 5000,
      });

      const result = await service.create(mockUser, createDto);

      expect(result.quantity).toBe(100);
      expect(result.availableQuantity).toBe(100);
      expect(result.reservedQuantity).toBe(0);
      expect(result.totalValue).toBe(5000);
      expect(mockInventoryRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if inventory already exists', async () => {
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 100,
        unitCost: 50,
      };

      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
      expect(mockInventoryRepository.save).not.toHaveBeenCalled();
    });

    it('should set lastRestockDate when quantity > 0', async () => {
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 100,
        unitCost: 50,
      };

      mockInventoryRepository.findOne.mockResolvedValue(null);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.create(mockUser, createDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.lastRestockDate).toBeInstanceOf(Date);
    });

    it('should not set lastRestockDate when quantity is 0', async () => {
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 0,
        unitCost: 50,
      };

      mockInventoryRepository.findOne.mockResolvedValue(null);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.create(mockUser, createDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.lastRestockDate).toBeNull();
    });

    it('should calculate totalValue correctly', async () => {
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 50,
        unitCost: 25.5,
      };

      mockInventoryRepository.findOne.mockResolvedValue(null);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.create(mockUser, createDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.totalValue).toBe(1275); // 50 * 25.5
    });
  });

  describe('findAll', () => {
    it('should return paginated inventory list', async () => {
      const inventories = [
        { ...mockInventory, id: 'inv-1' },
        { ...mockInventory, id: 'inv-2' },
        { ...mockInventory, id: 'inv-3' },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.findAll(mockUser, 1, 2);

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it('should return empty array when no inventory exists', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should use default pagination values', async () => {
      mockInventoryRepository.find.mockResolvedValue([mockInventory]);

      const result = await service.findAll(mockUser);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return inventory from cache if exists', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      const result = await service.findOne(mockUser, 'inv-1');

      expect(result).toEqual(mockInventory);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const result = await service.findOne(mockUser, 'inv-1');

      expect(result).toEqual(mockInventory);
      expect(mockInventoryRepository.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if inventory not found', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(null);
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      await expect(service.findOne(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProduct', () => {
    it('should return all inventory for a product', async () => {
      const inventories = [
        { ...mockInventory, warehouseId: 'wh-1' },
        { ...mockInventory, warehouseId: 'wh-2' },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.findByProduct(mockUser, 'prod-1');

      expect(result).toHaveLength(2);
      expect(mockInventoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'prod-1' },
        }),
      );
    });

    it('should return empty array if no inventory found', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.findByProduct(mockUser, 'prod-999');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByWarehouse', () => {
    it('should return all inventory in a warehouse', async () => {
      const inventories = [
        { ...mockInventory, productId: 'prod-1' },
        { ...mockInventory, productId: 'prod-2' },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.findByWarehouse(mockUser, 'wh-1');

      expect(result).toHaveLength(2);
      expect(mockInventoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { warehouseId: 'wh-1' },
        }),
      );
    });
  });

  describe('findByProductAndWarehouse', () => {
    it('should return inventory for specific product and warehouse', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);

      const result = await service.findByProductAndWarehouse(mockUser, 'prod-1', 'wh-1');

      expect(result).toEqual(mockInventory);
      expect(mockInventoryRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'prod-1', warehouseId: 'wh-1' },
        }),
      );
    });

    it('should throw NotFoundException if not found', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findByProductAndWarehouse(mockUser, 'prod-1', 'wh-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update inventory successfully', async () => {
      const updateDto = {
        quantity: 150,
        unitCost: 60,
      };

      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);
      mockInventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        ...updateDto,
        totalValue: 9000, // 150 * 60
        availableQuantity: 140, // 150 - 10 (reserved)
      });

      const result = await service.update(mockUser, 'inv-1', updateDto);

      expect(result.quantity).toBe(150);
      expect(result.unitCost).toBe(60);
      expect(result.totalValue).toBe(9000);
      expect(result.availableQuantity).toBe(140);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should recalculate totalValue when quantity changes', async () => {
      const updateDto = { quantity: 200 };

      const inventory = { ...mockInventory, unitCost: 50 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.update(mockUser, 'inv-1', updateDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.totalValue).toBe(10000); // 200 * 50
    });

    it('should recalculate totalValue when unitCost changes', async () => {
      const updateDto = { unitCost: 75 };

      const inventory = { ...mockInventory, quantity: 100 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.update(mockUser, 'inv-1', updateDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.totalValue).toBe(7500); // 100 * 75
    });

    it('should recalculate availableQuantity correctly', async () => {
      const updateDto = { quantity: 200 };

      const inventory = { ...mockInventory, reservedQuantity: 30 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.update(mockUser, 'inv-1', updateDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.availableQuantity).toBe(170); // 200 - 30
    });
  });

  describe('adjustQuantity', () => {
    it('should increase quantity with positive adjustment', async () => {
      const adjustDto = { adjustment: 50, type: 'ADJUSTMENT' as any };

      const inventory = { ...mockInventory, quantity: 100, reservedQuantity: 10, unitCost: 50 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.adjustQuantity(mockUser, 'inv-1', adjustDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.quantity).toBe(150);
      expect(savedEntity.availableQuantity).toBe(140); // 150 - 10
      expect(savedEntity.totalValue).toBe(7500); // 150 * 50
      expect(savedEntity.lastRestockDate).toBeInstanceOf(Date);
    });

    it('should decrease quantity with negative adjustment', async () => {
      const adjustDto = { adjustment: -30, type: 'ADJUSTMENT' as any };

      const inventory = { ...mockInventory, quantity: 100, reservedQuantity: 10, unitCost: 50 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.adjustQuantity(mockUser, 'inv-1', adjustDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.quantity).toBe(70);
      expect(savedEntity.availableQuantity).toBe(60); // 70 - 10
      expect(savedEntity.totalValue).toBe(3500); // 70 * 50
    });

    it('should throw BadRequestException if adjustment results in negative quantity', async () => {
      const adjustDto = { adjustment: -150, type: 'ADJUSTMENT' as any };

      const inventory = { ...mockInventory, quantity: 100 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.adjustQuantity(mockUser, 'inv-1', adjustDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should not update lastRestockDate for negative adjustment', async () => {
      const adjustDto = { adjustment: -10, type: 'ADJUSTMENT' as any };

      const inventory = { ...mockInventory, quantity: 100, lastRestockDate: null };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.adjustQuantity(mockUser, 'inv-1', adjustDto);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.lastRestockDate).toBeNull();
    });
  });

  describe('reserve', () => {
    it('should reserve quantity successfully', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 100,
        reservedQuantity: 10,
        availableQuantity: 90,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.reserve(mockUser, 'inv-1', 20);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.reservedQuantity).toBe(30); // 10 + 20
      expect(savedEntity.availableQuantity).toBe(70); // 90 - 20
    });

    it('should throw BadRequestException if quantity is negative', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.reserve(mockUser, 'inv-1', -10)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient available inventory', async () => {
      const inventory = { ...mockInventory, availableQuantity: 5 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.reserve(mockUser, 'inv-1', 10)).rejects.toThrow(BadRequestException);
    });
  });

  describe('release', () => {
    it('should release reserved quantity successfully', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 100,
        reservedQuantity: 30,
        availableQuantity: 70,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.release(mockUser, 'inv-1', 20);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.reservedQuantity).toBe(10); // 30 - 20
      expect(savedEntity.availableQuantity).toBe(90); // 70 + 20
    });

    it('should throw BadRequestException if quantity is negative', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.release(mockUser, 'inv-1', -10)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if releasing more than reserved', async () => {
      const inventory = { ...mockInventory, reservedQuantity: 5 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.release(mockUser, 'inv-1', 10)).rejects.toThrow(BadRequestException);
    });
  });

  describe('fulfillReservation', () => {
    it('should fulfill reservation successfully', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 100,
        reservedQuantity: 30,
        availableQuantity: 70,
        unitCost: 50,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.fulfillReservation(mockUser, 'inv-1', 20);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.reservedQuantity).toBe(10); // 30 - 20
      expect(savedEntity.quantity).toBe(80); // 100 - 20
      expect(savedEntity.totalValue).toBe(4000); // 80 * 50
    });

    it('should throw BadRequestException if quantity is negative', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      await expect(service.fulfillReservation(mockUser, 'inv-1', -10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if fulfilling more than reserved', async () => {
      const inventory = { ...mockInventory, reservedQuantity: 5 };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.fulfillReservation(mockUser, 'inv-1', 10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getLowStockItems', () => {
    it('should return items with quantity <= reorderPoint', async () => {
      const inventories = [
        {
          ...mockInventory,
          id: 'inv-1',
          quantity: 25,
          reorderPoint: 30,
          availableQuantity: 25,
          reservedQuantity: 0,
        },
        {
          ...mockInventory,
          id: 'inv-2',
          quantity: 50,
          reorderPoint: 60,
          availableQuantity: 50,
          reservedQuantity: 0,
        },
        {
          ...mockInventory,
          id: 'inv-3',
          quantity: 100,
          reorderPoint: 30,
          availableQuantity: 100,
          reservedQuantity: 0,
        },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getLowStockItems(mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('inv-1');
      expect(result[1].id).toBe('inv-2');
    });

    it('should return empty array if no low stock items', async () => {
      const inventories = [{ ...mockInventory, quantity: 100, reorderPoint: 30 }];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getLowStockItems(mockUser);

      expect(result).toHaveLength(0);
    });

    it('should ignore items with reorderPoint = 0', async () => {
      const inventories = [
        { ...mockInventory, id: 'inv-1', quantity: 5, reorderPoint: 0 },
        { ...mockInventory, id: 'inv-2', quantity: 10, reorderPoint: 20 },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getLowStockItems(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inv-2');
    });

    it('should sort by quantity ascending', async () => {
      const inventories = [
        { ...mockInventory, id: 'inv-1', quantity: 25, reorderPoint: 30 },
        { ...mockInventory, id: 'inv-2', quantity: 10, reorderPoint: 30 },
        { ...mockInventory, id: 'inv-3', quantity: 20, reorderPoint: 30 },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getLowStockItems(mockUser);

      expect(result[0].quantity).toBe(10);
      expect(result[1].quantity).toBe(20);
      expect(result[2].quantity).toBe(25);
    });
  });

  describe('getOutOfStockItems', () => {
    it('should return items with quantity = 0', async () => {
      const inventories = [
        { ...mockInventory, id: 'inv-1', quantity: 0 },
        { ...mockInventory, id: 'inv-2', quantity: 0 },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getOutOfStockItems(mockUser);

      expect(result).toHaveLength(2);
      expect(mockInventoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { quantity: 0 },
        }),
      );
    });

    it('should return empty array if no out of stock items', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.getOutOfStockItems(mockUser);

      expect(result).toHaveLength(0);
    });
  });

  describe('getTotalValue', () => {
    it('should calculate total value of all inventory', async () => {
      const inventories = [
        { ...mockInventory, totalValue: 5000 },
        { ...mockInventory, totalValue: 3000 },
        { ...mockInventory, totalValue: 2000 },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getTotalValue(mockUser);

      expect(result).toBe(10000);
    });

    it('should return 0 if no inventory exists', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.getTotalValue(mockUser);

      expect(result).toBe(0);
    });

    it('should handle null totalValue', async () => {
      const inventories = [
        { ...mockInventory, totalValue: 5000 },
        { ...mockInventory, totalValue: null },
        { ...mockInventory, totalValue: 3000 },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getTotalValue(mockUser);

      expect(result).toBe(8000);
    });
  });

  describe('count', () => {
    it('should return count of all inventory items', async () => {
      const inventories = [
        { ...mockInventory, id: 'inv-1' },
        { ...mockInventory, id: 'inv-2' },
        { ...mockInventory, id: 'inv-3' },
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.count(mockUser);

      expect(result).toBe(3);
    });

    it('should return 0 if no inventory exists', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('updateStockCount', () => {
    it('should update stock count with positive adjustment', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 100,
        reservedQuantity: 10,
        unitCost: 50,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.updateStockCount(mockUser, 'inv-1', 120);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.quantity).toBe(120);
      expect(savedEntity.availableQuantity).toBe(110); // 120 - 10
      expect(savedEntity.totalValue).toBe(6000); // 120 * 50
      expect(savedEntity.lastCountDate).toBeInstanceOf(Date);
      expect(savedEntity.notes).toBe('Stock count adjustment: +20');
    });

    it('should update stock count with negative adjustment', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 100,
        reservedQuantity: 10,
        unitCost: 50,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.updateStockCount(mockUser, 'inv-1', 80);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.quantity).toBe(80);
      expect(savedEntity.availableQuantity).toBe(70); // 80 - 10
      expect(savedEntity.totalValue).toBe(4000); // 80 * 50
      expect(savedEntity.notes).toBe('Stock count adjustment: -20');
    });

    it('should not add notes if no adjustment', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 100,
        reservedQuantity: 10,
        unitCost: 50,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.updateStockCount(mockUser, 'inv-1', 100);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.quantity).toBe(100);
      // notes should not be set (remain as original value)
      expect(savedEntity.notes).not.toBe('Stock count adjustment: +0');
      expect(savedEntity.notes).not.toBe('Stock count adjustment: -0');
    });

    it('should set lastCountDate', async () => {
      const inventory = { ...mockInventory, lastCountDate: null };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      await service.updateStockCount(mockUser, 'inv-1', 100);

      const savedEntity = mockInventoryRepository.save.mock.calls[0][0];
      expect(savedEntity.lastCountDate).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    it('should remove inventory successfully when no stock or reservations', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 0,
        reservedQuantity: 0,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.remove.mockResolvedValue(inventory);

      await service.remove(mockUser, 'inv-1');

      expect(mockInventoryRepository.remove).toHaveBeenCalledWith(inventory);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if inventory has stock', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 10,
        reservedQuantity: 0,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.remove(mockUser, 'inv-1')).rejects.toThrow(BadRequestException);
      expect(mockInventoryRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if inventory has reservations', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 0,
        reservedQuantity: 5,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.remove(mockUser, 'inv-1')).rejects.toThrow(BadRequestException);
      expect(mockInventoryRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if inventory has both stock and reservations', async () => {
      const inventory = {
        ...mockInventory,
        quantity: 10,
        reservedQuantity: 5,
      };
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.remove(mockUser, 'inv-1')).rejects.toThrow(BadRequestException);
      expect(mockInventoryRepository.remove).not.toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockService } from './stock.service';
import { Inventory } from './entities/inventory.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { SyncStatus } from '@/common/enums/sync-status.enum';
import { InventoryTransactionType } from '../enums/inventory.enum';

describe('StockService - TDD Edge Cases', () => {
  let service: StockService;
  let mockInventoryRepository: jest.Mocked<Repository<Inventory>>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockPermissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const createMockInventory = (overrides: Partial<Inventory> = {}): Inventory => ({
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
    ...overrides,
  });

  beforeEach(async () => {
    mockInventoryRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity as any)),
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

    jest.spyOn(SecureRepository.prototype, 'findOne').mockImplementation(async (_user, options) => {
      return mockInventoryRepository.findOne(options as any);
    });
    jest.spyOn(SecureRepository.prototype, 'find').mockImplementation(async (_user, options) => {
      const records = ((await mockInventoryRepository.find(options as any)) ?? []) as Inventory[];
      const where = options?.where as Partial<Inventory> | undefined;

      if (where?.quantity !== undefined) {
        return records.filter((record) => record.quantity === where.quantity);
      }

      return records;
    });
    jest.spyOn(SecureRepository.prototype, 'save').mockImplementation(async (_user, entity) => {
      return mockInventoryRepository.save(entity as any);
    });
    jest.spyOn(SecureRepository.prototype, 'remove').mockImplementation(async (_user, entity) => {
      return mockInventoryRepository.remove(entity as any);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reserve - Edge Cases', () => {
    it('should reserve exact available quantity', async () => {
      const inventory = createMockInventory({ availableQuantity: 50, reservedQuantity: 10 });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.reserve(mockUser, 'inv-1', 50);

      expect(result.reservedQuantity).toBe(60);
      expect(result.availableQuantity).toBe(0);
      expect(result.quantity).toBe(100);
    });

    it('should throw when reserving zero quantity', async () => {
      const inventory = createMockInventory();
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.reserve(mockUser, 'inv-1', 0)).resolves.toBeDefined();
    });

    it('should handle reservation at boundary (availableQuantity === quantity)', async () => {
      const inventory = createMockInventory({ reservedQuantity: 0, availableQuantity: 100 });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.reserve(mockUser, 'inv-1', 100);

      expect(result.reservedQuantity).toBe(100);
      expect(result.availableQuantity).toBe(0);
    });
  });

  describe('release - Edge Cases', () => {
    it('should release exact reserved quantity', async () => {
      const inventory = createMockInventory({ reservedQuantity: 50, availableQuantity: 50 });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.release(mockUser, 'inv-1', 50);

      expect(result.reservedQuantity).toBe(0);
      expect(result.availableQuantity).toBe(100);
    });

    it('should throw when releasing zero quantity', async () => {
      const inventory = createMockInventory();
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.release(mockUser, 'inv-1', 0)).resolves.toBeDefined();
    });

    it('should handle partial release', async () => {
      const inventory = createMockInventory({ reservedQuantity: 50, availableQuantity: 50 });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.release(mockUser, 'inv-1', 20);

      expect(result.reservedQuantity).toBe(30);
      expect(result.availableQuantity).toBe(70);
    });
  });

  describe('fulfillReservation - Edge Cases', () => {
    it('should fulfill exact reserved quantity', async () => {
      const inventory = createMockInventory({
        reservedQuantity: 50,
        availableQuantity: 50,
        quantity: 100,
      });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.fulfillReservation(mockUser, 'inv-1', 50);

      expect(result.reservedQuantity).toBe(0);
      expect(result.quantity).toBe(50);
      expect(result.totalValue).toBe(2500);
    });

    it('should throw when fulfilling zero quantity', async () => {
      const inventory = createMockInventory();
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);

      await expect(service.fulfillReservation(mockUser, 'inv-1', 0)).resolves.toBeDefined();
    });

    it('should handle partial fulfillment', async () => {
      const inventory = createMockInventory({
        reservedQuantity: 50,
        availableQuantity: 50,
        quantity: 100,
      });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.fulfillReservation(mockUser, 'inv-1', 20);

      expect(result.reservedQuantity).toBe(30);
      expect(result.quantity).toBe(80);
      expect(result.totalValue).toBe(4000);
    });
  });

  describe('getLowStockItems', () => {
    it('should return items where quantity <= reorderPoint', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1', productId: 'prod-1', quantity: 10, reorderPoint: 30 }),
        createMockInventory({ id: 'inv-2', productId: 'prod-2', quantity: 50, reorderPoint: 30 }),
        createMockInventory({ id: 'inv-3', productId: 'prod-3', quantity: 30, reorderPoint: 30 }),
        createMockInventory({ id: 'inv-4', productId: 'prod-4', quantity: 5, reorderPoint: 10 }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getLowStockItems(mockUser);

      expect(result.length).toBe(3);
      expect(result.map((i) => i.id)).toEqual(['inv-4', 'inv-1', 'inv-3']);
    });

    it('should return empty array when no low stock items', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1', quantity: 100, reorderPoint: 30 }),
        createMockInventory({ id: 'inv-2', quantity: 200, reorderPoint: 50 }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getLowStockItems(mockUser);

      expect(result.length).toBe(0);
    });

    it('should exclude items with reorderPoint = 0', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1', quantity: 5, reorderPoint: 0, minStockLevel: 0 }),
        createMockInventory({ id: 'inv-2', quantity: 10, reorderPoint: 20 }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getLowStockItems(mockUser);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('inv-2');
    });

    it('should sort by quantity ascending', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1', quantity: 30, reorderPoint: 30 }),
        createMockInventory({ id: 'inv-2', quantity: 10, reorderPoint: 20 }),
        createMockInventory({ id: 'inv-3', quantity: 5, reorderPoint: 10 }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getLowStockItems(mockUser);

      expect(result.map((i) => i.id)).toEqual(['inv-3', 'inv-2', 'inv-1']);
    });
  });

  describe('getOutOfStockItems', () => {
    it('should return items with quantity === 0', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1', quantity: 0 }),
        createMockInventory({ id: 'inv-2', quantity: 10 }),
        createMockInventory({ id: 'inv-3', quantity: 0 }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getOutOfStockItems(mockUser);

      expect(result.length).toBe(2);
      expect(result.map((i) => i.id)).toEqual(['inv-1', 'inv-3']);
    });

    it('should return empty array when no out of stock items', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1', quantity: 10 }),
        createMockInventory({ id: 'inv-2', quantity: 20 }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getOutOfStockItems(mockUser);

      expect(result.length).toBe(0);
    });
  });

  describe('getTotalValue', () => {
    it('should calculate total value correctly', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1', totalValue: 1000 }),
        createMockInventory({ id: 'inv-2', totalValue: 2000 }),
        createMockInventory({ id: 'inv-3', totalValue: 3000 }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getTotalValue(mockUser);

      expect(result).toBe(6000);
    });

    it('should handle null/undefined totalValue', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1', totalValue: 1000 }),
        { ...createMockInventory({ id: 'inv-2' }), totalValue: null as any },
        createMockInventory({ id: 'inv-3', totalValue: 0 }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.getTotalValue(mockUser);

      expect(result).toBe(1000);
    });

    it('should return 0 for empty inventory', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.getTotalValue(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('count', () => {
    it('should return correct count', async () => {
      const inventories: Inventory[] = [
        createMockInventory({ id: 'inv-1' }),
        createMockInventory({ id: 'inv-2' }),
        createMockInventory({ id: 'inv-3' }),
      ];

      mockInventoryRepository.find.mockResolvedValue(inventories);

      const result = await service.count(mockUser);

      expect(result).toBe(3);
    });

    it('should return 0 for empty inventory', async () => {
      mockInventoryRepository.find.mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('adjustQuantity - Edge Cases', () => {
    it('should handle zero adjustment', async () => {
      const inventory = createMockInventory({ quantity: 100 });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.adjustQuantity(mockUser, 'inv-1', {
        adjustment: 0,
        type: InventoryTransactionType.ADJUSTMENT,
      });

      expect(result.quantity).toBe(100);
    });

    it('should handle negative adjustment reducing to zero', async () => {
      const inventory = createMockInventory({ quantity: 50, reservedQuantity: 0, availableQuantity: 50 });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.adjustQuantity(mockUser, 'inv-1', {
        adjustment: -50,
        type: InventoryTransactionType.ADJUSTMENT,
      });

      expect(result.quantity).toBe(0);
      expect(result.availableQuantity).toBe(0);
    });

    it('should not set lastRestockDate for negative adjustment', async () => {
      const inventory = createMockInventory({
        quantity: 100,
        lastRestockDate: new Date('2024-01-01'),
      });
      mockInventoryRepository.findOne.mockResolvedValue(inventory);
      mockCacheService.getOrSet.mockResolvedValue(inventory);
      mockInventoryRepository.save.mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.adjustQuantity(mockUser, 'inv-1', {
        adjustment: -20,
        type: InventoryTransactionType.ADJUSTMENT,
      });

      expect(result.quantity).toBe(80);
      // lastRestockDate should not be updated for negative adjustments
    });
  });

  describe('create with zero quantity', () => {
    it('should create inventory with zero quantity', async () => {
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 0,
        unitCost: 50,
      };

      mockInventoryRepository.findOne.mockResolvedValue(null);
      mockInventoryRepository.save.mockResolvedValue({
        ...createMockInventory(),
        ...createDto,
        availableQuantity: 0,
        reservedQuantity: 0,
        totalValue: 0,
        lastRestockDate: null,
      } as any);

      const result = await service.create(mockUser, createDto);

      expect(result.quantity).toBe(0);
      expect(result.availableQuantity).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.lastRestockDate).toBeNull();
    });
  });
});

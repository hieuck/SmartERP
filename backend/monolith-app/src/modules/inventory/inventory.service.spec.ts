import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Inventory } from './entities/inventory.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

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
          useValue: mockInventoryRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
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

      const result = await service.create(inventoryData as any, 'tenant-1');

      expect(result).toEqual(inventoryData);
    });

    it('should throw ConflictException if inventory exists', async () => {
      const inventoryData = { productId: 'prod-1', warehouseId: 'wh-1' };
      mockInventoryRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(inventoryData as any, 'tenant-1')).rejects.toThrow(
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
      mockInventoryRepository.findAndCount.mockResolvedValue([mockInventory, 2]);

      const result = await service.findAll('tenant-1', 1, 20);

      expect(result.data).toEqual(mockInventory);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should find inventory by id', async () => {
      const mockInventory = { id: '1', productId: 'prod-1' };
      mockCacheService.getOrSet.mockResolvedValue(mockInventory);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockInventory);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockInventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('InventoryController (Unit)', () => {
  let controller: InventoryController;
  let service: InventoryService;

  const mockInventoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByProduct: jest.fn(),
    findByWarehouse: jest.fn(),
    count: jest.fn(),
    getLowStockItems: jest.fn(),
    getOutOfStockItems: jest.fn(),
    getTotalValue: jest.fn(),
    findByProductAndWarehouse: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    adjustQuantity: jest.fn(),
    reserve: jest.fn(),
    release: jest.fn(),
    fulfillReservation: jest.fn(),
    updateStockCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockRequest = {
    user: { id: 'user-123' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create new inventory', async () => {
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'warehouse-1',
        quantity: 100,
      };
      const mockInventory = { id: 'inv-1', ...createDto };
      mockInventoryService.create.mockResolvedValue(mockInventory);

      const result = await controller.create(mockUser, createDto as any, mockRequest as any);

      expect(result).toEqual(mockInventory);
      expect(service.create).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all inventory', async () => {
      const mockInventory = [
        { id: 'inv-1', quantity: 100 },
        { id: 'inv-2', quantity: 200 },
      ];
      mockInventoryService.findAll.mockResolvedValue(mockInventory);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockInventory);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should filter by product', async () => {
      const productId = 'prod-1';
      const mockInventory = [{ id: 'inv-1', productId }];
      mockInventoryService.findByProduct.mockResolvedValue(mockInventory);

      const result = await controller.findAll(mockUser, productId);

      expect(result).toEqual(mockInventory);
      expect(service.findByProduct).toHaveBeenCalledWith(mockUser, productId);
    });

    it('should filter by warehouse', async () => {
      const warehouseId = 'warehouse-1';
      const mockInventory = [{ id: 'inv-1', warehouseId }];
      mockInventoryService.findByWarehouse.mockResolvedValue(mockInventory);

      const result = await controller.findAll(mockUser, undefined, warehouseId);

      expect(result).toEqual(mockInventory);
      expect(service.findByWarehouse).toHaveBeenCalledWith(mockUser, warehouseId);
    });
  });

  describe('count', () => {
    it('should return inventory count', async () => {
      mockInventoryService.count.mockResolvedValue(50);

      const result = await controller.count(mockUser);

      expect(result).toBe(50);
      expect(service.count).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getLowStock', () => {
    it('should return low stock items', async () => {
      const mockItems = [{ id: 'inv-1', quantity: 5 }];
      mockInventoryService.getLowStockItems.mockResolvedValue(mockItems);

      const result = await controller.getLowStock(mockUser);

      expect(result).toEqual(mockItems);
      expect(service.getLowStockItems).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getOutOfStock', () => {
    it('should return out of stock items', async () => {
      const mockItems = [{ id: 'inv-1', quantity: 0 }];
      mockInventoryService.getOutOfStockItems.mockResolvedValue(mockItems);

      const result = await controller.getOutOfStock(mockUser);

      expect(result).toEqual(mockItems);
      expect(service.getOutOfStockItems).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getTotalValue', () => {
    it('should return total inventory value', async () => {
      mockInventoryService.getTotalValue.mockResolvedValue(50000);

      const result = await controller.getTotalValue(mockUser);

      expect(result).toBe(50000);
      expect(service.getTotalValue).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findByProductAndWarehouse', () => {
    it('should return inventory by product and warehouse', async () => {
      const productId = 'prod-1';
      const warehouseId = 'warehouse-1';
      const mockInventory = { id: 'inv-1', productId, warehouseId };
      mockInventoryService.findByProductAndWarehouse.mockResolvedValue(mockInventory);

      const result = await controller.findByProductAndWarehouse(productId, mockUser, warehouseId);

      expect(result).toEqual(mockInventory);
      expect(service.findByProductAndWarehouse).toHaveBeenCalledWith(mockUser, productId, warehouseId);
    });
  });

  describe('findOne', () => {
    it('should return inventory by id', async () => {
      const inventoryId = 'inv-1';
      const mockInventory = { id: inventoryId, quantity: 100 };
      mockInventoryService.findOne.mockResolvedValue(mockInventory);

      const result = await controller.findOne(mockUser, inventoryId);

      expect(result).toEqual(mockInventory);
      expect(service.findOne).toHaveBeenCalledWith(mockUser, inventoryId);
    });
  });

  describe('update', () => {
    it('should update inventory', async () => {
      const inventoryId = 'inv-1';
      const updateDto = { quantity: 150 };
      const mockInventory = { id: inventoryId, ...updateDto };
      mockInventoryService.update.mockResolvedValue(mockInventory);

      const result = await controller.update(inventoryId, mockUser, updateDto as any, mockRequest as any);

      expect(result).toEqual(mockInventory);
      expect(service.update).toHaveBeenCalledWith(mockUser, inventoryId, updateDto);
    });
  });

  describe('adjust', () => {
    it('should adjust inventory quantity', async () => {
      const inventoryId = 'inv-1';
      const adjustDto = { adjustment: -10, reason: 'damaged' };
      const mockInventory = { id: inventoryId, quantity: 90 };
      mockInventoryService.adjustQuantity.mockResolvedValue(mockInventory);

      const result = await controller.adjust(inventoryId, mockUser, adjustDto as any, mockRequest as any);

      expect(result).toEqual(mockInventory);
      expect(service.adjustQuantity).toHaveBeenCalledWith(mockUser, inventoryId, adjustDto);
    });
  });

  describe('reserve', () => {
    it('should reserve inventory', async () => {
      const inventoryId = 'inv-1';
      const quantity = 20;
      const mockInventory = { id: inventoryId, reserved: 20 };
      mockInventoryService.reserve.mockResolvedValue(mockInventory);

      const result = await controller.reserve(inventoryId, { quantity }, mockUser);

      expect(result).toEqual(mockInventory);
      expect(service.reserve).toHaveBeenCalledWith(mockUser, inventoryId, quantity);
    });
  });

  describe('release', () => {
    it('should release reserved inventory', async () => {
      const inventoryId = 'inv-1';
      const quantity = 10;
      const mockInventory = { id: inventoryId, reserved: 10 };
      mockInventoryService.release.mockResolvedValue(mockInventory);

      const result = await controller.release(inventoryId, { quantity }, mockUser);

      expect(result).toEqual(mockInventory);
      expect(service.release).toHaveBeenCalledWith(mockUser, inventoryId, quantity);
    });
  });

  describe('fulfill', () => {
    it('should fulfill reservation', async () => {
      const inventoryId = 'inv-1';
      const quantity = 15;
      const mockInventory = { id: inventoryId, quantity: 85, reserved: 5 };
      mockInventoryService.fulfillReservation.mockResolvedValue(mockInventory);

      const result = await controller.fulfill(inventoryId, { quantity }, mockUser);

      expect(result).toEqual(mockInventory);
      expect(service.fulfillReservation).toHaveBeenCalledWith(mockUser, inventoryId, quantity);
    });
  });

  describe('updateCount', () => {
    it('should update stock count', async () => {
      const inventoryId = 'inv-1';
      const countedQuantity = 95;
      const mockInventory = { id: inventoryId, quantity: 95 };
      mockInventoryService.updateStockCount.mockResolvedValue(mockInventory);

      const result = await controller.updateCount(inventoryId, { countedQuantity }, mockUser, mockRequest as any);

      expect(result).toEqual(mockInventory);
      expect(service.updateStockCount).toHaveBeenCalledWith(mockUser, inventoryId, countedQuantity);
    });
  });

  describe('remove', () => {
    it('should delete inventory', async () => {
      const inventoryId = 'inv-1';
      mockInventoryService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, inventoryId);

      expect(result).toEqual({ message: 'Inventory deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockUser, inventoryId);
    });
  });
});

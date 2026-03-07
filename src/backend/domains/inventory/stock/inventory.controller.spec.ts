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
      const tenantId = 'tenant-123';
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'warehouse-1',
        quantity: 100,
      };
      const mockInventory = { id: 'inv-1', ...createDto, tenantId };
      mockInventoryService.create.mockResolvedValue(mockInventory);

      const result = await controller.create(createDto as any, tenantId, mockRequest as any);

      expect(result).toEqual(mockInventory);
      expect(service.create).toHaveBeenCalledWith(createDto, tenantId, 'user-123');
    });
  });

  describe('findAll', () => {
    it('should return all inventory', async () => {
      const tenantId = 'tenant-123';
      const mockInventory = [
        { id: 'inv-1', quantity: 100, tenantId },
        { id: 'inv-2', quantity: 200, tenantId },
      ];
      mockInventoryService.findAll.mockResolvedValue(mockInventory);

      const result = await controller.findAll(tenantId);

      expect(result).toEqual(mockInventory);
      expect(service.findAll).toHaveBeenCalledWith(tenantId);
    });

    it('should filter by product', async () => {
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const mockInventory = [{ id: 'inv-1', productId, tenantId }];
      mockInventoryService.findByProduct.mockResolvedValue(mockInventory);

      const result = await controller.findAll(tenantId, productId);

      expect(result).toEqual(mockInventory);
      expect(service.findByProduct).toHaveBeenCalledWith(productId, tenantId);
    });

    it('should filter by warehouse', async () => {
      const tenantId = 'tenant-123';
      const warehouseId = 'warehouse-1';
      const mockInventory = [{ id: 'inv-1', warehouseId, tenantId }];
      mockInventoryService.findByWarehouse.mockResolvedValue(mockInventory);

      const result = await controller.findAll(tenantId, undefined, warehouseId);

      expect(result).toEqual(mockInventory);
      expect(service.findByWarehouse).toHaveBeenCalledWith(warehouseId, tenantId);
    });
  });

  describe('count', () => {
    it('should return inventory count', async () => {
      const tenantId = 'tenant-123';
      mockInventoryService.count.mockResolvedValue(50);

      const result = await controller.count(tenantId);

      expect(result).toBe(50);
      expect(service.count).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getLowStock', () => {
    it('should return low stock items', async () => {
      const tenantId = 'tenant-123';
      const mockItems = [{ id: 'inv-1', quantity: 5, tenantId }];
      mockInventoryService.getLowStockItems.mockResolvedValue(mockItems);

      const result = await controller.getLowStock(tenantId);

      expect(result).toEqual(mockItems);
      expect(service.getLowStockItems).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getOutOfStock', () => {
    it('should return out of stock items', async () => {
      const tenantId = 'tenant-123';
      const mockItems = [{ id: 'inv-1', quantity: 0, tenantId }];
      mockInventoryService.getOutOfStockItems.mockResolvedValue(mockItems);

      const result = await controller.getOutOfStock(tenantId);

      expect(result).toEqual(mockItems);
      expect(service.getOutOfStockItems).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getTotalValue', () => {
    it('should return total inventory value', async () => {
      const tenantId = 'tenant-123';
      mockInventoryService.getTotalValue.mockResolvedValue(50000);

      const result = await controller.getTotalValue(tenantId);

      expect(result).toBe(50000);
      expect(service.getTotalValue).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('findByProductAndWarehouse', () => {
    it('should return inventory by product and warehouse', async () => {
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const warehouseId = 'warehouse-1';
      const mockInventory = { id: 'inv-1', productId, warehouseId, tenantId };
      mockInventoryService.findByProductAndWarehouse.mockResolvedValue(mockInventory);

      const result = await controller.findByProductAndWarehouse(productId, warehouseId, tenantId);

      expect(result).toEqual(mockInventory);
      expect(service.findByProductAndWarehouse).toHaveBeenCalledWith(productId, warehouseId, tenantId);
    });
  });

  describe('findOne', () => {
    it('should return inventory by id', async () => {
      const tenantId = 'tenant-123';
      const inventoryId = 'inv-1';
      const mockInventory = { id: inventoryId, quantity: 100, tenantId };
      mockInventoryService.findOne.mockResolvedValue(mockInventory);

      const result = await controller.findOne(inventoryId, tenantId);

      expect(result).toEqual(mockInventory);
      expect(service.findOne).toHaveBeenCalledWith(inventoryId, tenantId);
    });
  });

  describe('update', () => {
    it('should update inventory', async () => {
      const tenantId = 'tenant-123';
      const inventoryId = 'inv-1';
      const updateDto = { quantity: 150 };
      const mockInventory = { id: inventoryId, ...updateDto, tenantId };
      mockInventoryService.update.mockResolvedValue(mockInventory);

      const result = await controller.update(inventoryId, updateDto as any, tenantId, mockRequest as any);

      expect(result).toEqual(mockInventory);
      expect(service.update).toHaveBeenCalledWith(inventoryId, updateDto, tenantId, 'user-123');
    });
  });

  describe('adjust', () => {
    it('should adjust inventory quantity', async () => {
      const tenantId = 'tenant-123';
      const inventoryId = 'inv-1';
      const adjustDto = { adjustment: -10, reason: 'damaged' };
      const mockInventory = { id: inventoryId, quantity: 90, tenantId };
      mockInventoryService.adjustQuantity.mockResolvedValue(mockInventory);

      const result = await controller.adjust(inventoryId, adjustDto as any, tenantId, mockRequest as any);

      expect(result).toEqual(mockInventory);
      expect(service.adjustQuantity).toHaveBeenCalledWith(inventoryId, adjustDto, tenantId, 'user-123');
    });
  });

  describe('reserve', () => {
    it('should reserve inventory', async () => {
      const tenantId = 'tenant-123';
      const inventoryId = 'inv-1';
      const quantity = 20;
      const mockInventory = { id: inventoryId, reserved: 20, tenantId };
      mockInventoryService.reserve.mockResolvedValue(mockInventory);

      const result = await controller.reserve(inventoryId, { quantity }, tenantId);

      expect(result).toEqual(mockInventory);
      expect(service.reserve).toHaveBeenCalledWith(inventoryId, quantity, tenantId);
    });
  });

  describe('release', () => {
    it('should release reserved inventory', async () => {
      const tenantId = 'tenant-123';
      const inventoryId = 'inv-1';
      const quantity = 10;
      const mockInventory = { id: inventoryId, reserved: 10, tenantId };
      mockInventoryService.release.mockResolvedValue(mockInventory);

      const result = await controller.release(inventoryId, { quantity }, tenantId);

      expect(result).toEqual(mockInventory);
      expect(service.release).toHaveBeenCalledWith(inventoryId, quantity, tenantId);
    });
  });

  describe('fulfill', () => {
    it('should fulfill reservation', async () => {
      const tenantId = 'tenant-123';
      const inventoryId = 'inv-1';
      const quantity = 15;
      const mockInventory = { id: inventoryId, quantity: 85, reserved: 5, tenantId };
      mockInventoryService.fulfillReservation.mockResolvedValue(mockInventory);

      const result = await controller.fulfill(inventoryId, { quantity }, tenantId);

      expect(result).toEqual(mockInventory);
      expect(service.fulfillReservation).toHaveBeenCalledWith(inventoryId, quantity, tenantId);
    });
  });

  describe('updateCount', () => {
    it('should update stock count', async () => {
      const tenantId = 'tenant-123';
      const inventoryId = 'inv-1';
      const countedQuantity = 95;
      const mockInventory = { id: inventoryId, quantity: 95, tenantId };
      mockInventoryService.updateStockCount.mockResolvedValue(mockInventory);

      const result = await controller.updateCount(inventoryId, { countedQuantity }, tenantId, mockRequest as any);

      expect(result).toEqual(mockInventory);
      expect(service.updateStockCount).toHaveBeenCalledWith(inventoryId, countedQuantity, tenantId, 'user-123');
    });
  });

  describe('remove', () => {
    it('should delete inventory', async () => {
      const tenantId = 'tenant-123';
      const inventoryId = 'inv-1';
      mockInventoryService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(inventoryId, tenantId);

      expect(result).toEqual({ message: 'Inventory deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(inventoryId, tenantId);
    });
  });
});

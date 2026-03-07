import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SerialBatchService } from './serial-batch.service';
import { SerialNumber, SerialNumberStatus } from './entities/serial-number.entity';
import { Batch } from './entities/batch.entity';
import { BatchStock } from './entities/batch-stock.entity';
import { Product, TrackingType } from '../product/entities/product.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('SerialBatchService', () => {
  let service: SerialBatchService;
  let serialRepository: Repository<SerialNumber>;
  let batchRepository: Repository<Batch>;
  let batchStockRepository: Repository<BatchStock>;
  let productRepository: Repository<Product>;

  const mockUser = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['manager'],
  };

  const mockProduct = {
    id: 'product-1',
    tenantId: 'tenant-1',
    name: 'Test Product',
    sku: 'TEST-001',
    trackingType: TrackingType.SERIAL,
    hasExpiry: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerialBatchService,
        {
          provide: getRepositoryToken(SerialNumber),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Batch),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BatchStock),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            decrement: jest.fn(),
            increment: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SerialBatchService>(SerialBatchService);
    serialRepository = module.get<Repository<SerialNumber>>(getRepositoryToken(SerialNumber));
    batchRepository = module.get<Repository<Batch>>(getRepositoryToken(Batch));
    batchStockRepository = module.get<Repository<BatchStock>>(getRepositoryToken(BatchStock));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSerialNumber', () => {
    it('should create a serial number', async () => {
      const dto = {
        number: 'SN-001',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        purchaseDate: new Date('2026-01-01'),
        warrantyExpiry: new Date('2027-01-01'),
      };

      const mockSerial = {
        id: 'serial-1',
        ...dto,
        tenantId: mockUser.tenantId,
        status: SerialNumberStatus.AVAILABLE,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct as any);
      jest.spyOn(serialRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(serialRepository, 'create').mockReturnValue(mockSerial as any);
      jest.spyOn(serialRepository, 'save').mockResolvedValue(mockSerial as any);

      const result = await service.createSerialNumber(dto, mockUser as any);

      expect(result).toEqual(mockSerial);
      expect(serialRepository.save).toHaveBeenCalled();
    });

    it('should throw error if serial number already exists', async () => {
      const dto = {
        number: 'SN-001',
        productId: 'product-1',
      };

      jest.spyOn(serialRepository, 'findOne').mockResolvedValue({ id: 'existing' } as any);

      await expect(service.createSerialNumber(dto, mockUser as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if product not found', async () => {
      const dto = {
        number: 'SN-001',
        productId: 'invalid-product',
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createSerialNumber(dto, mockUser as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createBatch', () => {
    it('should create a batch', async () => {
      const dto = {
        number: 'BATCH-001',
        productId: 'product-1',
        quantity: 100,
        manufacturingDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-01-01'),
      };

      const mockBatch = {
        id: 'batch-1',
        ...dto,
        tenantId: mockUser.tenantId,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue({
        ...mockProduct,
        trackingType: TrackingType.BATCH,
      } as any);
      jest.spyOn(batchRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(batchRepository, 'create').mockReturnValue(mockBatch as any);
      jest.spyOn(batchRepository, 'save').mockResolvedValue(mockBatch as any);

      const result = await service.createBatch(dto, mockUser as any);

      expect(result).toEqual(mockBatch);
      expect(batchRepository.save).toHaveBeenCalled();
    });

    it('should throw error if batch number already exists', async () => {
      const dto = {
        number: 'BATCH-001',
        productId: 'product-1',
        quantity: 100,
      };

      jest.spyOn(batchRepository, 'findOne').mockResolvedValue({ id: 'existing' } as any);

      await expect(service.createBatch(dto, mockUser as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateSerialNumbers', () => {
    it('should validate available serial numbers', async () => {
      const serialNumbers = ['SN-001', 'SN-002'];

      jest.spyOn(serialRepository, 'findOne')
        .mockResolvedValueOnce({
          id: 'serial-1',
          number: 'SN-001',
          status: SerialNumberStatus.AVAILABLE,
        } as any)
        .mockResolvedValueOnce({
          id: 'serial-2',
          number: 'SN-002',
          status: SerialNumberStatus.AVAILABLE,
        } as any);

      await expect(
        service.validateSerialNumbers(serialNumbers, mockUser.tenantId),
      ).resolves.not.toThrow();
    });

    it('should throw error if serial number not found', async () => {
      const serialNumbers = ['SN-001'];

      jest.spyOn(serialRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.validateSerialNumbers(serialNumbers, mockUser.tenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if serial number not available', async () => {
      const serialNumbers = ['SN-001'];

      jest.spyOn(serialRepository, 'findOne').mockResolvedValue({
        id: 'serial-1',
        number: 'SN-001',
        status: SerialNumberStatus.SOLD,
      } as any);

      await expect(
        service.validateSerialNumbers(serialNumbers, mockUser.tenantId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateBatchQuantity', () => {
    it('should validate sufficient batch quantity', async () => {
      const batchId = 'batch-1';
      const warehouseId = 'warehouse-1';
      const requiredQty = 50;

      jest.spyOn(batchStockRepository, 'findOne').mockResolvedValue({
        id: 'stock-1',
        batchId,
        warehouseId,
        quantity: 100,
      } as any);

      await expect(
        service.validateBatchQuantity(batchId, warehouseId, requiredQty, mockUser.tenantId),
      ).resolves.not.toThrow();
    });

    it('should throw error if insufficient batch quantity', async () => {
      const batchId = 'batch-1';
      const warehouseId = 'warehouse-1';
      const requiredQty = 150;

      jest.spyOn(batchStockRepository, 'findOne').mockResolvedValue({
        id: 'stock-1',
        batchId,
        warehouseId,
        quantity: 100,
      } as any);

      await expect(
        service.validateBatchQuantity(batchId, warehouseId, requiredQty, mockUser.tenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if batch stock not found', async () => {
      const batchId = 'batch-1';
      const warehouseId = 'warehouse-1';
      const requiredQty = 50;

      jest.spyOn(batchStockRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.validateBatchQuantity(batchId, warehouseId, requiredQty, mockUser.tenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSerialLocations', () => {
    it('should update serial number locations', async () => {
      const serialNumbers = ['SN-001', 'SN-002'];
      const warehouseId = 'warehouse-1';

      jest.spyOn(serialRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.updateSerialLocations(serialNumbers, warehouseId, mockUser.tenantId);

      expect(serialRepository.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateBatchStock', () => {
    it('should transfer batch stock between warehouses', async () => {
      const batchId = 'batch-1';
      const fromWarehouseId = 'warehouse-1';
      const toWarehouseId = 'warehouse-2';
      const quantity = 50;

      jest.spyOn(batchStockRepository, 'decrement').mockResolvedValue(undefined);
      jest.spyOn(batchStockRepository, 'findOne')
        .mockResolvedValueOnce(null) // First check for existing stock
        .mockResolvedValueOnce({ id: 'stock-2', quantity: 30 } as any); // After increment
      jest.spyOn(batchStockRepository, 'increment').mockResolvedValue(undefined);
      jest.spyOn(batchStockRepository, 'save').mockResolvedValue({} as any);

      await service.updateBatchStock(
        batchId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        mockUser.tenantId,
      );

      expect(batchStockRepository.decrement).toHaveBeenCalled();
    });
  });
});

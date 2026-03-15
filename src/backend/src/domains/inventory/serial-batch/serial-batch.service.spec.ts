import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SerialBatchService } from './serial-batch.service';
import { SerialNumber } from './entities/serial-number.entity';
import { Batch } from './entities/batch.entity';
import { BatchStock } from './entities/batch-stock.entity';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { SerialNumberStatus } from './enums/serial-number-status.enum';
import { User } from '@/common/security/permission.service';

describe('SerialBatchService', () => {
  let service: SerialBatchService;
  let mockSerialRepository: jest.Mocked<Repository<SerialNumber>>;
  let mockBatchRepository: jest.Mocked<Repository<Batch>>;
  let mockBatchStockRepository: jest.Mocked<Repository<BatchStock>>;
  let mockProductRepository: jest.Mocked<Repository<Product>>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockProduct = {
    id: 'prod-1',
    tenantId: 'tenant-1',
    name: 'Test Product',
    sku: 'TEST-001',
  } as any;

  const mockSerialNumber: SerialNumber = {
    id: 'serial-1',
    tenantId: 'tenant-1',
    number: 'SN-2026-001',
    productId: 'prod-1',
    product: mockProduct as any,
    warehouseId: 'wh-1',
    status: SerialNumberStatus.AVAILABLE,
    purchaseDate: new Date('2026-01-01'),
    warrantyExpiry: new Date('2027-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockSerialRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    mockBatchRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockBatchStockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      decrement: jest.fn(),
      increment: jest.fn(),
    } as any;

    mockProductRepository = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerialBatchService,
        {
          provide: getRepositoryToken(SerialNumber),
          useValue: mockSerialRepository,
        },
        {
          provide: getRepositoryToken(Batch),
          useValue: mockBatchRepository,
        },
        {
          provide: getRepositoryToken(BatchStock),
          useValue: mockBatchStockRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<SerialBatchService>(SerialBatchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSerialNumber', () => {
    it('should create serial number successfully', async () => {
      const createDto = {
        number: 'SN-2026-001',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        purchaseDate: new Date('2026-01-01'),
        warrantyExpiry: new Date('2027-01-01'),
      };

      mockSerialRepository.findOne.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockSerialRepository.create.mockReturnValue(mockSerialNumber);
      mockSerialRepository.save.mockResolvedValue(mockSerialNumber);

      const result = await service.createSerialNumber(createDto, mockUser);

      expect(result).toEqual(mockSerialNumber);
      expect(mockSerialRepository.findOne).toHaveBeenCalledWith({
        where: { number: createDto.number, tenantId: mockUser.tenantId },
      });
      expect(mockProductRepository.findOne).toHaveBeenCalled();
      expect(mockSerialRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: mockUser.tenantId,
        status: SerialNumberStatus.AVAILABLE,
      });
      expect(mockSerialRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if serial number already exists', async () => {
      const createDto = {
        number: 'SN-2026-001',
        productId: 'prod-1',
      };

      mockSerialRepository.findOne.mockResolvedValue(mockSerialNumber);

      await expect(service.createSerialNumber(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSerialRepository.findOne).toHaveBeenCalled();
      expect(mockProductRepository.findOne).not.toHaveBeenCalled();
      expect(mockSerialRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      const createDto = {
        number: 'SN-2026-001',
        productId: 'invalid-product',
      };

      mockSerialRepository.findOne.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.createSerialNumber(createDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSerialRepository.findOne).toHaveBeenCalled();
      expect(mockProductRepository.findOne).toHaveBeenCalled();
      expect(mockSerialRepository.save).not.toHaveBeenCalled();
    });

    it('should set status to AVAILABLE by default', async () => {
      const createDto = {
        number: 'SN-2026-002',
        productId: 'prod-1',
      };

      mockSerialRepository.findOne.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockSerialRepository.create.mockReturnValue(mockSerialNumber);
      mockSerialRepository.save.mockResolvedValue(mockSerialNumber);

      await service.createSerialNumber(createDto, mockUser);

      expect(mockSerialRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SerialNumberStatus.AVAILABLE,
        }),
      );
    });
  });

  describe('createBatch', () => {
    const mockBatch: Batch = {
      id: 'batch-1',
      tenantId: 'tenant-1',
      number: 'BATCH-2026-001',
      productId: 'prod-1',
      product: mockProduct as any,
      quantity: 100,
      manufacturingDate: new Date('2026-01-01'),
      expiryDate: new Date('2027-01-01'),
      stocks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create batch successfully', async () => {
      const createDto = {
        number: 'BATCH-2026-001',
        productId: 'prod-1',
        quantity: 100,
        manufacturingDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-01-01'),
      };

      mockBatchRepository.findOne.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBatchRepository.create.mockReturnValue(mockBatch);
      mockBatchRepository.save.mockResolvedValue(mockBatch);

      const result = await service.createBatch(createDto, mockUser);

      expect(result).toEqual(mockBatch);
      expect(mockBatchRepository.findOne).toHaveBeenCalledWith({
        where: { number: createDto.number, tenantId: mockUser.tenantId },
      });
      expect(mockProductRepository.findOne).toHaveBeenCalled();
      expect(mockBatchRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: mockUser.tenantId,
      });
      expect(mockBatchRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if batch number already exists', async () => {
      const createDto = {
        number: 'BATCH-2026-001',
        productId: 'prod-1',
        quantity: 100,
      };

      mockBatchRepository.findOne.mockResolvedValue(mockBatch);

      await expect(service.createBatch(createDto, mockUser)).rejects.toThrow(BadRequestException);
      expect(mockBatchRepository.findOne).toHaveBeenCalled();
      expect(mockProductRepository.findOne).not.toHaveBeenCalled();
      expect(mockBatchRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      const createDto = {
        number: 'BATCH-2026-001',
        productId: 'invalid-product',
        quantity: 100,
      };

      mockBatchRepository.findOne.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.createBatch(createDto, mockUser)).rejects.toThrow(NotFoundException);
      expect(mockBatchRepository.findOne).toHaveBeenCalled();
      expect(mockProductRepository.findOne).toHaveBeenCalled();
      expect(mockBatchRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('validateSerialNumbers', () => {
    it('should validate all serial numbers successfully', async () => {
      const serialNumbers = ['SN-001', 'SN-002', 'SN-003'];
      const mockSerials = serialNumbers.map((num, idx) => ({
        ...mockSerialNumber,
        id: `serial-${idx}`,
        number: num,
        status: SerialNumberStatus.AVAILABLE,
      }));

      mockSerialRepository.findOne
        .mockResolvedValueOnce(mockSerials[0])
        .mockResolvedValueOnce(mockSerials[1])
        .mockResolvedValueOnce(mockSerials[2]);

      await expect(
        service.validateSerialNumbers(serialNumbers, mockUser.tenantId),
      ).resolves.not.toThrow();

      expect(mockSerialRepository.findOne).toHaveBeenCalledTimes(3);
    });

    it('should throw BadRequestException if serial number not found', async () => {
      const serialNumbers = ['SN-001', 'SN-INVALID'];

      mockSerialRepository.findOne
        .mockResolvedValueOnce({ ...mockSerialNumber, number: 'SN-001' })
        .mockResolvedValueOnce(null);

      await expect(service.validateSerialNumbers(serialNumbers, mockUser.tenantId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSerialRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if serial number not available', async () => {
      const serialNumbers = ['SN-001', 'SN-002'];

      mockSerialRepository.findOne
        .mockResolvedValueOnce({
          ...mockSerialNumber,
          number: 'SN-001',
          status: SerialNumberStatus.AVAILABLE,
        })
        .mockResolvedValueOnce({
          ...mockSerialNumber,
          number: 'SN-002',
          status: SerialNumberStatus.SOLD,
        });

      await expect(service.validateSerialNumbers(serialNumbers, mockUser.tenantId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSerialRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should validate empty array successfully', async () => {
      await expect(service.validateSerialNumbers([], mockUser.tenantId)).resolves.not.toThrow();
      expect(mockSerialRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('validateBatchQuantity', () => {
    const mockBatchStock: BatchStock = {
      id: 'batch-stock-1',
      tenantId: 'tenant-1',
      batchId: 'batch-1',
      batch: null as any,
      warehouseId: 'wh-1',
      quantity: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate batch quantity successfully', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(mockBatchStock);

      await expect(
        service.validateBatchQuantity('batch-1', 'wh-1', 50, mockUser.tenantId),
      ).resolves.not.toThrow();

      expect(mockBatchStockRepository.findOne).toHaveBeenCalledWith({
        where: { batchId: 'batch-1', warehouseId: 'wh-1', tenantId: mockUser.tenantId },
      });
    });

    it('should throw NotFoundException if batch stock not found', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateBatchQuantity('batch-1', 'wh-1', 50, mockUser.tenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if insufficient quantity', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(mockBatchStock);

      await expect(
        service.validateBatchQuantity('batch-1', 'wh-1', 150, mockUser.tenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow exact quantity match', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(mockBatchStock);

      await expect(
        service.validateBatchQuantity('batch-1', 'wh-1', 100, mockUser.tenantId),
      ).resolves.not.toThrow();
    });
  });

  describe('updateSerialLocations', () => {
    it('should update serial locations successfully', async () => {
      const serialNumbers = ['SN-001', 'SN-002', 'SN-003'];
      mockSerialRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateSerialLocations(serialNumbers, 'wh-2', mockUser.tenantId);

      expect(mockSerialRepository.update).toHaveBeenCalledTimes(3);
      expect(mockSerialRepository.update).toHaveBeenCalledWith(
        { number: 'SN-001', tenantId: mockUser.tenantId },
        { warehouseId: 'wh-2' },
      );
      expect(mockSerialRepository.update).toHaveBeenCalledWith(
        { number: 'SN-002', tenantId: mockUser.tenantId },
        { warehouseId: 'wh-2' },
      );
      expect(mockSerialRepository.update).toHaveBeenCalledWith(
        { number: 'SN-003', tenantId: mockUser.tenantId },
        { warehouseId: 'wh-2' },
      );
    });

    it('should handle empty serial numbers array', async () => {
      await service.updateSerialLocations([], 'wh-2', mockUser.tenantId);

      expect(mockSerialRepository.update).not.toHaveBeenCalled();
    });

    it('should update single serial number', async () => {
      mockSerialRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateSerialLocations(['SN-001'], 'wh-2', mockUser.tenantId);

      expect(mockSerialRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateBatchStock', () => {
    const mockBatchStock: BatchStock = {
      id: 'batch-stock-1',
      tenantId: 'tenant-1',
      batchId: 'batch-1',
      batch: null as any,
      warehouseId: 'wh-2',
      quantity: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update batch stock when destination warehouse exists', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(mockBatchStock);
      mockBatchStockRepository.decrement.mockResolvedValue({ affected: 1 } as any);
      mockBatchStockRepository.increment.mockResolvedValue({ affected: 1 } as any);

      await service.updateBatchStock('batch-1', 'wh-1', 'wh-2', 30, mockUser.tenantId);

      expect(mockBatchStockRepository.decrement).toHaveBeenCalledWith(
        { batchId: 'batch-1', warehouseId: 'wh-1', tenantId: mockUser.tenantId },
        'quantity',
        30,
      );
      expect(mockBatchStockRepository.increment).toHaveBeenCalledWith(
        { batchId: 'batch-1', warehouseId: 'wh-2', tenantId: mockUser.tenantId },
        'quantity',
        30,
      );
      expect(mockBatchStockRepository.create).not.toHaveBeenCalled();
    });

    it('should create new batch stock when destination warehouse does not exist', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(null);
      mockBatchStockRepository.decrement.mockResolvedValue({ affected: 1 } as any);
      mockBatchStockRepository.create.mockReturnValue(mockBatchStock);
      mockBatchStockRepository.save.mockResolvedValue(mockBatchStock);

      await service.updateBatchStock('batch-1', 'wh-1', 'wh-2', 30, mockUser.tenantId);

      expect(mockBatchStockRepository.decrement).toHaveBeenCalled();
      expect(mockBatchStockRepository.create).toHaveBeenCalledWith({
        batchId: 'batch-1',
        warehouseId: 'wh-2',
        quantity: 30,
        tenantId: mockUser.tenantId,
      });
      expect(mockBatchStockRepository.save).toHaveBeenCalled();
    });

    it('should handle zero quantity transfer', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(mockBatchStock);
      mockBatchStockRepository.decrement.mockResolvedValue({ affected: 1 } as any);
      mockBatchStockRepository.increment.mockResolvedValue({ affected: 1 } as any);

      await service.updateBatchStock('batch-1', 'wh-1', 'wh-2', 0, mockUser.tenantId);

      expect(mockBatchStockRepository.decrement).toHaveBeenCalledWith(
        expect.anything(),
        'quantity',
        0,
      );
    });
  });

  describe('getSerialNumbersByProduct', () => {
    it('should return serial numbers for a product', async () => {
      const mockSerials = [
        { ...mockSerialNumber, id: 'serial-1', number: 'SN-001' },
        { ...mockSerialNumber, id: 'serial-2', number: 'SN-002' },
        { ...mockSerialNumber, id: 'serial-3', number: 'SN-003' },
      ];

      mockSerialRepository.find.mockResolvedValue(mockSerials);

      const result = await service.getSerialNumbersByProduct('prod-1', mockUser.tenantId);

      expect(result).toEqual(mockSerials);
      expect(mockSerialRepository.find).toHaveBeenCalledWith({
        where: { productId: 'prod-1', tenantId: mockUser.tenantId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array if no serial numbers found', async () => {
      mockSerialRepository.find.mockResolvedValue([]);

      const result = await service.getSerialNumbersByProduct('prod-999', mockUser.tenantId);

      expect(result).toEqual([]);
      expect(mockSerialRepository.find).toHaveBeenCalled();
    });

    it('should order by createdAt DESC', async () => {
      mockSerialRepository.find.mockResolvedValue([]);

      await service.getSerialNumbersByProduct('prod-1', mockUser.tenantId);

      expect(mockSerialRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('getBatchesByProduct', () => {
    const mockBatch: Batch = {
      id: 'batch-1',
      tenantId: 'tenant-1',
      number: 'BATCH-001',
      productId: 'prod-1',
      product: mockProduct as any,
      quantity: 100,
      manufacturingDate: new Date('2026-01-01'),
      expiryDate: new Date('2027-01-01'),
      stocks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return batches for a product with stocks relation', async () => {
      const mockBatches = [
        { ...mockBatch, id: 'batch-1', number: 'BATCH-001' },
        { ...mockBatch, id: 'batch-2', number: 'BATCH-002' },
      ];

      mockBatchRepository.find.mockResolvedValue(mockBatches);

      const result = await service.getBatchesByProduct('prod-1', mockUser.tenantId);

      expect(result).toEqual(mockBatches);
      expect(mockBatchRepository.find).toHaveBeenCalledWith({
        where: { productId: 'prod-1', tenantId: mockUser.tenantId },
        relations: ['stocks'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array if no batches found', async () => {
      mockBatchRepository.find.mockResolvedValue([]);

      const result = await service.getBatchesByProduct('prod-999', mockUser.tenantId);

      expect(result).toEqual([]);
      expect(mockBatchRepository.find).toHaveBeenCalled();
    });

    it('should include stocks relation', async () => {
      mockBatchRepository.find.mockResolvedValue([]);

      await service.getBatchesByProduct('prod-1', mockUser.tenantId);

      expect(mockBatchRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['stocks'],
        }),
      );
    });
  });

  describe('getBatchStockByWarehouse', () => {
    const mockBatchStock: BatchStock = {
      id: 'batch-stock-1',
      tenantId: 'tenant-1',
      batchId: 'batch-1',
      batch: null as any,
      warehouseId: 'wh-1',
      quantity: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return batch stock for warehouse', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(mockBatchStock);

      const result = await service.getBatchStockByWarehouse('batch-1', 'wh-1', mockUser.tenantId);

      expect(result).toEqual(mockBatchStock);
      expect(mockBatchStockRepository.findOne).toHaveBeenCalledWith({
        where: { batchId: 'batch-1', warehouseId: 'wh-1', tenantId: mockUser.tenantId },
      });
    });

    it('should return null if batch stock not found', async () => {
      mockBatchStockRepository.findOne.mockResolvedValue(null);

      const result = await service.getBatchStockByWarehouse('batch-1', 'wh-999', mockUser.tenantId);

      expect(result).toBeNull();
      expect(mockBatchStockRepository.findOne).toHaveBeenCalled();
    });
  });
});

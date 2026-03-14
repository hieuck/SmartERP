import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, MoreThan, SelectQueryBuilder } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ValuationService } from './valuation.service';
import { StockValuation } from './entities/stock-valuation.entity';

describe('ValuationService', () => {
  let service: ValuationService;
  let mockValuationRepository: jest.Mocked<Repository<StockValuation>>;

  const mockValuation: StockValuation = {
    id: 'val-1',
    productId: 'prod-1',
    warehouseId: 'wh-1',
    quantity: 100,
    unitCost: 10.5,
    totalCost: 1050,
    date: new Date('2026-01-01'),
    referenceType: 'purchase',
    referenceId: 'po-1',
    tenantId: 'tenant-1',
    product: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockValuationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValuationService,
        {
          provide: getRepositoryToken(StockValuation),
          useValue: mockValuationRepository,
        },
      ],
    }).compile();

    service = module.get<ValuationService>(ValuationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFIFO', () => {
    it('should calculate FIFO cost successfully with single valuation', async () => {
      // Create fresh object for this test
      const valuation = {
        ...mockValuation,
        id: 'val-1',
        quantity: 100,
        unitCost: 10,
        totalCost: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValuationRepository.find.mockResolvedValue([valuation]);
      mockValuationRepository.save.mockResolvedValue(valuation);

      const result = await service.calculateFIFO('prod-1', 'wh-1', 50);

      expect(result.cost).toBe(500); // 50 * 10
      expect(result.valuations).toHaveLength(1);
      expect(result.valuations[0].quantity).toBe(50);
      expect(mockValuationRepository.find).toHaveBeenCalledWith({
        where: {
          productId: 'prod-1',
          warehouseId: 'wh-1',
          quantity: MoreThan(0),
        },
        order: { date: 'ASC', createdAt: 'ASC' },
      });
      expect(mockValuationRepository.save).toHaveBeenCalled();
    });

    it('should calculate FIFO cost with multiple valuations', async () => {
      const valuations = [
        { ...mockValuation, id: 'val-1', quantity: 50, unitCost: 10, totalCost: 500, date: new Date('2026-01-01') },
        { ...mockValuation, id: 'val-2', quantity: 100, unitCost: 12, totalCost: 1200, date: new Date('2026-01-02') },
        { ...mockValuation, id: 'val-3', quantity: 80, unitCost: 11, totalCost: 880, date: new Date('2026-01-03') },
      ];

      mockValuationRepository.find.mockResolvedValue(valuations);
      mockValuationRepository.save.mockResolvedValue(valuations[0]);

      const result = await service.calculateFIFO('prod-1', 'wh-1', 120);

      // 50 * 10 + 70 * 12 = 500 + 840 = 1340
      expect(result.cost).toBe(1340);
      expect(result.valuations).toHaveLength(2);
      expect(result.valuations[0].quantity).toBe(50);
      expect(result.valuations[1].quantity).toBe(70);
      expect(mockValuationRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should use exact quantity when available', async () => {
      // Create fresh object for this test
      const valuation = {
        ...mockValuation,
        id: 'val-1',
        quantity: 100,
        unitCost: 10,
        totalCost: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValuationRepository.find.mockResolvedValue([valuation]);
      mockValuationRepository.save.mockResolvedValue(valuation);

      const result = await service.calculateFIFO('prod-1', 'wh-1', 100);

      expect(result.cost).toBe(1000);
      expect(result.valuations).toHaveLength(1);
      expect(result.valuations[0].quantity).toBe(100);
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      // Create completely fresh object to avoid any contamination
      const freshValuation = {
        id: 'val-insufficient',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 50,
        unitCost: 10,
        totalCost: 500,
        date: new Date('2026-01-01'),
        referenceType: 'purchase',
        referenceId: 'po-1',
        tenantId: 'tenant-1',
        product: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValuationRepository.find.mockResolvedValue([freshValuation]);
      mockValuationRepository.save.mockResolvedValue(freshValuation);

      await expect(service.calculateFIFO('prod-1', 'wh-1', 100)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.calculateFIFO('prod-1', 'wh-1', 100)).rejects.toThrow(
        /Insufficient stock for FIFO calculation/,
      );
    });

    it('should handle empty valuations', async () => {
      mockValuationRepository.find.mockResolvedValue([]);

      await expect(service.calculateFIFO('prod-1', 'wh-1', 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should order valuations by date ASC then createdAt ASC', async () => {
      mockValuationRepository.find.mockResolvedValue([]);

      await service.calculateFIFO('prod-1', 'wh-1', 10).catch(() => {});

      expect(mockValuationRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { date: 'ASC', createdAt: 'ASC' },
        }),
      );
    });

    it('should update valuation quantities correctly', async () => {
      const valuation1 = { ...mockValuation, id: 'val-1', quantity: 100, unitCost: 10 };
      const valuation2 = { ...mockValuation, id: 'val-2', quantity: 50, unitCost: 12 };

      mockValuationRepository.find.mockResolvedValue([valuation1, valuation2]);
      mockValuationRepository.save.mockImplementation((val) => Promise.resolve(val as any));

      await service.calculateFIFO('prod-1', 'wh-1', 120);

      expect(mockValuationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'val-1', quantity: 0 }),
      );
      expect(mockValuationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'val-2', quantity: 30 }),
      );
    });
  });

  describe('addStockValuation', () => {
    it('should create stock valuation successfully', async () => {
      const createDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 100,
        unitCost: 10.5,
        referenceType: 'purchase',
        referenceId: 'po-1',
        tenantId: 'tenant-1',
      };

      mockValuationRepository.create.mockReturnValue(mockValuation);
      mockValuationRepository.save.mockResolvedValue(mockValuation);

      const result = await service.addStockValuation(
        createDto.productId,
        createDto.warehouseId,
        createDto.quantity,
        createDto.unitCost,
        createDto.referenceType,
        createDto.referenceId,
        createDto.tenantId,
      );

      expect(result).toEqual(mockValuation);
      expect(mockValuationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: createDto.productId,
          warehouseId: createDto.warehouseId,
          quantity: createDto.quantity,
          unitCost: createDto.unitCost,
          totalCost: 1050, // 100 * 10.5
          referenceType: createDto.referenceType,
          referenceId: createDto.referenceId,
          tenantId: createDto.tenantId,
        }),
      );
      expect(mockValuationRepository.save).toHaveBeenCalled();
    });

    it('should calculate totalCost correctly', async () => {
      mockValuationRepository.create.mockReturnValue(mockValuation);
      mockValuationRepository.save.mockResolvedValue(mockValuation);

      await service.addStockValuation('prod-1', 'wh-1', 50, 20, 'purchase', 'po-1', 'tenant-1');

      expect(mockValuationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalCost: 1000, // 50 * 20
        }),
      );
    });

    it('should set date to current date', async () => {
      mockValuationRepository.create.mockReturnValue(mockValuation);
      mockValuationRepository.save.mockResolvedValue(mockValuation);

      await service.addStockValuation('prod-1', 'wh-1', 100, 10, 'purchase', 'po-1', 'tenant-1');

      const createCall = mockValuationRepository.create.mock.calls[0][0];
      expect(createCall.date).toBeInstanceOf(Date);
    });

    it('should handle different reference types', async () => {
      mockValuationRepository.create.mockReturnValue(mockValuation);
      mockValuationRepository.save.mockResolvedValue(mockValuation);

      await service.addStockValuation('prod-1', 'wh-1', 100, 10, 'production', 'prod-order-1', 'tenant-1');

      expect(mockValuationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceType: 'production',
          referenceId: 'prod-order-1',
        }),
      );
    });

    it('should handle zero quantity', async () => {
      mockValuationRepository.create.mockReturnValue({ ...mockValuation, quantity: 0, totalCost: 0 });
      mockValuationRepository.save.mockResolvedValue({ ...mockValuation, quantity: 0, totalCost: 0 });

      await service.addStockValuation('prod-1', 'wh-1', 0, 10, 'adjustment', 'adj-1', 'tenant-1');

      expect(mockValuationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 0,
          totalCost: 0,
        }),
      );
    });
  });

  describe('getAverageCost', () => {
    it('should calculate average cost successfully', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgCost: 11.5 }),
      };

      mockValuationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAverageCost('prod-1', 'wh-1');

      expect(result).toBe(11.5);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'SUM(v.totalCost) / SUM(v.quantity)',
        'avgCost',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('v.productId = :productId', {
        productId: 'prod-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('v.warehouseId = :warehouseId', {
        warehouseId: 'wh-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('v.quantity > 0');
    });

    it('should return 0 when no valuations found', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      mockValuationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAverageCost('prod-1', 'wh-1');

      expect(result).toBe(0);
    });

    it('should return 0 when avgCost is null', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgCost: null }),
      };

      mockValuationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAverageCost('prod-1', 'wh-1');

      expect(result).toBe(0);
    });

    it('should filter by quantity > 0', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgCost: 10 }),
      };

      mockValuationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getAverageCost('prod-1', 'wh-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('v.quantity > 0');
    });
  });

  describe('getValuationReport', () => {
    it('should return valuation report successfully', async () => {
      const valuations = [
        { ...mockValuation, id: 'val-1', quantity: 100, unitCost: 10, totalCost: 1000 },
        { ...mockValuation, id: 'val-2', quantity: 50, unitCost: 12, totalCost: 600 },
        { ...mockValuation, id: 'val-3', quantity: 80, unitCost: 11, totalCost: 880 },
      ];

      mockValuationRepository.find.mockResolvedValue(valuations);

      const result = await service.getValuationReport('prod-1', 'wh-1');

      expect(result.totalQuantity).toBe(230); // 100 + 50 + 80
      expect(result.totalValue).toBe(2480); // 1000 + 600 + 880
      expect(result.averageCost).toBeCloseTo(10.78, 2); // 2480 / 230
      expect(result.valuations).toEqual(valuations);
      expect(mockValuationRepository.find).toHaveBeenCalledWith({
        where: {
          productId: 'prod-1',
          warehouseId: 'wh-1',
          quantity: MoreThan(0),
        },
        order: { date: 'ASC' },
      });
    });

    it('should return zero values when no valuations', async () => {
      mockValuationRepository.find.mockResolvedValue([]);

      const result = await service.getValuationReport('prod-1', 'wh-1');

      expect(result.totalQuantity).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.averageCost).toBe(0);
      expect(result.valuations).toEqual([]);
    });

    it('should handle single valuation', async () => {
      const valuations = [
        { ...mockValuation, id: 'val-1', quantity: 100, unitCost: 10, totalCost: 1000 },
      ];

      mockValuationRepository.find.mockResolvedValue(valuations);

      const result = await service.getValuationReport('prod-1', 'wh-1');

      expect(result.totalQuantity).toBe(100);
      expect(result.totalValue).toBe(1000);
      expect(result.averageCost).toBe(10);
      expect(result.valuations).toHaveLength(1);
    });

    it('should order valuations by date ASC', async () => {
      mockValuationRepository.find.mockResolvedValue([]);

      await service.getValuationReport('prod-1', 'wh-1');

      expect(mockValuationRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { date: 'ASC' },
        }),
      );
    });

    it('should filter by quantity > 0', async () => {
      mockValuationRepository.find.mockResolvedValue([]);

      await service.getValuationReport('prod-1', 'wh-1');

      expect(mockValuationRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quantity: MoreThan(0),
          }),
        }),
      );
    });

    it('should calculate correct average with decimal values', async () => {
      const valuations = [
        { ...mockValuation, id: 'val-1', quantity: 33.33, unitCost: 10.5, totalCost: 349.965 },
        { ...mockValuation, id: 'val-2', quantity: 66.67, unitCost: 12.25, totalCost: 816.7075 },
      ];

      mockValuationRepository.find.mockResolvedValue(valuations);

      const result = await service.getValuationReport('prod-1', 'wh-1');

      expect(result.totalQuantity).toBeCloseTo(100, 2);
      expect(result.totalValue).toBeCloseTo(1166.67, 2);
      expect(result.averageCost).toBeCloseTo(11.67, 2);
    });
  });
});

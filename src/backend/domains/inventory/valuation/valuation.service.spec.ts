import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ValuationService } from './valuation.service';
import { StockValuation } from './entities/stock-valuation.entity';

describe('ValuationService', () => {
  let service: ValuationService;
  let repository: Repository<StockValuation>;

  const mockRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValuationService,
        {
          provide: getRepositoryToken(StockValuation),
          useValue: mockRepository
  },
      ]
  }).compile();

    service = module.get<ValuationService>(ValuationService);
    repository = module.get<Repository<StockValuation>>(
      getRepositoryToken(StockValuation),
    );

    jest.clearAllMocks();
  });

  describe('calculateFIFO', () => {
    it('should calculate FIFO cost correctly with single valuation', async () => {
      const valuations = [
        {
          id: '1',
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: 100,
          unitCost: 10,
          totalCost: 1000,
          date: new Date('2026-01-01')
  },
      ];

      mockRepository.find.mockResolvedValue(valuations);
      mockRepository.save.mockImplementation((val) => Promise.resolve(val));

      const result = await service.calculateFIFO('prod1', 'wh1', 50);

      expect(result.cost).toBe(500); // 50 * 10
      expect(result.valuations).toHaveLength(1);
      expect(result.valuations[0].quantity).toBe(50);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 50 }), // Remaining quantity
      );
    });

    it('should calculate FIFO cost with multiple valuations', async () => {
      const valuations = [
        {
          id: '1',
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: 30,
          unitCost: 10,
          totalCost: 300,
          date: new Date('2026-01-01')
  },
        {
          id: '2',
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: 50,
          unitCost: 12,
          totalCost: 600,
          date: new Date('2026-01-02')
  },
      ];

      mockRepository.find.mockResolvedValue(valuations);
      mockRepository.save.mockImplementation((val) => Promise.resolve(val));

      const result = await service.calculateFIFO('prod1', 'wh1', 60);

      // Should use: 30 @ $10 + 30 @ $12 = $300 + $360 = $660
      expect(result.cost).toBe(660);
      expect(result.valuations).toHaveLength(2);
      expect(result.valuations[0].quantity).toBe(30);
      expect(result.valuations[1].quantity).toBe(30);
    });

    it('should throw error when insufficient stock', async () => {
      const valuations = [
        {
          id: '1',
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: 30,
          unitCost: 10,
          totalCost: 300,
          date: new Date('2026-01-01')
  },
      ];

      mockRepository.find.mockResolvedValue(valuations);

      await expect(
        service.calculateFIFO('prod1', 'wh1', 50),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.calculateFIFO('prod1', 'wh1', 50),
      ).rejects.toThrow('Insufficient stock for FIFO calculation');
    });

    it('should use oldest valuations first (FIFO order)', async () => {
      const valuations = [
        {
          id: '1',
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: 20,
          unitCost: 15,
          totalCost: 300,
          date: new Date('2026-01-03')
  },
        {
          id: '2',
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: 20,
          unitCost: 10,
          totalCost: 200,
          date: new Date('2026-01-01')
  },
      ];

      mockRepository.find.mockResolvedValue(valuations);
      mockRepository.save.mockImplementation((val) => Promise.resolve(val));

      const result = await service.calculateFIFO('prod1', 'wh1', 25);

      // Should use oldest first (date: 2026-01-01)
      // But mock returns in array order, so we verify the find query
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: MoreThan(0)
  },
        order: { date: 'ASC', createdAt: 'ASC' }
  });
    });
  });

  describe('addStockValuation', () => {
    it('should create new stock valuation', async () => {
      const dto = {
        productId: 'prod1',
        warehouseId: 'wh1',
        quantity: 100,
        unitCost: 10,
        referenceType: 'purchase',
        referenceId: 'po-001',
        tenantId: 'tenant1'
  };

      const created = {
        id: '1',
        ...dto,
        totalCost: 1000,
        date: expect.any(Date)
  };

      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await service.addStockValuation(
        dto.productId,
        dto.warehouseId,
        dto.quantity,
        dto.unitCost,
        dto.referenceType,
        dto.referenceId,
        dto.tenantId,
      );

      expect(result.totalCost).toBe(1000);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod1',
          quantity: 100,
          unitCost: 10,
          totalCost: 1000
  }),
      );
    });
  });

  describe('getAverageCost', () => {
    it('should calculate average cost correctly', async () => {
      )
  };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAverageCost('prod1', 'wh1');

      expect(result).toBe(11.5);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'SUM(v.totalCost) / SUM(v.quantity)',
        'avgCost',
      );
    });

    it('should return 0 when no valuations exist', async () => {
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAverageCost('prod1', 'wh1');

      expect(result).toBe(0);
    });
  });

  describe('getValuationReport', () => {
    it('should return valuation report with summary', async () => {
      const valuations = [
        {
          id: '1',
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: 50,
          unitCost: 10,
          totalCost: 500,
          date: new Date('2026-01-01'),
          referenceType: 'purchase'
  },
        {
          id: '2',
          productId: 'prod1',
          warehouseId: 'wh1',
          quantity: 30,
          unitCost: 12,
          totalCost: 360,
          date: new Date('2026-01-02'),
          referenceType: 'purchase'
  },
      ];

      mockRepository.find.mockResolvedValue(valuations);

      const result = await service.getValuationReport('prod1', 'wh1');

      expect(result.totalQuantity).toBe(80);
      expect(result.totalValue).toBe(860);
      expect(result.averageCost).toBe(10.75); // 860 / 80
      expect(result.valuations).toHaveLength(2);
    });
  });
});

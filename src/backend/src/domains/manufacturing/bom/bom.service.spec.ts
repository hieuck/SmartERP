import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BOMService } from './bom.service';
import { BOM, BOMType } from '../entities/bom.entity';
import { BOMLine } from '../entities/bom.entity';
import { NotFoundException } from '@nestjs/common';

describe('BOMService', () => {
  let service: BOMService;
  let bomRepository: Repository<BOM>;
  let bomLineRepository: Repository<BOMLine>;

  const mockBomRepository = {
    remove: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn()
  };

  const mockBomLineRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    save: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BOMService,
        {
          provide: getRepositoryToken(BOM),
          useValue: mockBomRepository
  },
        {
          provide: getRepositoryToken(BOMLine),
          useValue: mockBomLineRepository
  },
      ]
  }).compile();

    service = module.get<BOMService>(BOMService);
    bomRepository = module.get<Repository<BOM>>(getRepositoryToken(BOM));
    bomLineRepository = module.get<Repository<BOMLine>>(getRepositoryToken(BOMLine));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a BOM with lines', async () => {
      const tenantId = 'tenant1';
      const dto = {
        productId: 'product1',
        productQty: 1,
        type: BOMType.MANUFACTURE,
        lines: [
          { productId: 'component1', quantity: 2, unitCost: 10 },
          { productId: 'component2', quantity: 1, unitCost: 20 },
        ]
  };

      const mockBom = {
        id: 'bom1',
        tenantId,
        reference: 'BOM-2026-0001',
        ...dto,
        lines: [],
        totalCost: 0,
        unitCost: 0
  };

      const savedLines = dto.lines.map((line, idx) => ({
        id: `line${idx}`,
        tenantId,
        bomId: 'bom1',
        ...line,
        totalCost: line.quantity * line.unitCost
  }));

      const savedBomWithLines = {
        ...mockBom,
        lines: savedLines,
        totalCost: 40, // 2*10 + 1*20
        unitCost: 40
  };

      mockBomRepository.count.mockResolvedValue(0);
      mockBomRepository.create.mockReturnValue(mockBom);
      mockBomLineRepository.create.mockImplementation((lineDto) => lineDto as any);
      mockBomLineRepository.save.mockResolvedValue(savedLines);
      // findOne is called by calculateCosts at the end
      mockBomRepository.findOne.mockResolvedValue(savedBomWithLines);
      // save is called twice: once for BOM, once in calculateCosts
      mockBomRepository.save.mockResolvedValue(savedBomWithLines);

      const result = await service.create(tenantId, dto);

      expect(result.reference).toBe('BOM-2026-0001');
      expect(result.lines).toHaveLength(2);
      expect(result.totalCost).toBe(40);
      expect(mockBomRepository.create).toHaveBeenCalled();
      expect(mockBomRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a BOM by id', async () => {
      const tenantId = 'tenant1';
      const bomId = 'bom1';
      const mockBom = {
        id: bomId,
        tenantId,
        reference: 'BOM-2026-0001',
        productId: 'product1',
        lines: []
  };

      mockBomRepository.findOne.mockResolvedValue(mockBom);

      const result = await service.findOne(tenantId, bomId);

      expect(result).toEqual(mockBom);
      expect(mockBomRepository.findOne).toHaveBeenCalledWith({
        where: { id: bomId, tenantId },
        relations: ['product', 'lines', 'lines.product']
  });
    });

    it('should throw NotFoundException if BOM not found', async () => {
      const tenantId = 'tenant1';
      const bomId = 'nonexistent';

      mockBomRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tenantId, bomId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByProduct', () => {
    it('should return BOMs for a product', async () => {
      const tenantId = 'tenant1';
      const productId = 'product1';
      const mockBoms = [
        {
          id: 'bom1',
          tenantId,
          productId,
          reference: 'BOM-2026-0001',
          isActive: true
  },
      ];

      mockBomRepository.find.mockResolvedValue(mockBoms);

      const result = await service.findByProduct(tenantId, productId);

      expect(result).toEqual(mockBoms);
      expect(mockBomRepository.find).toHaveBeenCalledWith({
        where: { tenantId, productId, isActive: true },
        relations: ['product', 'lines', 'lines.product']
  });
    });
  });

  describe('calculateCosts', () => {
    it('should calculate total and unit costs', async () => {
      const tenantId = 'tenant1';
      const bomId = 'bom1';
      const mockBom = {
        id: bomId,
        tenantId,
        productQty: 2,
        lines: [
          { quantity: 2, unitCost: 10, totalCost: 20 },
          { quantity: 1, unitCost: 20, totalCost: 20 },
        ],
        totalCost: 0,
        unitCost: 0
  };

      mockBomRepository.findOne.mockResolvedValue(mockBom);
      mockBomRepository.save.mockResolvedValue({
        ...mockBom,
        totalCost: 40,
        unitCost: 20, // 40 / 2
      });

      const result = await service.calculateCosts(tenantId, bomId);

      expect(result.totalCost).toBe(40);
      expect(result.unitCost).toBe(20);
      expect(mockBomRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a BOM', async () => {
      const tenantId = 'tenant1';
      const bomId = 'bom1';
      const dto = {
        productQty: 5,
        isActive: false
  };

      const mockBom = {
        id: bomId,
        tenantId,
        productQty: 1,
        isActive: true
  };

      mockBomRepository.findOne.mockResolvedValue(mockBom);
      mockBomRepository.save.mockResolvedValue({
        ...mockBom,
        ...dto
  });

      const result = await service.update(tenantId, bomId, dto);

      expect(result.productQty).toBe(5);
      expect(result.isActive).toBe(false);
    });
  });

  describe('addLine', () => {
    it('should add a line to BOM', async () => {
      const tenantId = 'tenant1';
      const bomId = 'bom1';
      const dto = {
        productId: 'component1',
        quantity: 3,
        unitCost: 15
  };

      const mockBom = {
        id: bomId,
        tenantId,
        lines: []
  };

      const mockLine = {
        id: 'line1',
        tenantId,
        bomId,
        ...dto,
        totalCost: 45
  };

      mockBomRepository.findOne.mockResolvedValue(mockBom);
      mockBomLineRepository.create.mockReturnValue(mockLine);
      mockBomLineRepository.save.mockResolvedValue(mockLine);

      const result = await service.addLine(tenantId, bomId, dto);

      expect(result.productId).toBe('component1');
      expect(result.totalCost).toBe(45);
      expect(mockBomLineRepository.save).toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BOMService } from './bom.service';
import { BOM } from './entities/bom.entity';
import { BOMLine } from './entities/bom-line.entity';
import { BOMType } from './enums/b-o-m-type.enum';
import { CreateBOMDto } from './dto/create-bom.dto';
import { UpdateBOMDto } from './dto/update-bom.dto';
import { AddBOMLineDto } from './dto/add-bom-line.dto';

describe('BOMService', () => {
  let service: BOMService;
  let bomRepository: jest.Mocked<Repository<BOM>>;
  let bomLineRepository: jest.Mocked<Repository<BOMLine>>;

  const tenantId = 'tenant-123';
  const productId = 'product-123';
  const bomId = 'bom-123';
  const lineId = 'line-123';

  const mockBOMLine: BOMLine = {
    id: lineId,
    tenantId,
    bomId,
    productId: 'component-123',
    quantity: 5,
    unitCost: 10,
    totalCost: 50,
    bom: null,
    product: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    calculateTotalCost: jest.fn(),
    validate: jest.fn(),
  } as unknown as BOMLine;

  const mockBOM: BOM = {
    id: bomId,
    tenantId,
    productId,
    reference: 'BOM-2026-0001',
    productQty: 1,
    type: BOMType.MANUFACTURE,
    isActive: true,
    totalCost: 50,
    unitCost: 50,
    lines: [mockBOMLine],
    product: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    calculateCosts: jest.fn(),
    validate: jest.fn(),
  } as unknown as BOM;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BOMService,
        {
          provide: getRepositoryToken(BOM),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BOMLine),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BOMService>(BOMService);
    bomRepository = module.get(getRepositoryToken(BOM));
    bomLineRepository = module.get(getRepositoryToken(BOMLine));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateBOMDto = {
      productId,
      productQty: 1,
      type: BOMType.MANUFACTURE,
      lines: [
        {
          productId: 'component-123',
          quantity: 5,
          unitCost: 10,
        },
      ],
    };

    it('should create BOM with lines', async () => {
      bomRepository.count.mockResolvedValue(0);
      bomRepository.create.mockReturnValue(mockBOM);
      bomRepository.save.mockResolvedValue(mockBOM);
      bomLineRepository.create.mockReturnValue(mockBOMLine);
      (bomLineRepository.save as jest.Mock).mockResolvedValue([mockBOMLine]);
      bomRepository.findOne.mockResolvedValue(mockBOM);

      const result = await service.create(tenantId, createDto);

      expect(bomRepository.count).toHaveBeenCalledWith({ where: { tenantId } });
      expect(bomRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          productId,
          productQty: 1,
          type: BOMType.MANUFACTURE,
          reference: expect.stringMatching(/^BOM-\d{4}-\d{4}$/),
        }),
      );
      expect(bomLineRepository.create).toHaveBeenCalled();
      expect(bomLineRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockBOM);
    });

    it('should create BOM without lines', async () => {
      const dtoWithoutLines: CreateBOMDto = {
        productId,
        productQty: 1,
        type: BOMType.MANUFACTURE,
      };

      bomRepository.count.mockResolvedValue(0);
      bomRepository.create.mockReturnValue(mockBOM);
      bomRepository.save.mockResolvedValue(mockBOM);
      bomRepository.findOne.mockResolvedValue(mockBOM);

      const result = await service.create(tenantId, dtoWithoutLines);

      expect(bomLineRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockBOM);
    });

    it('should generate reference with correct format', async () => {
      bomRepository.count.mockResolvedValue(5);
      bomRepository.create.mockReturnValue(mockBOM);
      bomRepository.save.mockResolvedValue(mockBOM);
      bomRepository.findOne.mockResolvedValue(mockBOM);

      await service.create(tenantId, createDto);

      const year = new Date().getFullYear();
      expect(bomRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: `BOM-${year}-0006`,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return BOM by id', async () => {
      bomRepository.findOne.mockResolvedValue(mockBOM);

      const result = await service.findOne(tenantId, bomId);

      expect(bomRepository.findOne).toHaveBeenCalledWith({
        where: { id: bomId, tenantId },
        relations: ['product', 'lines', 'lines.product'],
      });
      expect(result).toEqual(mockBOM);
    });

    it('should throw NotFoundException when BOM not found', async () => {
      bomRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProduct', () => {
    it('should return active BOMs for product', async () => {
      bomRepository.find.mockResolvedValue([mockBOM]);

      const result = await service.findByProduct(tenantId, productId);

      expect(bomRepository.find).toHaveBeenCalledWith({
        where: { tenantId, productId, isActive: true },
        relations: ['product', 'lines', 'lines.product'],
      });
      expect(result).toEqual([mockBOM]);
    });

    it('should return empty array when no BOMs found', async () => {
      bomRepository.find.mockResolvedValue([]);

      const result = await service.findByProduct(tenantId, productId);

      expect(result).toEqual([]);
    });
  });

  describe('calculateCosts', () => {
    it('should recalculate BOM costs', async () => {
      bomRepository.findOne.mockResolvedValue(mockBOM);
      bomRepository.save.mockResolvedValue(mockBOM);

      const result = await service.calculateCosts(tenantId, bomId);

      expect(bomRepository.findOne).toHaveBeenCalled();
      expect(bomRepository.save).toHaveBeenCalledWith(mockBOM);
      expect(result).toEqual(mockBOM);
    });

    it('should throw NotFoundException when BOM not found', async () => {
      bomRepository.findOne.mockResolvedValue(null);

      await expect(service.calculateCosts(tenantId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateBOMDto = {
      quantity: 2,
      isActive: false,
    };

    it('should update BOM', async () => {
      const updatedBOM = { ...mockBOM, ...updateDto };
      bomRepository.findOne.mockResolvedValue(mockBOM);
      bomRepository.save.mockResolvedValue(updatedBOM as BOM);

      const result = await service.update(tenantId, bomId, updateDto);

      expect(bomRepository.findOne).toHaveBeenCalled();
      expect(bomRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when BOM not found', async () => {
      bomRepository.findOne.mockResolvedValue(null);

      await expect(service.update(tenantId, 'invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addLine', () => {
    const addLineDto: AddBOMLineDto = {
      productId: 'component-456',
      quantity: 3,
    };

    it('should add line to BOM', async () => {
      bomRepository.findOne.mockResolvedValue(mockBOM);
      bomLineRepository.create.mockReturnValue(mockBOMLine);
      bomLineRepository.save.mockResolvedValue(mockBOMLine);
      bomRepository.save.mockResolvedValue(mockBOM);

      const result = await service.addLine(tenantId, bomId, addLineDto);

      expect(bomRepository.findOne).toHaveBeenCalled();
      expect(bomLineRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          bomId,
          productId: addLineDto.productId,
          quantity: addLineDto.quantity,
          unitCost: 0,
        }),
      );
      expect(bomLineRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockBOMLine);
    });

    it('should throw NotFoundException when BOM not found', async () => {
      bomRepository.findOne.mockResolvedValue(null);

      await expect(service.addLine(tenantId, 'invalid-id', addLineDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeLine', () => {
    it('should remove line from BOM', async () => {
      bomRepository.findOne.mockResolvedValue(mockBOM);
      bomLineRepository.findOne.mockResolvedValue(mockBOMLine);
      bomLineRepository.remove.mockResolvedValue(mockBOMLine);
      bomRepository.save.mockResolvedValue(mockBOM);

      await service.removeLine(tenantId, bomId, lineId);

      expect(bomRepository.findOne).toHaveBeenCalled();
      expect(bomLineRepository.findOne).toHaveBeenCalledWith({
        where: { id: lineId, bomId, tenantId },
      });
      expect(bomLineRepository.remove).toHaveBeenCalledWith(mockBOMLine);
    });

    it('should throw NotFoundException when BOM not found', async () => {
      bomRepository.findOne.mockResolvedValue(null);

      await expect(service.removeLine(tenantId, 'invalid-id', lineId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when line not found', async () => {
      bomRepository.findOne.mockResolvedValue(mockBOM);
      bomLineRepository.findOne.mockResolvedValue(null);

      await expect(service.removeLine(tenantId, bomId, 'invalid-line')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove BOM with lines', async () => {
      const bomWithLines = {
        ...mockBOM,
        lines: [mockBOMLine],
      } as BOM;
      bomRepository.findOne.mockResolvedValue(bomWithLines);
      bomLineRepository.remove.mockResolvedValue(mockBOMLine);
      bomRepository.remove.mockResolvedValue(bomWithLines);

      await service.remove(tenantId, bomId);

      expect(bomRepository.findOne).toHaveBeenCalled();
      expect(bomLineRepository.remove).toHaveBeenCalledWith(bomWithLines.lines);
      expect(bomRepository.remove).toHaveBeenCalledWith(bomWithLines);
    });

    it('should remove BOM without lines', async () => {
      const bomWithoutLines = { ...mockBOM, lines: [] };
      bomRepository.findOne.mockResolvedValue(bomWithoutLines as BOM);
      bomRepository.remove.mockResolvedValue(bomWithoutLines as BOM);

      await service.remove(tenantId, bomId);

      expect(bomLineRepository.remove).not.toHaveBeenCalled();
      expect(bomRepository.remove).toHaveBeenCalledWith(bomWithoutLines);
    });

    it('should throw NotFoundException when BOM not found', async () => {
      bomRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(tenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});

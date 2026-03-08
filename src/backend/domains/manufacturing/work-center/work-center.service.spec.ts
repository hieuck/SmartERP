import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkCenterService } from './work-center.service';
import { WorkCenter } from './entities/work-center.entity';
import { NotFoundException } from '@nestjs/common';

describe('WorkCenterService', () => {
  let service: WorkCenterService;
  let repository: Repository<WorkCenter>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkCenterService,
        {
          provide: getRepositoryToken(WorkCenter),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkCenterService>(WorkCenterService);
    repository = module.get<Repository<WorkCenter>>(getRepositoryToken(WorkCenter));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a work center', async () => {
      const tenantId = 'tenant1';
      const user = { id: 'user1', tenantId };
      const dto = {
        code: 'WC001',
        name: 'Assembly Line 1',
        timeEfficiency: 95,
        capacityPerCycle: 10,
        costPerHour: 50,
      };

      const mockWorkCenter = {
        id: 'wc1',
        tenantId,
        ...dto,
        isActive: true,
      };

      mockRepository.create.mockReturnValue(mockWorkCenter);
      mockRepository.save.mockResolvedValue(mockWorkCenter);

      const result = await service.create(dto, tenantId, user);

      expect(result.code).toBe('WC001');
      expect(result.costPerHour).toBe(50);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a work center by id', async () => {
      const tenantId = 'tenant1';
      const id = 'wc1';
      const mockWorkCenter = {
        id,
        tenantId,
        code: 'WC001',
        name: 'Assembly Line 1',
      };

      mockRepository.findOne.mockResolvedValue(mockWorkCenter);

      const result = await service.findOne(id, tenantId);

      expect(result).toEqual(mockWorkCenter);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'tenant1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findActive', () => {
    it('should return active work centers', async () => {
      const tenantId = 'tenant1';
      const mockWorkCenters = [
        { id: 'wc1', tenantId, code: 'WC001', isActive: true },
        { id: 'wc2', tenantId, code: 'WC002', isActive: true },
      ];

      mockRepository.find.mockResolvedValue(mockWorkCenters);

      const result = await service.findActive(tenantId);

      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId, isActive: true },
      });
    });
  });

  describe('update', () => {
    it('should update a work center', async () => {
      const tenantId = 'tenant1';
      const id = 'wc1';
      const user = { id: 'user1', tenantId };
      const dto = {
        costPerHour: 60,
        isActive: false,
      };

      const mockWorkCenter = {
        id,
        tenantId,
        costPerHour: 50,
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(mockWorkCenter);
      mockRepository.save.mockResolvedValue({
        ...mockWorkCenter,
        ...dto,
      });

      const result = await service.update(id, dto, tenantId, user);

      expect(result.costPerHour).toBe(60);
      expect(result.isActive).toBe(false);
    });
  });
});

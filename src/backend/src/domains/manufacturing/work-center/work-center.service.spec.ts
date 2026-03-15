import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { WorkCenterService } from './work-center.service';
import { WorkCenter } from './entities/work-center.entity';
import { CreateWorkCenterDto } from './dto/create-work-center.dto';
import { UpdateWorkCenterDto } from './dto/update-work-center.dto';
import { SyncStatus } from '../../../common/enums/sync-status.enum';

describe('WorkCenterService', () => {
  let service: WorkCenterService;
  let repository: jest.Mocked<Repository<WorkCenter>>;

  const tenantId = 'tenant-123';
  const workCenterId = 'wc-123';

  const mockWorkCenter: WorkCenter = {
    id: workCenterId,
    tenantId,
    code: 'WC001',
    name: 'Assembly Line 1',
    description: 'Main assembly line',
    timeEfficiency: 95,
    capacityPerCycle: 1,
    costPerHour: 50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    updatedBy: 'user-123',
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  } as WorkCenter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkCenterService,
        {
          provide: getRepositoryToken(WorkCenter),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkCenterService>(WorkCenterService);
    repository = module.get(getRepositoryToken(WorkCenter));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateWorkCenterDto = {
      code: 'WC001',
      name: 'Assembly Line 1',
      description: 'Main assembly line',
      timeEfficiency: 95,
      capacityPerCycle: 1,
      costPerHour: 50,
      isActive: true,
    };

    it('should create work center', async () => {
      repository.create.mockReturnValue(mockWorkCenter);
      repository.save.mockResolvedValue(mockWorkCenter);

      const result = await service.create(tenantId, createDto);

      expect(repository.create).toHaveBeenCalledWith({
        tenantId,
        ...createDto,
      });
      expect(repository.save).toHaveBeenCalledWith(mockWorkCenter);
      expect(result).toEqual(mockWorkCenter);
    });

    it('should create work center with minimal data', async () => {
      const minimalDto: CreateWorkCenterDto = {
        code: 'WC002',
        name: 'Line 2',
      };
      const minimalWorkCenter = { ...mockWorkCenter, ...minimalDto };
      repository.create.mockReturnValue(minimalWorkCenter as WorkCenter);
      repository.save.mockResolvedValue(minimalWorkCenter as WorkCenter);

      const result = await service.create(tenantId, minimalDto);

      expect(repository.create).toHaveBeenCalledWith({
        tenantId,
        ...minimalDto,
      });
      expect(result).toEqual(minimalWorkCenter);
    });
  });

  describe('findOne', () => {
    it('should return work center by id', async () => {
      repository.findOne.mockResolvedValue(mockWorkCenter);

      const result = await service.findOne(tenantId, workCenterId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: workCenterId, tenantId },
      });
      expect(result).toEqual(mockWorkCenter);
    });

    it('should throw NotFoundException when work center not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tenantId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all work centers ordered by name', async () => {
      const workCenters = [mockWorkCenter];
      repository.find.mockResolvedValue(workCenters);

      const result = await service.findAll(tenantId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(workCenters);
    });

    it('should return empty array when no work centers found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll(tenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should return only active work centers', async () => {
      const activeWorkCenters = [mockWorkCenter];
      repository.find.mockResolvedValue(activeWorkCenters);

      const result = await service.findActive(tenantId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId, isActive: true },
      });
      expect(result).toEqual(activeWorkCenters);
    });

    it('should return empty array when no active work centers', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findActive(tenantId);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateDto: UpdateWorkCenterDto = {
      name: 'Updated Line',
      costPerHour: 60,
    };

    it('should update work center', async () => {
      const updatedWorkCenter = { ...mockWorkCenter, ...updateDto };
      repository.findOne.mockResolvedValue(mockWorkCenter);
      repository.save.mockResolvedValue(updatedWorkCenter as WorkCenter);

      const result = await service.update(tenantId, workCenterId, updateDto);

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
      expect(result.name).toBe('Updated Line');
      expect(result.costPerHour).toBe(60);
    });

    it('should throw NotFoundException when work center not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(tenantId, 'invalid-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove work center', async () => {
      repository.findOne.mockResolvedValue(mockWorkCenter);
      repository.remove.mockResolvedValue(mockWorkCenter);

      await service.remove(tenantId, workCenterId);

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.remove).toHaveBeenCalledWith(mockWorkCenter);
    });

    it('should throw NotFoundException when work center not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(tenantId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

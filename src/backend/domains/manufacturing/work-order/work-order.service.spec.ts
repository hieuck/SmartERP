import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrderService } from './work-order.service';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createMockUser } from '@/common/test/test-helpers';

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let repository: Repository<WorkOrder>;
  
  const mockUser = createMockUser();

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrderService,
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkOrderService>(WorkOrderService);
    repository = module.get<Repository<WorkOrder>>(getRepositoryToken(WorkOrder));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a work order', async () => {
      const tenantId = 'tenant1';
      const dto = {
        productId: 'product1',
        bomId: 'bom1',
        qtyToProduce: 100,
        datePlannedStart: new Date('2026-03-10'),
        responsibleId: 'user1',
      };

      const mockWorkOrder = {
        id: 'wo1',
        tenantId,
        reference: 'WO-2026-0001',
        ...dto,
        status: WorkOrderStatus.DRAFT,
        qtyProduced: 0,
      };

      mockRepository.count.mockResolvedValue(0);
      mockRepository.create.mockReturnValue(mockWorkOrder);
      mockRepository.save.mockResolvedValue(mockWorkOrder);

      const result = await service.create(dto, tenantId, mockUser);

      expect(result.reference).toBe('WO-2026-0001');
      expect(result.status).toBe(WorkOrderStatus.DRAFT);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a work order by id', async () => {
      const tenantId = 'tenant1';
      const id = 'wo1';
      const mockWorkOrder = {
        id,
        tenantId,
        reference: 'WO-2026-0001',
        status: WorkOrderStatus.DRAFT,
      };

      mockRepository.findOne.mockResolvedValue(mockWorkOrder);

      const result = await service.findOne(id, tenantId);

      expect(result).toEqual(mockWorkOrder);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId },
        relations: ['product', 'bom', 'responsible'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'tenant1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('confirm', () => {
    it('should confirm a draft work order', async () => {
      const tenantId = 'tenant1';
      const id = 'wo1';
      const mockWorkOrder = {
        id,
        tenantId,
        status: WorkOrderStatus.DRAFT,
      };

      mockRepository.findOne.mockResolvedValue(mockWorkOrder);
      mockRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        status: WorkOrderStatus.CONFIRMED,
      });

      const result = await service.confirm(id, tenantId, mockUser);

      expect(result.status).toBe(WorkOrderStatus.CONFIRMED);
    });

    it('should throw error if not in draft status', async () => {
      const mockWorkOrder = {
        id: 'wo1',
        tenantId: 'tenant1',
        status: WorkOrderStatus.CONFIRMED,
      };

      mockRepository.findOne.mockResolvedValue(mockWorkOrder);

      await expect(service.confirm('wo1', 'tenant1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('start', () => {
    it('should start production on confirmed work order', async () => {
      const tenantId = 'tenant1';
      const id = 'wo1';
      const mockWorkOrder = {
        id,
        tenantId,
        status: WorkOrderStatus.CONFIRMED,
        dateStart: null,
      };

      mockRepository.findOne.mockResolvedValue(mockWorkOrder);
      mockRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        status: WorkOrderStatus.IN_PROGRESS,
        dateStart: expect.any(Date),
      });

      const result = await service.start(id, tenantId, mockUser);

      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(result.dateStart).toBeDefined();
    });
  });

  describe('finish', () => {
    it('should finish production', async () => {
      const tenantId = 'tenant1';
      const id = 'wo1';
      const qtyProduced = 100;
      const mockWorkOrder = {
        id,
        tenantId,
        status: WorkOrderStatus.IN_PROGRESS,
        qtyToProduce: 100,
        qtyProduced: 0,
        dateFinished: null,
      };

      mockRepository.findOne.mockResolvedValue(mockWorkOrder);
      mockRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        status: WorkOrderStatus.DONE,
        qtyProduced: 100,
        dateFinished: expect.any(Date),
      });

      const result = await service.finish(id, qtyProduced, tenantId, mockUser);

      expect(result.status).toBe(WorkOrderStatus.DONE);
      expect(result.qtyProduced).toBe(100);
      expect(result.dateFinished).toBeDefined();
    });
  });

  describe('findByStatus', () => {
    it('should return work orders by status', async () => {
      const tenantId = 'tenant1';
      const status = WorkOrderStatus.IN_PROGRESS;
      const mockWorkOrders = [
        { id: 'wo1', tenantId, status },
        { id: 'wo2', tenantId, status },
      ];

      mockRepository.find.mockResolvedValue(mockWorkOrders);

      const result = await service.findByStatus(status, tenantId);

      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId, status },
        relations: ['product', 'bom', 'responsible'],
      });
    });
  });
});

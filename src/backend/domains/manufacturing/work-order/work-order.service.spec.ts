import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrderService } from './work-order.service';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let repository: Repository<WorkOrder>;

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

      const result = await service.create(tenantId, dto);

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

      const result = await service.findOne(tenantId, id);

      expect(result).toEqual(mockWorkOrder);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId },
        relations: ['product', 'bom', 'responsible'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('tenant1', 'nonexistent')).rejects.toThrow(
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

      const result = await service.confirm(tenantId, id);

      expect(result.status).toBe(WorkOrderStatus.CONFIRMED);
    });

    it('should throw error if not in draft status', async () => {
      const mockWorkOrder = {
        id: 'wo1',
        tenantId: 'tenant1',
        status: WorkOrderStatus.CONFIRMED,
      };

      mockRepository.findOne.mockResolvedValue(mockWorkOrder);

      await expect(service.confirm('tenant1', 'wo1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('startProduction', () => {
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

      const result = await service.startProduction(tenantId, id);

      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(result.dateStart).toBeDefined();
    });
  });

  describe('finishProduction', () => {
    it('should finish production', async () => {
      const tenantId = 'tenant1';
      const id = 'wo1';
      const dto = { qtyProduced: 100 };
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

      const result = await service.finishProduction(tenantId, id, dto);

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

      const result = await service.findByStatus(tenantId, status);

      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId, status },
        relations: ['product', 'bom', 'responsible'],
      });
    });
  });
});

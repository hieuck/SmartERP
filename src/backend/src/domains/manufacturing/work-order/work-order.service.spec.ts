import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderStatus } from './enums/work-order-status.enum';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let repository: jest.Mocked<Repository<WorkOrder>>;

  const tenantId = 'tenant-123';
  const workOrderId = 'wo-123';
  const productId = 'product-123';
  const bomId = 'bom-123';

  const mockWorkOrder: WorkOrder = {
    id: workOrderId,
    tenantId,
    reference: 'WO-2026-0001',
    productId,
    bomId,
    qtyToProduce: 100,
    qtyProduced: 0,
    status: WorkOrderStatus.DRAFT,
    datePlannedStart: new Date('2026-03-15'),
    datePlannedFinished: new Date('2026-03-20'),
    dateStart: null,
    dateFinished: null,
    responsibleId: 'user-123',
    responsible: null,
    notes: 'Test work order',
    product: null,
    bom: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    validate: jest.fn(),
  } as unknown as WorkOrder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrderService,
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkOrderService>(WorkOrderService);
    repository = module.get(getRepositoryToken(WorkOrder));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateWorkOrderDto = {
      productId,
      bomId,
      qtyToProduce: 100,
      datePlannedStart: new Date('2026-03-15'),
      datePlannedFinished: new Date('2026-03-20'),
      responsibleId: 'user-123',
      notes: 'Test work order',
    };

    it('should create work order with generated reference', async () => {
      repository.count.mockResolvedValue(0);
      repository.create.mockReturnValue(mockWorkOrder);
      repository.save.mockResolvedValue(mockWorkOrder);

      const result = await service.create(tenantId, createDto);

      expect(repository.count).toHaveBeenCalledWith({ where: { tenantId } });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          productId,
          bomId,
          qtyToProduce: 100,
          status: WorkOrderStatus.DRAFT,
          reference: expect.stringMatching(/^WO-\d{4}-\d{4}$/),
        }),
      );
      expect(result).toEqual(mockWorkOrder);
    });

    it('should generate reference with correct sequence', async () => {
      repository.count.mockResolvedValue(5);
      repository.create.mockReturnValue(mockWorkOrder);
      repository.save.mockResolvedValue(mockWorkOrder);

      await service.create(tenantId, createDto);

      const year = new Date().getFullYear();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: `WO-${year}-0006`,
        }),
      );
    });

    it('should create work order without optional fields', async () => {
      const minimalDto: CreateWorkOrderDto = {
        productId,
        qtyToProduce: 50,
        datePlannedStart: new Date('2026-03-15'),
      };
      repository.count.mockResolvedValue(0);
      repository.create.mockReturnValue(mockWorkOrder);
      repository.save.mockResolvedValue(mockWorkOrder);

      await service.create(tenantId, minimalDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId,
          qtyToProduce: 50,
          status: WorkOrderStatus.DRAFT,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return work order by id', async () => {
      repository.findOne.mockResolvedValue(mockWorkOrder);

      const result = await service.findOne(tenantId, workOrderId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: workOrderId, tenantId },
        relations: ['product', 'bom', 'responsible'],
      });
      expect(result).toEqual(mockWorkOrder);
    });

    it('should throw NotFoundException when work order not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStatus', () => {
    it('should return work orders by status', async () => {
      const workOrders = [mockWorkOrder];
      repository.find.mockResolvedValue(workOrders);

      const result = await service.findByStatus(tenantId, WorkOrderStatus.DRAFT);

      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId, status: WorkOrderStatus.DRAFT },
        relations: ['product', 'bom', 'responsible'],
      });
      expect(result).toEqual(workOrders);
    });

    it('should return empty array when no work orders found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByStatus(tenantId, WorkOrderStatus.COMPLETED);

      expect(result).toEqual([]);
    });
  });

  describe('confirm', () => {
    it('should confirm draft work order', async () => {
      const draftWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.DRAFT };
      const confirmedWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.READY };
      repository.findOne.mockResolvedValue(draftWorkOrder as WorkOrder);
      repository.save.mockResolvedValue(confirmedWorkOrder as WorkOrder);

      const result = await service.confirm(tenantId, workOrderId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WorkOrderStatus.READY,
        }),
      );
      expect(result.status).toBe(WorkOrderStatus.READY);
    });

    it('should throw BadRequestException when work order is not draft', async () => {
      const readyWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.READY };
      repository.findOne.mockResolvedValue(readyWorkOrder as WorkOrder);

      await expect(service.confirm(tenantId, workOrderId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when work order not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.confirm(tenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('start', () => {
    it('should start ready work order', async () => {
      const readyWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.READY };
      const startedWorkOrder = {
        ...mockWorkOrder,
        status: WorkOrderStatus.IN_PROGRESS,
        dateStart: expect.any(Date),
      };
      repository.findOne.mockResolvedValue(readyWorkOrder as WorkOrder);
      repository.save.mockResolvedValue(startedWorkOrder as WorkOrder);

      const result = await service.start(tenantId, workOrderId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WorkOrderStatus.IN_PROGRESS,
          dateStart: expect.any(Date),
        }),
      );
      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
    });

    it('should throw BadRequestException when work order is not ready', async () => {
      const draftWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.DRAFT };
      repository.findOne.mockResolvedValue(draftWorkOrder as WorkOrder);

      await expect(service.start(tenantId, workOrderId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when work order not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.start(tenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('finish', () => {
    it('should finish in-progress work order', async () => {
      const inProgressWorkOrder = {
        ...mockWorkOrder,
        status: WorkOrderStatus.IN_PROGRESS,
      };
      const finishedWorkOrder = {
        ...mockWorkOrder,
        status: WorkOrderStatus.COMPLETED,
        qtyProduced: 95,
        dateFinished: expect.any(Date),
      };
      repository.findOne.mockResolvedValue(inProgressWorkOrder as WorkOrder);
      repository.save.mockResolvedValue(finishedWorkOrder as WorkOrder);

      const result = await service.finish(tenantId, workOrderId, 95);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WorkOrderStatus.COMPLETED,
          qtyProduced: 95,
          dateFinished: expect.any(Date),
        }),
      );
      expect(result.status).toBe(WorkOrderStatus.COMPLETED);
      expect(result.qtyProduced).toBe(95);
    });

    it('should throw BadRequestException when work order is not in progress', async () => {
      const readyWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.READY };
      repository.findOne.mockResolvedValue(readyWorkOrder as WorkOrder);

      await expect(service.finish(tenantId, workOrderId, 100)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when work order not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.finish(tenantId, 'invalid-id', 100)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel draft work order', async () => {
      const draftWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.DRAFT };
      const cancelledWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.CANCELLED };
      repository.findOne.mockResolvedValue(draftWorkOrder as WorkOrder);
      repository.save.mockResolvedValue(cancelledWorkOrder as WorkOrder);

      const result = await service.cancel(tenantId, workOrderId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WorkOrderStatus.CANCELLED,
        }),
      );
      expect(result.status).toBe(WorkOrderStatus.CANCELLED);
    });

    it('should cancel ready work order', async () => {
      const readyWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.READY };
      const cancelledWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.CANCELLED };
      repository.findOne.mockResolvedValue(readyWorkOrder as WorkOrder);
      repository.save.mockResolvedValue(cancelledWorkOrder as WorkOrder);

      const result = await service.cancel(tenantId, workOrderId);

      expect(result.status).toBe(WorkOrderStatus.CANCELLED);
    });

    it('should throw BadRequestException when work order is completed', async () => {
      const completedWorkOrder = { ...mockWorkOrder, status: WorkOrderStatus.COMPLETED };
      repository.findOne.mockResolvedValue(completedWorkOrder as WorkOrder);

      await expect(service.cancel(tenantId, workOrderId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when work order not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.cancel(tenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByBOM', () => {
    it('should return work orders by BOM id', async () => {
      const workOrders = [mockWorkOrder];
      repository.find.mockResolvedValue(workOrders);

      const result = await service.findByBOM(tenantId, bomId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId, bomId },
        relations: ['product', 'bom', 'responsible'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(workOrders);
    });

    it('should return empty array when no work orders found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByBOM(tenantId, 'invalid-bom');

      expect(result).toEqual([]);
    });
  });
});

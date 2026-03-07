import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductionService } from './production.service';
import { Material, MaterialType } from './entities/material.entity';
import { Mold, MoldStatus } from './entities/mold.entity';
import { Bom } from './entities/bom.entity';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { QualityCheck, QualityCheckResult } from './entities/quality-check.entity';
import { NotFoundException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('ProductionService', () => {
  let service: ProductionService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockMaterialRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockMoldRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockBomRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockWorkOrderRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockQualityCheckRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        {
          provide: getRepositoryToken(Material),
          useValue: mockMaterialRepository,
        },
        {
          provide: getRepositoryToken(Mold),
          useValue: mockMoldRepository,
        },
        {
          provide: getRepositoryToken(Bom),
          useValue: mockBomRepository,
        },
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: mockWorkOrderRepository,
        },
        {
          provide: getRepositoryToken(QualityCheck),
          useValue: mockQualityCheckRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Materials Management', () => {
    it('should find all materials', async () => {
      const mockMaterials = [{ id: '1', name: 'Material 1', type: MaterialType.RAW }];
      mockQueryBuilder.getMany.mockResolvedValue(mockMaterials);

      const result = await service.findAllMaterials(mockUser);

      expect(result).toEqual(mockMaterials);
      expect(mockMaterialRepository.createQueryBuilder).toHaveBeenCalledWith('material');
    });

    it('should find materials by type', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAllMaterials(mockUser, MaterialType.RAW);

      expect(mockMaterialRepository.createQueryBuilder).toHaveBeenCalledWith('material');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('material.type = :type', {
        type: MaterialType.RAW,
      });
    });

    it('should find material by id with caching', async () => {
      const mockMaterial = { id: '1', name: 'Material 1', type: MaterialType.RAW };
      mockCacheService.getOrSet.mockResolvedValue(mockMaterial);

      const result = await service.findMaterialById('1', mockUser);

      expect(result).toEqual(mockMaterial);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if material not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockMaterialRepository.findOne.mockResolvedValue(null);

      await expect(service.findMaterialById('999', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should update material and invalidate cache', async () => {
      const mockMaterial = { id: '1', name: 'Updated Material' };
      mockMaterialRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.getOrSet.mockResolvedValue(mockMaterial);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateMaterial('1', { name: 'Updated Material' }, mockUser);

      expect(result).toEqual(mockMaterial);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete material and invalidate cache', async () => {
      mockMaterialRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteMaterial('1', mockUser);

      expect(mockMaterialRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find low stock materials', async () => {
      const mockLowStock = [{ id: '1', stockQuantity: 5, reorderPoint: 10 }];
      mockQueryBuilder.getMany.mockResolvedValue(mockLowStock);

      const result = await service.findLowStockMaterials(mockUser);

      expect(result).toEqual(mockLowStock);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'material.stockQuantity <= material.reorderPoint',
      );
    });
  });

  describe('Molds Management', () => {
    it('should find mold by id', async () => {
      const mockMold = { id: '1', code: 'M001', status: MoldStatus.ACTIVE };
      mockCacheService.getOrSet.mockResolvedValue(mockMold);

      const result = await service.findMoldById('1', mockUser);

      expect(result).toEqual(mockMold);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if mold not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockMoldRepository.findOne.mockResolvedValue(null);

      await expect(service.findMoldById('999', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should find molds needing maintenance', async () => {
      const mockMolds = [{ id: '1', nextMaintenanceDate: new Date('2024-01-01') }];
      mockQueryBuilder.getMany.mockResolvedValue(mockMolds);

      const result = await service.findMoldsNeedingMaintenance(mockUser);

      expect(result).toEqual(mockMolds);
    });

    it('should record mold usage and update status', async () => {
      const mockMold = {
        id: '1',
        usageCount: 99,
        maxUsageCount: 100,
        status: MoldStatus.ACTIVE,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockMold);
      mockCacheService.del.mockResolvedValue(undefined);
      mockMoldRepository.save.mockResolvedValue({
        ...mockMold,
        usageCount: 100,
        status: MoldStatus.MAINTENANCE,
      });

      const result = await service.recordMoldUsage('1', mockUser);

      expect(result.usageCount).toBe(100);
      expect(result.status).toBe(MoldStatus.MAINTENANCE);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('BOM Management', () => {
    it('should create BOM with calculated costs', async () => {
      const bomData = {
        code: 'BOM001',
        productId: 'p1',
        materialItems: [
          {
            materialId: 'm1',
            materialCode: 'MAT-001',
            materialName: 'Material 1',
            quantity: 10,
            unit: 'kg',
            unitCost: 10,
            totalCost: 100,
          },
          {
            materialId: 'm2',
            materialCode: 'MAT-002',
            materialName: 'Material 2',
            quantity: 5,
            unit: 'kg',
            unitCost: 10,
            totalCost: 50,
          },
        ],
        laborCost: 200,
        overheadCost: 50,
      };

      mockBomRepository.create.mockReturnValue(bomData);
      mockBomRepository.save.mockResolvedValue({
        ...bomData,
        totalMaterialCost: 150,
        totalCost: 400,
      });

      const result = await service.createBom(bomData, mockUser);

      expect(result.totalMaterialCost).toBe(150);
      expect(result.totalCost).toBe(400);
    });

    it('should set default BOM', async () => {
      const mockBom = { id: '1', productId: 'p1', isDefault: false };
      mockCacheService.getOrSet.mockResolvedValue(mockBom);
      mockCacheService.del.mockResolvedValue(undefined);
      mockBomRepository.update.mockResolvedValue({ affected: 1 });
      mockBomRepository.save.mockResolvedValue({
        ...mockBom,
        isDefault: true,
      });

      await service.setDefaultBom('1', 'p1', mockUser);

      expect(mockBomRepository.update).toHaveBeenCalledTimes(2);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('Work Orders Management', () => {
    it('should create work order with generated number', async () => {
      mockWorkOrderRepository.count.mockResolvedValue(5);
      mockWorkOrderRepository.create.mockReturnValue({
        orderNumber: 'WO-000006',
      });
      mockWorkOrderRepository.save.mockResolvedValue({
        orderNumber: 'WO-000006',
      });

      const result = await service.createWorkOrder({}, mockUser);

      expect(result.orderNumber).toBe('WO-000006');
    });

    it('should start work order', async () => {
      const mockWorkOrder = {
        id: '1',
        status: WorkOrderStatus.READY,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockWorkOrder);
      mockCacheService.del.mockResolvedValue(undefined);
      mockWorkOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        status: WorkOrderStatus.IN_PROGRESS,
        actualStartDate: expect.any(Date),
      });

      const result = await service.startWorkOrder('1', mockUser);

      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(result.actualStartDate).toBeDefined();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw error if work order not in correct status to start', async () => {
      const mockWorkOrder = {
        id: '1',
        status: WorkOrderStatus.COMPLETED,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockWorkOrder);

      await expect(service.startWorkOrder('1', mockUser)).rejects.toThrow();
    });

    it('should complete work order', async () => {
      const mockWorkOrder = {
        id: '1',
        status: WorkOrderStatus.IN_PROGRESS,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockWorkOrder);
      mockCacheService.del.mockResolvedValue(undefined);
      mockWorkOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        status: WorkOrderStatus.COMPLETED,
        actualEndDate: expect.any(Date),
        completionPercentage: 100,
      });

      const result = await service.completeWorkOrder('1', mockUser);

      expect(result.status).toBe(WorkOrderStatus.COMPLETED);
      expect(result.completionPercentage).toBe(100);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should pause work order', async () => {
      const mockWorkOrder = {
        id: '1',
        status: WorkOrderStatus.IN_PROGRESS,
        notes: '',
      };
      mockCacheService.getOrSet.mockResolvedValue(mockWorkOrder);
      mockCacheService.del.mockResolvedValue(undefined);
      mockWorkOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        status: WorkOrderStatus.PAUSED,
      });

      const result = await service.pauseWorkOrder('1', mockUser, 'Equipment maintenance');

      expect(result.status).toBe(WorkOrderStatus.PAUSED);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should update work order progress', async () => {
      const mockWorkOrder = {
        id: '1',
        quantityPlanned: 100,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockWorkOrder);
      mockCacheService.del.mockResolvedValue(undefined);
      mockWorkOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        quantityProduced: 50,
        quantityRejected: 5,
        completionPercentage: 50,
      });

      const result = await service.updateWorkOrderProgress('1', 50, 5, mockUser);

      expect(result.completionPercentage).toBe(50);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('Quality Checks Management', () => {
    it('should create quality check with generated number', async () => {
      mockQualityCheckRepository.count.mockResolvedValue(10);
      mockQualityCheckRepository.create.mockReturnValue({
        checkNumber: 'QC-000011',
      });
      mockQualityCheckRepository.save.mockResolvedValue({
        checkNumber: 'QC-000011',
      });

      const result = await service.createQualityCheck({}, mockUser);

      expect(result.checkNumber).toBe('QC-000011');
    });

    it('should calculate quantities for passed result', async () => {
      const checkData = {
        quantityChecked: 100,
        result: QualityCheckResult.PASSED,
      };

      mockQualityCheckRepository.count.mockResolvedValue(0);
      mockQualityCheckRepository.create.mockReturnValue({
        ...checkData,
        quantityPassed: 100,
        quantityFailed: 0,
      });
      mockQualityCheckRepository.save.mockResolvedValue({
        ...checkData,
        quantityPassed: 100,
        quantityFailed: 0,
      });

      const result = await service.createQualityCheck(checkData, mockUser);

      expect(result.quantityPassed).toBe(100);
      expect(result.quantityFailed).toBe(0);
    });

    it('should approve quality check', async () => {
      const mockCheck = { id: '1' };
      mockQualityCheckRepository.findOne.mockResolvedValue(mockCheck);
      mockQualityCheckRepository.save.mockResolvedValue({
        ...mockCheck,
        approvedBy: 'user-1',
        approvedAt: expect.any(Date),
      });

      const result = await service.approveQualityCheck('1', 'user-1', mockUser);

      expect(result.approvedBy).toBe('user-1');
      expect(result.approvedAt).toBeDefined();
    });

    it('should get quality statistics', async () => {
      const mockChecks = [
        {
          result: QualityCheckResult.PASSED,
          quantityChecked: 100,
          quantityPassed: 100,
          quantityFailed: 0,
        },
        {
          result: QualityCheckResult.FAILED,
          quantityChecked: 50,
          quantityPassed: 0,
          quantityFailed: 50,
        },
        {
          result: QualityCheckResult.PASSED,
          quantityChecked: 75,
          quantityPassed: 75,
          quantityFailed: 0,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockChecks);

      const result = await service.getQualityStatistics(mockUser);

      expect(result.totalChecks).toBe(3);
      expect(result.passedChecks).toBe(2);
      expect(result.failedChecks).toBe(1);
      expect(result.passRate).toBeCloseTo(66.67, 1);
      expect(result.totalQuantityChecked).toBe(225);
      expect(result.totalQuantityPassed).toBe(175);
    });
  });

  describe('Additional Materials Tests', () => {
    it('should create material', async () => {
      const materialData = { name: 'New Material', type: MaterialType.RAW };
      mockMaterialRepository.create.mockReturnValue(materialData);
      mockMaterialRepository.save.mockResolvedValue({ id: '1', ...materialData });

      const result = await service.createMaterial(materialData, mockUser);

      expect(result.id).toBe('1');
      expect(mockMaterialRepository.create).toHaveBeenCalledWith({
        ...materialData,
        tenantId: 'tenant-1',
      });
    });
  });

  describe('Additional Molds Tests', () => {
    it('should find all molds', async () => {
      const mockMolds = [{ id: '1', code: 'M001' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockMolds);

      const result = await service.findAllMolds(mockUser);

      expect(result).toEqual(mockMolds);
      expect(mockMoldRepository.createQueryBuilder).toHaveBeenCalledWith('mold');
    });

    it('should find molds by status', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAllMolds(mockUser, MoldStatus.ACTIVE);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('mold.status = :status', {
        status: MoldStatus.ACTIVE,
      });
    });

    it('should create mold', async () => {
      const moldData = { code: 'M001', name: 'Mold 1' };
      mockMoldRepository.create.mockReturnValue(moldData);
      mockMoldRepository.save.mockResolvedValue({ id: '1', ...moldData });

      const result = await service.createMold(moldData, mockUser);

      expect(result.id).toBe('1');
      expect(mockMoldRepository.create).toHaveBeenCalledWith({
        ...moldData,
        tenantId: 'tenant-1',
      });
    });

    it('should update mold and invalidate cache', async () => {
      const mockMold = { id: '1', name: 'Updated Mold' };
      mockMoldRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.getOrSet.mockResolvedValue(mockMold);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateMold('1', { name: 'Updated Mold' }, mockUser);

      expect(result).toEqual(mockMold);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete mold and invalidate cache', async () => {
      mockMoldRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteMold('1', mockUser);

      expect(mockMoldRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('Additional BOM Tests', () => {
    it('should find all BOMs', async () => {
      const mockBoms = [{ id: '1', code: 'BOM001' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockBoms);

      const result = await service.findAllBoms(mockUser);

      expect(result).toEqual(mockBoms);
      expect(mockBomRepository.createQueryBuilder).toHaveBeenCalledWith('bom');
    });

    it('should find BOMs by product', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAllBoms(mockUser, 'product-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('bom.productId = :productId', {
        productId: 'product-1',
      });
    });

    it('should find BOM by id', async () => {
      const mockBom = { id: '1', code: 'BOM001' };
      mockCacheService.getOrSet.mockResolvedValue(mockBom);

      const result = await service.findBomById('1', mockUser);

      expect(result).toEqual(mockBom);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if BOM not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockBomRepository.findOne.mockResolvedValue(null);

      await expect(service.findBomById('999', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should delete BOM and invalidate cache', async () => {
      mockBomRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteBom('1', mockUser);

      expect(mockBomRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('Additional Work Order Tests', () => {
    it('should find all work orders', async () => {
      const mockOrders = [{ id: '1', orderNumber: 'WO-000001' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockOrders);

      const result = await service.findAllWorkOrders(mockUser);

      expect(result).toEqual(mockOrders);
      expect(mockWorkOrderRepository.createQueryBuilder).toHaveBeenCalledWith('workOrder');
    });

    it('should find work orders by status', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAllWorkOrders(mockUser, WorkOrderStatus.IN_PROGRESS);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('workOrder.status = :status', {
        status: WorkOrderStatus.IN_PROGRESS,
      });
    });

    it('should find work order by id', async () => {
      const mockOrder = { id: '1', orderNumber: 'WO-000001' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);

      const result = await service.findWorkOrderById('1', mockUser);

      expect(result).toEqual(mockOrder);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if work order not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockWorkOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findWorkOrderById('999', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update work order and invalidate cache', async () => {
      const mockOrder = { id: '1', notes: 'Updated notes' };
      mockWorkOrderRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateWorkOrder('1', { notes: 'Updated notes' }, mockUser);

      expect(result).toEqual(mockOrder);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete work order and invalidate cache', async () => {
      mockWorkOrderRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteWorkOrder('1', mockUser);

      expect(mockWorkOrderRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should resume work order', async () => {
      const mockWorkOrder = {
        id: '1',
        status: WorkOrderStatus.PAUSED,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockWorkOrder);
      mockCacheService.del.mockResolvedValue(undefined);
      mockWorkOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        status: WorkOrderStatus.IN_PROGRESS,
      });

      const result = await service.resumeWorkOrder('1', mockUser);

      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw error if work order not in correct status to resume', async () => {
      const mockWorkOrder = {
        id: '1',
        status: WorkOrderStatus.COMPLETED,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockWorkOrder);

      await expect(service.resumeWorkOrder('1', mockUser)).rejects.toThrow();
    });
  });

  describe('Additional Quality Check Tests', () => {
    it('should find all quality checks', async () => {
      const mockChecks = [{ id: '1', checkNumber: 'QC-000001' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockChecks);

      const result = await service.findAllQualityChecks(mockUser);

      expect(result).toEqual(mockChecks);
      expect(mockQualityCheckRepository.createQueryBuilder).toHaveBeenCalledWith('qualityCheck');
    });

    it('should find quality checks by work order', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAllQualityChecks(mockUser, 'wo-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'qualityCheck.workOrderId = :workOrderId',
        {
          workOrderId: 'wo-1',
        },
      );
    });

    it('should find quality check by id', async () => {
      const mockCheck = { id: '1', checkNumber: 'QC-000001' };
      mockCacheService.getOrSet.mockResolvedValue(mockCheck);

      const result = await service.findQualityCheckById('1', mockUser);

      expect(result).toEqual(mockCheck);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if quality check not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockQualityCheckRepository.findOne.mockResolvedValue(null);

      await expect(service.findQualityCheckById('999', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update quality check and invalidate cache', async () => {
      const mockCheck = { id: '1', notes: 'Updated notes' };
      mockQualityCheckRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.getOrSet.mockResolvedValue(mockCheck);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateQualityCheck('1', { notes: 'Updated notes' }, mockUser);

      expect(result).toEqual(mockCheck);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete quality check and invalidate cache', async () => {
      mockQualityCheckRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteQualityCheck('1', mockUser);

      expect(mockQualityCheckRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should get quality statistics with date range', async () => {
      const mockChecks = [
        {
          result: QualityCheckResult.PASSED,
          quantityChecked: 100,
          quantityPassed: 100,
          quantityFailed: 0,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockChecks);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getQualityStatistics(mockUser, startDate, endDate);

      expect(result.totalChecks).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('qc.checkDate >= :startDate', {
        startDate,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('qc.checkDate <= :endDate', {
        endDate,
      });
    });
  });
});

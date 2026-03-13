import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BOM } from './entities/bom.entity';
import { Material } from './entities/material.entity';
import { Mold } from './entities/mold.entity';
import { QualityCheck } from './entities/quality-check.entity';
import { WorkOrder } from './entities/work-order.entity';
import { MaterialType } from './enums/material-type.enum';
import { MoldStatus } from './enums/mold-status.enum';
import { QualityCheckResult } from './enums/quality-check-result.enum';
import { WorkOrderStatus } from './enums/work-order-status.enum';
import { ProductionService } from './production.service';

describe('ProductionService', () => {
  let service: ProductionService;

  // Mock SecureRepository methods - NOT queryBuilder
  const mockMaterialRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockMoldRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockBomRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockWorkOrderRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockQualityCheckRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
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
          provide: getRepositoryToken(BOM),
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
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, baseWhere) => ({
              ...baseWhere,
              tenantId: user.tenantId,
            })),
          },
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
      mockMaterialRepository.find.mockResolvedValue(mockMaterials);

      const result = await service.findAllMaterials(mockUser);

      expect(result).toEqual(mockMaterials);
      expect(mockMaterialRepository.find).toHaveBeenCalled();
    });

    it('should find materials by type', async () => {
      const mockMaterials = [{ id: '1', name: 'Material 1', type: MaterialType.RAW }];
      mockMaterialRepository.find.mockResolvedValue(mockMaterials);

      const result = await service.findAllMaterials(mockUser, MaterialType.RAW);

      expect(result).toEqual(mockMaterials);
      expect(mockMaterialRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: MaterialType.RAW }),
        }),
      );
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
      const mockMaterial = { id: '1', name: 'Material 1', type: MaterialType.RAW };
      const updatedMaterial = { ...mockMaterial, name: 'Updated Material' };
      
      mockCacheService.getOrSet.mockResolvedValue(mockMaterial);
      mockMaterialRepository.save.mockResolvedValue(updatedMaterial);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateMaterial('1', { name: 'Updated Material' }, mockUser);

      expect(result.name).toBe('Updated Material');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete material and invalidate cache', async () => {
      const mockMaterial = { id: '1', name: 'Material 1', type: MaterialType.RAW };
      mockCacheService.getOrSet.mockResolvedValue(mockMaterial);
      mockMaterialRepository.findOne.mockResolvedValue(mockMaterial);
      mockMaterialRepository.remove.mockResolvedValue(undefined);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteMaterial('1', mockUser);

      expect(mockMaterialRepository.remove).toHaveBeenCalledWith(mockMaterial);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find low stock materials', async () => {
      const mockLowStock = [
        { id: '1', stockQuantity: 5, reorderPoint: 10 },
        { id: '2', stockQuantity: 10, reorderPoint: 10 },
        { id: '3', stockQuantity: 15, reorderPoint: 10 },
      ];
      mockMaterialRepository.find.mockResolvedValue(mockLowStock);

      const result = await service.findLowStockMaterials(mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should create material', async () => {
      const materialData = { name: 'New Material', type: MaterialType.RAW };
      mockMaterialRepository.save.mockResolvedValue({ id: '1', ...materialData });

      const result = await service.createMaterial(materialData, mockUser);

      expect(result.id).toBe('1');
      expect(mockMaterialRepository.save).toHaveBeenCalled();
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
      const today = new Date();
      const pastDate = new Date(today.getTime() - 86400000);
      const futureDate = new Date(today.getTime() + 86400000);
      
      const mockMolds = [
        { id: '1', nextMaintenanceDate: pastDate },
        { id: '2', nextMaintenanceDate: futureDate },
      ];
      mockMoldRepository.find.mockResolvedValue(mockMolds);

      const result = await service.findMoldsNeedingMaintenance(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
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

    it('should find all molds', async () => {
      const mockMolds = [{ id: '1', code: 'M001' }];
      mockMoldRepository.find.mockResolvedValue(mockMolds);

      const result = await service.findAllMolds(mockUser);

      expect(result).toEqual(mockMolds);
      expect(mockMoldRepository.find).toHaveBeenCalled();
    });

    it('should find molds by status', async () => {
      const mockMolds = [{ id: '1', code: 'M001', status: MoldStatus.ACTIVE }];
      mockMoldRepository.find.mockResolvedValue(mockMolds);

      const result = await service.findAllMolds(mockUser, MoldStatus.ACTIVE);

      expect(result).toEqual(mockMolds);
      expect(mockMoldRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: MoldStatus.ACTIVE }),
        }),
      );
    });

    it('should create mold', async () => {
      const moldData = { code: 'M001', name: 'Mold 1' };
      mockMoldRepository.save.mockResolvedValue({ id: '1', ...moldData });

      const result = await service.createMold(moldData, mockUser);

      expect(result.id).toBe('1');
      expect(mockMoldRepository.save).toHaveBeenCalled();
    });

    it('should update mold and invalidate cache', async () => {
      const mockMold = { id: '1', name: 'Mold 1' };
      const updatedMold = { ...mockMold, name: 'Updated Mold' };
      
      mockCacheService.getOrSet.mockResolvedValue(mockMold);
      mockMoldRepository.save.mockResolvedValue(updatedMold);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateMold('1', { name: 'Updated Mold' }, mockUser);

      expect(result.name).toBe('Updated Mold');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete mold and invalidate cache', async () => {
      const mockMold = { id: '1', name: 'Mold 1' };
      mockCacheService.getOrSet.mockResolvedValue(mockMold);
      mockMoldRepository.findOne.mockResolvedValue(mockMold);
      mockMoldRepository.remove.mockResolvedValue(undefined);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteMold('1', mockUser);

      expect(mockMoldRepository.remove).toHaveBeenCalledWith(mockMold);
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
      mockBomRepository.save.mockResolvedValue({
        ...mockBom,
        isDefault: true,
      });

      await service.setDefaultBom('1', 'p1', mockUser);

      expect(mockBomRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find all BOMs', async () => {
      const mockBoms = [{ id: '1', code: 'BOM001' }];
      mockBomRepository.find.mockResolvedValue(mockBoms);

      const result = await service.findAllBoms(mockUser);

      expect(result).toEqual(mockBoms);
      expect(mockBomRepository.find).toHaveBeenCalled();
    });

    it('should find BOMs by product', async () => {
      const mockBoms = [{ id: '1', code: 'BOM001', productId: 'product-1' }];
      mockBomRepository.find.mockResolvedValue(mockBoms);

      const result = await service.findAllBoms(mockUser, 'product-1');

      expect(result).toEqual(mockBoms);
      expect(mockBomRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 'product-1' }),
        }),
      );
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
      const mockBom = { id: '1', code: 'BOM001' };
      mockCacheService.getOrSet.mockResolvedValue(mockBom);
      mockBomRepository.findOne.mockResolvedValue(mockBom);
      mockBomRepository.remove.mockResolvedValue(undefined);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteBom('1', mockUser);

      expect(mockBomRepository.remove).toHaveBeenCalledWith(mockBom);
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('Work Orders Management', () => {
    it('should create work order with generated number', async () => {
      mockWorkOrderRepository.count.mockResolvedValue(5);
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
        qtyProduced: 50,
        quantityRejected: 5,
        completionPercentage: 50,
      });

      const result = await service.updateWorkOrderProgress('1', 50, 5, mockUser);

      expect(result.completionPercentage).toBe(50);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find all work orders', async () => {
      const mockOrders = [{ id: '1', orderNumber: 'WO-000001' }];
      mockWorkOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findAllWorkOrders(mockUser);

      expect(result).toEqual(mockOrders);
      expect(mockWorkOrderRepository.find).toHaveBeenCalled();
    });

    it('should find work orders by status', async () => {
      const mockOrders = [{ id: '1', orderNumber: 'WO-000001', status: WorkOrderStatus.IN_PROGRESS }];
      mockWorkOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findAllWorkOrders(mockUser, WorkOrderStatus.IN_PROGRESS);

      expect(result).toEqual(mockOrders);
      expect(mockWorkOrderRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: WorkOrderStatus.IN_PROGRESS }),
        }),
      );
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

      await expect(service.findWorkOrderById('999', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should update work order and invalidate cache', async () => {
      const mockOrder = { id: '1', notes: 'Original notes' };
      const updatedOrder = { ...mockOrder, notes: 'Updated notes' };
      
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockWorkOrderRepository.save.mockResolvedValue(updatedOrder);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateWorkOrder('1', { notes: 'Updated notes' }, mockUser);

      expect(result.notes).toBe('Updated notes');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete work order and invalidate cache', async () => {
      const mockOrder = { id: '1', orderNumber: 'WO-000001' };
      mockCacheService.getOrSet.mockResolvedValue(mockOrder);
      mockWorkOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockWorkOrderRepository.remove.mockResolvedValue(undefined);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteWorkOrder('1', mockUser);

      expect(mockWorkOrderRepository.remove).toHaveBeenCalledWith(mockOrder);
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

  describe('Quality Checks Management', () => {
    it('should create quality check with generated number', async () => {
      mockQualityCheckRepository.count.mockResolvedValue(10);
      mockQualityCheckRepository.save.mockResolvedValue({
        checkNumber: 'QC-000011',
      });

      const result = await service.createQualityCheck({}, mockUser);

      expect(result.checkNumber).toBe('QC-000011');
    });

    it('should calculate quantities for passed result', async () => {
      const checkData = {
        quantityChecked: 100,
        result: QualityCheckResult.PASS,
      };

      mockQualityCheckRepository.count.mockResolvedValue(0);
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
      const mockCheck = { id: '1', checkNumber: 'QC-000001' };
      mockCacheService.getOrSet.mockResolvedValue(mockCheck);
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
          result: QualityCheckResult.PASS,
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
          result: QualityCheckResult.PASS,
          quantityChecked: 75,
          quantityPassed: 75,
          quantityFailed: 0,
        },
      ];

      mockQualityCheckRepository.find.mockResolvedValue(mockChecks);

      const result = await service.getQualityStatistics(mockUser);

      expect(result.totalChecks).toBe(3);
      expect(result.passedChecks).toBe(2);
      expect(result.failedChecks).toBe(1);
      expect(result.passRate).toBeCloseTo(66.67, 1);
      expect(result.totalQuantityChecked).toBe(225);
      expect(result.totalQuantityPassed).toBe(175);
    });

    it('should find all quality checks', async () => {
      const mockChecks = [{ id: '1', checkNumber: 'QC-000001' }];
      mockQualityCheckRepository.find.mockResolvedValue(mockChecks);

      const result = await service.findAllQualityChecks(mockUser);

      expect(result).toEqual(mockChecks);
      expect(mockQualityCheckRepository.find).toHaveBeenCalled();
    });

    it('should find quality checks by work order', async () => {
      const mockChecks = [{ id: '1', checkNumber: 'QC-000001', workOrderId: 'wo-1' }];
      mockQualityCheckRepository.find.mockResolvedValue(mockChecks);

      const result = await service.findAllQualityChecks(mockUser, 'wo-1');

      expect(result).toEqual(mockChecks);
      expect(mockQualityCheckRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workOrderId: 'wo-1' }),
        }),
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
      const mockCheck = { id: '1', notes: 'Original notes' };
      const updatedCheck = { ...mockCheck, notes: 'Updated notes' };
      
      mockCacheService.getOrSet.mockResolvedValue(mockCheck);
      mockQualityCheckRepository.save.mockResolvedValue(updatedCheck);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.updateQualityCheck('1', { notes: 'Updated notes' }, mockUser);

      expect(result.notes).toBe('Updated notes');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should delete quality check and invalidate cache', async () => {
      const mockCheck = { id: '1', checkNumber: 'QC-000001' };
      mockCacheService.getOrSet.mockResolvedValue(mockCheck);
      mockQualityCheckRepository.findOne.mockResolvedValue(mockCheck);
      mockQualityCheckRepository.remove.mockResolvedValue(undefined);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.deleteQualityCheck('1', mockUser);

      expect(mockQualityCheckRepository.remove).toHaveBeenCalledWith(mockCheck);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should get quality statistics with date range', async () => {
      const mockChecks = [
        {
          result: QualityCheckResult.PASS,
          quantityChecked: 100,
          quantityPassed: 100,
          quantityFailed: 0,
          checkDate: new Date('2024-06-15'),
        },
        {
          result: QualityCheckResult.FAILED,
          quantityChecked: 50,
          quantityPassed: 0,
          quantityFailed: 50,
          checkDate: new Date('2023-12-31'),
        },
        {
          result: QualityCheckResult.PASS,
          quantityChecked: 75,
          quantityPassed: 75,
          quantityFailed: 0,
          checkDate: new Date('2025-01-01'),
        },
      ];

      mockQualityCheckRepository.find.mockResolvedValue(mockChecks);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getQualityStatistics(mockUser, startDate, endDate);

      expect(result.totalChecks).toBe(1);
      expect(result.passedChecks).toBe(1);
      expect(result.failedChecks).toBe(0);
      expect(result.totalQuantityChecked).toBe(100);
      expect(result.totalQuantityPassed).toBe(100);
    });
  });
});

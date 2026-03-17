import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductionService } from './production.service';
import { Material } from './entities/material.entity';
import { Mold } from './entities/mold.entity';
import { BOM } from './entities/bom.entity';
import { WorkOrder } from './entities/work-order.entity';
import { QualityCheck } from './entities/quality-check.entity';
import { MaterialType } from './enums/material-type.enum';
import { MoldStatus } from './enums/mold-status.enum';
import { BomStatus } from './enums/bom-status.enum';
import { WorkOrderStatus } from './enums/work-order-status.enum';
import { QualityCheckResult } from './enums/quality-check-result.enum';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';

describe('ProductionService', () => {
  let permissionService: jest.Mocked<PermissionService>;
  let service: ProductionService;
  let materialRepository: jest.Mocked<Repository<Material>>;
  let moldRepository: jest.Mocked<Repository<Mold>>;
  let bomRepository: jest.Mocked<Repository<BOM>>;
  let workOrderRepository: jest.Mocked<Repository<WorkOrder>>;
  let qualityCheckRepository: jest.Mocked<Repository<QualityCheck>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['admin'],
  } as User;

  const mockMaterial: Material = {
    id: 'material-1',
    code: 'MAT-001',
    name: 'Steel Sheet',
    type: MaterialType.RAW,
    unit: 'kg',
    stockQuantity: 1000,
    reorderPoint: 100,
    purchasePrice: 50,
    status: 'active',
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Material;

  beforeEach(async () => {
    const mockMaterialRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockMoldRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockBomRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockWorkOrderRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockQualityCheckRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getOrSet: jest.fn(),
    };

    const mockPermission = {
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, baseWhere) => ({
        ...baseWhere,
        tenantId: user.tenantId,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: getRepositoryToken(Material), useValue: mockMaterialRepo },
        { provide: getRepositoryToken(Mold), useValue: mockMoldRepo },
        { provide: getRepositoryToken(BOM), useValue: mockBomRepo },
        { provide: getRepositoryToken(WorkOrder), useValue: mockWorkOrderRepo },
        { provide: getRepositoryToken(QualityCheck), useValue: mockQualityCheckRepo },
        { provide: CacheService, useValue: mockCache },
        { provide: PermissionService, useValue: mockPermission },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
    materialRepository = module.get(getRepositoryToken(Material));
    moldRepository = module.get(getRepositoryToken(Mold));
    bomRepository = module.get(getRepositoryToken(BOM));
    workOrderRepository = module.get(getRepositoryToken(WorkOrder));
    qualityCheckRepository = module.get(getRepositoryToken(QualityCheck));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== MATERIALS TESTS ====================
  describe('Materials Management', () => {
    it('should find all materials', async () => {
      materialRepository.find.mockResolvedValue([mockMaterial]);

      const result = await service.findAllMaterials(mockUser);

      expect(result).toEqual([mockMaterial]);
    });

    it('should find material by id', async () => {
      cacheService.getOrSet.mockResolvedValue(mockMaterial);

      const result = await service.findMaterialById('material-1', mockUser);

      expect(result).toEqual(mockMaterial);
    });

    it('should throw NotFoundException when material not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      materialRepository.findOne.mockResolvedValue(null);

      await expect(service.findMaterialById('invalid-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create material', async () => {
      materialRepository.save.mockResolvedValue(mockMaterial);

      const result = await service.createMaterial({ name: 'New Material' }, mockUser);

      expect(materialRepository.save).toHaveBeenCalled();
    });

    it('should update material', async () => {
      cacheService.getOrSet.mockResolvedValue(mockMaterial);
      materialRepository.save.mockResolvedValue(mockMaterial);

      const result = await service.updateMaterial('material-1', { name: 'Updated' }, mockUser);

      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should delete material', async () => {
      // Mock findMaterialById to return material (called internally by deleteMaterial)
      cacheService.getOrSet.mockImplementation(async (key, fn) => {
        if (key.includes('material-1')) {
          return mockMaterial;
        }
        return fn();
      });
      materialRepository.findOne.mockResolvedValue(mockMaterial);
      materialRepository.remove.mockResolvedValue(mockMaterial);

      await service.deleteMaterial('material-1', mockUser);

      expect(materialRepository.remove).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should find low stock materials', async () => {
      const lowStockMaterial = { ...mockMaterial, stockQuantity: 50 };
      materialRepository.find.mockResolvedValue([lowStockMaterial]);

      const result = await service.findLowStockMaterials(mockUser);

      expect(result).toHaveLength(1);
    });
  });

  // ==================== MOLDS TESTS ====================
  describe('Molds Management', () => {
    const mockMold = {
      id: 'mold-1',
      code: 'MOLD-001',
      name: 'Test Mold',
      status: MoldStatus.ACTIVE,
      usageCount: 0,
      maxUsageCount: 1000,
      tenantId: 'tenant-1',
    } as Mold;

    it('should find all molds', async () => {
      moldRepository.find.mockResolvedValue([mockMold]);

      const result = await service.findAllMolds(mockUser);

      expect(result).toEqual([mockMold]);
    });

    it('should find mold by id', async () => {
      cacheService.getOrSet.mockResolvedValue(mockMold);

      const result = await service.findMoldById('mold-1', mockUser);

      expect(result).toEqual(mockMold);
    });

    it('should create mold', async () => {
      moldRepository.save.mockResolvedValue(mockMold);

      const result = await service.createMold({ name: 'New Mold' }, mockUser);

      expect(moldRepository.save).toHaveBeenCalled();
    });

    it('should record mold usage', async () => {
      cacheService.getOrSet.mockResolvedValue(mockMold);
      moldRepository.save.mockResolvedValue({ ...mockMold, usageCount: 1 } as any);

      const result = await service.recordMoldUsage('mold-1', mockUser);

      expect(result.usageCount).toBe(1);
    });

    it('should find molds needing maintenance', async () => {
      const moldNeedingMaintenance = {
        ...mockMold,
        nextMaintenanceDate: new Date('2020-01-01'),
      };
      moldRepository.find.mockResolvedValue([moldNeedingMaintenance]);

      const result = await service.findMoldsNeedingMaintenance(mockUser);

      expect(result).toHaveLength(1);
    });
  });

  // ==================== BOM TESTS ====================
  describe('BOM Management', () => {
    const mockBom = {
      id: 'bom-1',
      code: 'BOM-001',
      productId: 'product-1',
      status: BomStatus.ACTIVE,
      materialItems: [],
      totalMaterialCost: 0,
      laborCost: 0,
      overheadCost: 0,
      totalCost: 0,
      isDefault: false,
      tenantId: 'tenant-1',
    } as BOM;

    it('should find all BOMs', async () => {
      bomRepository.find.mockResolvedValue([mockBom]);

      const result = await service.findAllBoms(mockUser);

      expect(result).toEqual([mockBom]);
    });

    it('should find BOM by id', async () => {
      cacheService.getOrSet.mockResolvedValue(mockBom);

      const result = await service.findBomById('bom-1', mockUser);

      expect(result).toEqual(mockBom);
    });

    it('should create BOM with calculated costs', async () => {
      const bomData = {
        productId: 'product-1',
        materialItems: [
          {
            materialId: 'mat-1',
            materialCode: 'MAT-001',
            materialName: 'Material 1',
            quantity: 10,
            unit: 'kg',
            unitCost: 10,
            totalCost: 100,
          },
          {
            materialId: 'mat-2',
            materialCode: 'MAT-002',
            materialName: 'Material 2',
            quantity: 20,
            unit: 'kg',
            unitCost: 10,
            totalCost: 200,
          },
        ],
        laborCost: 50,
        overheadCost: 30,
      };
      bomRepository.save.mockResolvedValue(mockBom);

      const result = await service.createBom(bomData, mockUser);

      expect(bomRepository.save).toHaveBeenCalled();
    });

    it('should set default BOM', async () => {
      cacheService.getOrSet.mockResolvedValue(mockBom);
      bomRepository.find.mockResolvedValue([mockBom]);
      bomRepository.save.mockResolvedValue({ ...mockBom, isDefault: true } as any);

      const result = await service.setDefaultBom('bom-1', 'product-1', mockUser);

      expect(result.isDefault).toBe(true);
    });
  });

  // ==================== WORK ORDERS TESTS ====================
  describe('Work Orders Management', () => {
    const mockWorkOrder = {
      id: 'wo-1',
      orderNumber: 'WO-000001',
      status: WorkOrderStatus.PLANNED,
      quantityPlanned: 100,
      qtyProduced: 0,
      quantityRejected: 0,
      completionPercentage: 0,
      tenantId: 'tenant-1',
    } as WorkOrder;

    it('should find all work orders', async () => {
      workOrderRepository.find.mockResolvedValue([mockWorkOrder]);

      const result = await service.findAllWorkOrders(mockUser);

      expect(result).toEqual([mockWorkOrder]);
    });

    it('should find work order by id', async () => {
      cacheService.getOrSet.mockResolvedValue(mockWorkOrder);

      const result = await service.findWorkOrderById('wo-1', mockUser);

      expect(result).toEqual(mockWorkOrder);
    });

    it('should create work order with auto-generated number', async () => {
      workOrderRepository.find.mockResolvedValue([]);
      workOrderRepository.save.mockResolvedValue(mockWorkOrder);

      const result = await service.createWorkOrder({}, mockUser);

      expect(result.orderNumber).toContain('WO-');
    });

    it('should start work order', async () => {
      cacheService.getOrSet.mockResolvedValue(mockWorkOrder);
      workOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        status: WorkOrderStatus.IN_PROGRESS,
      } as any);

      const result = await service.startWorkOrder('wo-1', mockUser);

      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
    });

    it('should complete work order', async () => {
      const inProgressWO = { ...mockWorkOrder, status: WorkOrderStatus.IN_PROGRESS };
      cacheService.getOrSet.mockResolvedValue(inProgressWO);
      workOrderRepository.save.mockResolvedValue({
        ...inProgressWO,
        status: WorkOrderStatus.COMPLETED,
        completionPercentage: 100,
      } as any);

      const result = await service.completeWorkOrder('wo-1', mockUser);

      expect(result.status).toBe(WorkOrderStatus.COMPLETED);
      expect(result.completionPercentage).toBe(100);
    });

    it('should pause work order', async () => {
      const inProgressWO = { ...mockWorkOrder, status: WorkOrderStatus.IN_PROGRESS };
      cacheService.getOrSet.mockResolvedValue(inProgressWO);
      workOrderRepository.save.mockResolvedValue({
        ...inProgressWO,
        status: WorkOrderStatus.PAUSED,
      } as any);

      const result = await service.pauseWorkOrder('wo-1', mockUser, 'Break time');

      expect(result.status).toBe(WorkOrderStatus.PAUSED);
    });

    it('should update work order progress', async () => {
      cacheService.getOrSet.mockResolvedValue(mockWorkOrder);
      workOrderRepository.save.mockResolvedValue({
        ...mockWorkOrder,
        qtyProduced: 50,
        completionPercentage: 50,
      } as any);

      const result = await service.updateWorkOrderProgress('wo-1', 50, 0, mockUser);

      expect(result.qtyProduced).toBe(50);
      expect(result.completionPercentage).toBe(50);
    });
  });

  // ==================== QUALITY CHECKS TESTS ====================
  describe('Quality Checks Management', () => {
    const mockQualityCheck = {
      id: 'qc-1',
      checkNumber: 'QC-000001',
      workOrderId: 'wo-1',
      quantityChecked: 100,
      quantityPassed: 100,
      quantityFailed: 0,
      result: QualityCheckResult.PASS,
      tenantId: 'tenant-1',
    } as QualityCheck;

    it('should find all quality checks', async () => {
      qualityCheckRepository.find.mockResolvedValue([mockQualityCheck]);

      const result = await service.findAllQualityChecks(mockUser);

      expect(result).toEqual([mockQualityCheck]);
    });

    it('should find quality check by id', async () => {
      cacheService.getOrSet.mockResolvedValue(mockQualityCheck);

      const result = await service.findQualityCheckById('qc-1', mockUser);

      expect(result).toEqual(mockQualityCheck);
    });

    it('should create quality check with auto-generated number', async () => {
      qualityCheckRepository.find.mockResolvedValue([]);
      qualityCheckRepository.save.mockResolvedValue(mockQualityCheck);

      const result = await service.createQualityCheck(
        { quantityChecked: 100, result: QualityCheckResult.PASS },
        mockUser,
      );

      expect(result.checkNumber).toContain('QC-');
    });

    it('should calculate quantities based on result PASS', async () => {
      qualityCheckRepository.find.mockResolvedValue([]);
      const passCheck = {
        ...mockQualityCheck,
        quantityPassed: 100,
        quantityFailed: 0,
      };
      qualityCheckRepository.save.mockResolvedValue(passCheck);

      const result = await service.createQualityCheck(
        { quantityChecked: 100, result: QualityCheckResult.PASS },
        mockUser,
      );

      expect(result.quantityPassed).toBe(100);
      expect(result.quantityFailed).toBe(0);
    });

    it('should approve quality check', async () => {
      cacheService.getOrSet.mockResolvedValue(mockQualityCheck);
      qualityCheckRepository.save.mockResolvedValue({
        ...mockQualityCheck,
        approvedBy: 'user-1',
      } as any);

      const result = await service.approveQualityCheck('qc-1', 'user-1', mockUser);

      expect(result.approvedBy).toBe('user-1');
    });

    it('should get quality statistics', async () => {
      const checks = [
        mockQualityCheck,
        { ...mockQualityCheck, id: 'qc-2', result: QualityCheckResult.FAILED },
      ];
      qualityCheckRepository.find.mockResolvedValue(checks);

      const result = await service.getQualityStatistics(mockUser);

      expect(result.totalChecks).toBe(2);
      expect(result.passedChecks).toBe(1);
      expect(result.failedChecks).toBe(1);
    });
  });
});

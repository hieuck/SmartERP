import { Test, TestingModule } from '@nestjs/testing';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { MaterialType } from './enums/material-type.enum';
import { MoldStatus } from './enums/mold-status.enum';
import { BomStatus } from './enums/bom-status.enum';
import { WorkOrderStatus } from './enums/work-order-status.enum';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { createMockUser } from '@/common/test/test-helpers';

describe('ProductionController', () => {
  let controller: ProductionController;
  let service: jest.Mocked<ProductionService>;

  const mockUser = createMockUser({ tenantId: 'tenant1' });

  const mockProductionService = {
    findAllMaterials: jest.fn(),
    findLowStockMaterials: jest.fn(),
    findMaterialById: jest.fn(),
    createMaterial: jest.fn(),
    updateMaterial: jest.fn(),
    deleteMaterial: jest.fn(),
    findAllMolds: jest.fn(),
    findMoldsNeedingMaintenance: jest.fn(),
    findMoldById: jest.fn(),
    createMold: jest.fn(),
    updateMold: jest.fn(),
    deleteMold: jest.fn(),
    recordMoldUsage: jest.fn(),
    findAllBoms: jest.fn(),
    findBomById: jest.fn(),
    createBom: jest.fn(),
    updateBom: jest.fn(),
    deleteBom: jest.fn(),
    setDefaultBom: jest.fn(),
    findAllWorkOrders: jest.fn(),
    findWorkOrderById: jest.fn(),
    createWorkOrder: jest.fn(),
    updateWorkOrder: jest.fn(),
    deleteWorkOrder: jest.fn(),
    startWorkOrder: jest.fn(),
    completeWorkOrder: jest.fn(),
    pauseWorkOrder: jest.fn(),
    resumeWorkOrder: jest.fn(),
    updateWorkOrderProgress: jest.fn(),
    findAllQualityChecks: jest.fn(),
    getQualityStatistics: jest.fn(),
    findQualityCheckById: jest.fn(),
    createQualityCheck: jest.fn(),
    updateQualityCheck: jest.fn(),
    deleteQualityCheck: jest.fn(),
    approveQualityCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionController],
      providers: [
        {
          provide: ProductionService,
          useValue: mockProductionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductionController>(ProductionController);
    service = module.get(ProductionService) as jest.Mocked<ProductionService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Materials tests
  describe('findAllMaterials', () => {
    it('should return all materials', async () => {
      const materials = [{ id: '1', name: 'Material 1' }];
      mockProductionService.findAllMaterials.mockResolvedValue(materials);

      expect(await controller.findAllMaterials(mockUser)).toEqual(materials);
      expect(service.findAllMaterials).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should filter materials by type', async () => {
      const materials = [{ id: '1', name: 'Material 1', type: MaterialType.RAW }];
      mockProductionService.findAllMaterials.mockResolvedValue(materials);

      expect(await controller.findAllMaterials(mockUser, MaterialType.RAW)).toEqual(materials);
      expect(service.findAllMaterials).toHaveBeenCalledWith(mockUser, MaterialType.RAW);
    });
  });

  describe('findLowStockMaterials', () => {
    it('should return low stock materials', async () => {
      const materials = [{ id: '1', name: 'Material 1', stock: 5 }];
      mockProductionService.findLowStockMaterials.mockResolvedValue(materials);

      expect(await controller.findLowStockMaterials(mockUser)).toEqual(materials);
      expect(service.findLowStockMaterials).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('createMaterial', () => {
    it('should create material', async () => {
      const dto = { name: 'Material 1', type: MaterialType.RAW };
      const material = { id: '1', ...dto };
      mockProductionService.createMaterial.mockResolvedValue(material);

      expect(await controller.createMaterial(mockUser, dto as any)).toEqual(material);
      expect(service.createMaterial).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  // Molds tests
  describe('findAllMolds', () => {
    it('should return all molds', async () => {
      const molds = [{ id: '1', code: 'MOLD-001' }];
      mockProductionService.findAllMolds.mockResolvedValue(molds);

      expect(await controller.findAllMolds(mockUser)).toEqual(molds);
      expect(service.findAllMolds).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should filter molds by status', async () => {
      const molds = [{ id: '1', code: 'MOLD-001', status: MoldStatus.ACTIVE }];
      mockProductionService.findAllMolds.mockResolvedValue(molds);

      expect(await controller.findAllMolds(mockUser, MoldStatus.ACTIVE)).toEqual(molds);
      expect(service.findAllMolds).toHaveBeenCalledWith(mockUser, MoldStatus.ACTIVE);
    });
  });

  describe('recordMoldUsage', () => {
    it('should record mold usage', async () => {
      const mold = { id: '1', usageCount: 101 };
      mockProductionService.recordMoldUsage.mockResolvedValue(mold);

      expect(await controller.recordMoldUsage(mockUser, '1')).toEqual(mold);
      expect(service.recordMoldUsage).toHaveBeenCalledWith('1', mockUser);
    });
  });

  // BOMs tests
  describe('findAllBoms', () => {
    it('should return all BOMs', async () => {
      const boms = [{ id: '1', version: '1.0' }];
      mockProductionService.findAllBoms.mockResolvedValue(boms);

      expect(await controller.findAllBoms(mockUser)).toEqual(boms);
      expect(service.findAllBoms).toHaveBeenCalledWith(mockUser, undefined, undefined);
    });

    it('should filter BOMs by product and status', async () => {
      const boms = [{ id: '1', productId: 'prod-1', status: BomStatus.ACTIVE }];
      mockProductionService.findAllBoms.mockResolvedValue(boms);

      expect(await controller.findAllBoms(mockUser, 'prod-1', BomStatus.ACTIVE)).toEqual(boms);
      expect(service.findAllBoms).toHaveBeenCalledWith(mockUser, 'prod-1', BomStatus.ACTIVE);
    });
  });

  describe('setDefaultBom', () => {
    it('should set BOM as default', async () => {
      const bom = { id: '1', isDefault: true };
      mockProductionService.setDefaultBom.mockResolvedValue(bom);

      expect(await controller.setDefaultBom('1', mockUser, 'prod-1')).toEqual(bom);
      expect(service.setDefaultBom).toHaveBeenCalledWith('1', 'prod-1', mockUser);
    });
  });

  // Work Orders tests
  describe('findAllWorkOrders', () => {
    it('should return all work orders', async () => {
      const orders = [{ id: '1', status: WorkOrderStatus.DRAFT }];
      mockProductionService.findAllWorkOrders.mockResolvedValue(orders);

      expect(await controller.findAllWorkOrders(mockUser)).toEqual(orders);
      expect(service.findAllWorkOrders).toHaveBeenCalledWith(mockUser, undefined);
    });
  });

  describe('startWorkOrder', () => {
    it('should start work order', async () => {
      const order = { id: '1', status: WorkOrderStatus.IN_PROGRESS };
      mockProductionService.startWorkOrder.mockResolvedValue(order);

      expect(await controller.startWorkOrder(mockUser, '1')).toEqual(order);
      expect(service.startWorkOrder).toHaveBeenCalledWith('1', mockUser);
    });
  });

  describe('completeWorkOrder', () => {
    it('should complete work order', async () => {
      const order = { id: '1', status: WorkOrderStatus.COMPLETED };
      mockProductionService.completeWorkOrder.mockResolvedValue(order);

      expect(await controller.completeWorkOrder(mockUser, '1')).toEqual(order);
      expect(service.completeWorkOrder).toHaveBeenCalledWith('1', mockUser);
    });
  });

  describe('pauseWorkOrder', () => {
    it('should pause work order', async () => {
      const order = { id: '1', status: WorkOrderStatus.PAUSED };
      mockProductionService.pauseWorkOrder.mockResolvedValue(order);

      expect(await controller.pauseWorkOrder('1', mockUser, 'Machine breakdown')).toEqual(order);
      expect(service.pauseWorkOrder).toHaveBeenCalledWith('1', mockUser, 'Machine breakdown');
    });
  });

  describe('resumeWorkOrder', () => {
    it('should resume work order', async () => {
      const order = { id: '1', status: WorkOrderStatus.IN_PROGRESS };
      mockProductionService.resumeWorkOrder.mockResolvedValue(order);

      expect(await controller.resumeWorkOrder(mockUser, '1')).toEqual(order);
      expect(service.resumeWorkOrder).toHaveBeenCalledWith('1', mockUser);
    });
  });

  describe('updateWorkOrderProgress', () => {
    it('should update work order progress', async () => {
      const order = { id: '1', quantityProduced: 50, quantityRejected: 2 };
      mockProductionService.updateWorkOrderProgress.mockResolvedValue(order);

      expect(await controller.updateWorkOrderProgress('1', 50, mockUser, 2)).toEqual(order);
      expect(service.updateWorkOrderProgress).toHaveBeenCalledWith('1', 50, 2, mockUser);
    });
  });

  // Quality Checks tests
  describe('findAllQualityChecks', () => {
    it('should return all quality checks', async () => {
      const checks = [{ id: '1', passed: true }];
      mockProductionService.findAllQualityChecks.mockResolvedValue(checks);

      expect(await controller.findAllQualityChecks(mockUser)).toEqual(checks);
      expect(service.findAllQualityChecks).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should filter quality checks by work order', async () => {
      const checks = [{ id: '1', workOrderId: 'wo-1', passed: true }];
      mockProductionService.findAllQualityChecks.mockResolvedValue(checks);

      expect(await controller.findAllQualityChecks(mockUser, 'wo-1')).toEqual(checks);
      expect(service.findAllQualityChecks).toHaveBeenCalledWith(mockUser, 'wo-1');
    });
  });

  describe('getQualityStatistics', () => {
    it('should return quality statistics', async () => {
      const stats = { totalChecks: 100, passedChecks: 95, failedChecks: 5 };
      mockProductionService.getQualityStatistics.mockResolvedValue(stats);

      expect(
        await controller.getQualityStatistics(mockUser, '2026-03-01', '2026-03-31'),
      ).toEqual(stats);
      expect(service.getQualityStatistics).toHaveBeenCalledWith(
        mockUser,
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );
    });

    it('should return quality statistics without date range', async () => {
      const stats = { totalChecks: 100, passedChecks: 95, failedChecks: 5 };
      mockProductionService.getQualityStatistics.mockResolvedValue(stats);

      expect(await controller.getQualityStatistics(mockUser)).toEqual(stats);
      expect(service.getQualityStatistics).toHaveBeenCalledWith(
        mockUser,
        undefined,
        undefined,
      );
    });
  });

  describe('approveQualityCheck', () => {
    it('should approve quality check', async () => {
      const check = { id: '1', approved: true, approvedBy: 'manager-1' };
      mockProductionService.approveQualityCheck.mockResolvedValue(check);

      expect(await controller.approveQualityCheck('1', mockUser, 'manager-1')).toEqual(check);
      expect(service.approveQualityCheck).toHaveBeenCalledWith('1', 'manager-1', mockUser);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { MaterialType } from './entities/material.entity';
import { MoldStatus } from './entities/mold.entity';
import { BomStatus } from './entities/bom.entity';
import { WorkOrderStatus } from './entities/work-order.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { CreateMoldDto } from './dto/create-mold.dto';
import { UpdateMoldDto } from './dto/update-mold.dto';
import { CreateBomDto } from './dto/create-bom.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { createMockUser } from '@/common/test/test-helpers';

describe('ProductionController', () => {
  let controller: ProductionController;
  let service: jest.Mocked<ProductionService>;

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

  const mockUser = createMockUser();

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
      .overrideGuard(TenantGuard)
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

      expect(await controller.findAllMaterials('tenant-1')).toEqual(materials);
      expect(service.findAllMaterials).toHaveBeenCalledWith('tenant-1', undefined);
    });

    it('should filter materials by type', async () => {
      const materials = [{ id: '1', name: 'Material 1', type: MaterialType.RAW }];
      mockProductionService.findAllMaterials.mockResolvedValue(materials);

      expect(await controller.findAllMaterials('tenant-1', MaterialType.RAW)).toEqual(materials);
      expect(service.findAllMaterials).toHaveBeenCalledWith('tenant-1', MaterialType.RAW);
    });
  });

  describe('findLowStockMaterials', () => {
    it('should return low stock materials', async () => {
      const materials = [{ id: '1', name: 'Material 1', stock: 5 }];
      mockProductionService.findLowStockMaterials.mockResolvedValue(materials);

      expect(await controller.findLowStockMaterials('tenant-1')).toEqual(materials);
      expect(service.findLowStockMaterials).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('createMaterial', () => {
    it('should create material', async () => {
      const dto = { name: 'Material 1', type: MaterialType.RAW };
      const material = { id: '1', ...dto };
      mockProductionService.createMaterial.mockResolvedValue(material);

      expect(await controller.createMaterial(dto as any, 'tenant-1')).toEqual(material);
      expect(service.createMaterial).toHaveBeenCalledWith(dto, 'tenant-1');
    });
  });

  // Molds tests
  describe('findAllMolds', () => {
    it('should return all molds', async () => {
      const molds = [{ id: '1', code: 'MOLD-001' }];
      mockProductionService.findAllMolds.mockResolvedValue(molds);

      expect(await controller.findAllMolds('tenant-1')).toEqual(molds);
      expect(service.findAllMolds).toHaveBeenCalledWith('tenant-1', undefined);
    });

    it('should filter molds by status', async () => {
      const molds = [{ id: '1', code: 'MOLD-001', status: MoldStatus.ACTIVE }];
      mockProductionService.findAllMolds.mockResolvedValue(molds);

      expect(await controller.findAllMolds('tenant-1', MoldStatus.ACTIVE)).toEqual(molds);
      expect(service.findAllMolds).toHaveBeenCalledWith('tenant-1', MoldStatus.ACTIVE);
    });
  });

  describe('recordMoldUsage', () => {
    it('should record mold usage', async () => {
      const mold = { id: '1', usageCount: 101 };
      mockProductionService.recordMoldUsage.mockResolvedValue(mold);

      expect(await controller.recordMoldUsage('1', 'tenant-1')).toEqual(mold);
      expect(service.recordMoldUsage).toHaveBeenCalledWith('1', 'tenant-1');
    });
  });

  // BOMs tests
  describe('findAllBoms', () => {
    it('should return all BOMs', async () => {
      const boms = [{ id: '1', version: '1.0' }];
      mockProductionService.findAllBoms.mockResolvedValue(boms);

      expect(await controller.findAllBoms('tenant-1')).toEqual(boms);
      expect(service.findAllBoms).toHaveBeenCalledWith('tenant-1', undefined, undefined);
    });

    it('should filter BOMs by product and status', async () => {
      const boms = [{ id: '1', productId: 'prod-1', status: BomStatus.ACTIVE }];
      mockProductionService.findAllBoms.mockResolvedValue(boms);

      expect(await controller.findAllBoms('tenant-1', 'prod-1', BomStatus.ACTIVE)).toEqual(boms);
      expect(service.findAllBoms).toHaveBeenCalledWith('tenant-1', 'prod-1', BomStatus.ACTIVE);
    });
  });

  describe('setDefaultBom', () => {
    it('should set BOM as default', async () => {
      const bom = { id: '1', isDefault: true };
      mockProductionService.setDefaultBom.mockResolvedValue(bom);

      expect(await controller.setDefaultBom('1', 'prod-1', 'tenant-1')).toEqual(bom);
      expect(service.setDefaultBom).toHaveBeenCalledWith('1', 'prod-1', 'tenant-1');
    });
  });

  // Work Orders tests
  describe('findAllWorkOrders', () => {
    it('should return all work orders', async () => {
      const orders = [{ id: '1', status: WorkOrderStatus.DRAFT }];
      mockProductionService.findAllWorkOrders.mockResolvedValue(orders);

      expect(await controller.findAllWorkOrders('tenant-1')).toEqual(orders);
      expect(service.findAllWorkOrders).toHaveBeenCalledWith('tenant-1', undefined);
    });
  });

  describe('startWorkOrder', () => {
    it('should start work order', async () => {
      const order = { id: '1', status: WorkOrderStatus.IN_PROGRESS };
      mockProductionService.startWorkOrder.mockResolvedValue(order);

      expect(await controller.startWorkOrder('1', 'tenant-1')).toEqual(order);
      expect(service.startWorkOrder).toHaveBeenCalledWith('1', 'tenant-1');
    });
  });

  describe('completeWorkOrder', () => {
    it('should complete work order', async () => {
      const order = { id: '1', status: WorkOrderStatus.COMPLETED };
      mockProductionService.completeWorkOrder.mockResolvedValue(order);

      expect(await controller.completeWorkOrder('1', 'tenant-1')).toEqual(order);
      expect(service.completeWorkOrder).toHaveBeenCalledWith('1', 'tenant-1');
    });
  });

  describe('pauseWorkOrder', () => {
    it('should pause work order', async () => {
      const order = { id: '1', status: WorkOrderStatus.PAUSED };
      mockProductionService.pauseWorkOrder.mockResolvedValue(order);

      expect(await controller.pauseWorkOrder('1', 'Machine breakdown', 'tenant-1')).toEqual(order);
      expect(service.pauseWorkOrder).toHaveBeenCalledWith('1', 'tenant-1', 'Machine breakdown');
    });
  });

  describe('resumeWorkOrder', () => {
    it('should resume work order', async () => {
      const order = { id: '1', status: WorkOrderStatus.IN_PROGRESS };
      mockProductionService.resumeWorkOrder.mockResolvedValue(order);

      expect(await controller.resumeWorkOrder('1', 'tenant-1')).toEqual(order);
      expect(service.resumeWorkOrder).toHaveBeenCalledWith('1', 'tenant-1');
    });
  });

  describe('updateWorkOrderProgress', () => {
    it('should update work order progress', async () => {
      const order = { id: '1', quantityProduced: 50, quantityRejected: 2 };
      mockProductionService.updateWorkOrderProgress.mockResolvedValue(order);

      expect(await controller.updateWorkOrderProgress('1', 50, 2, 'tenant-1')).toEqual(order);
      expect(service.updateWorkOrderProgress).toHaveBeenCalledWith('1', 50, 2, 'tenant-1');
    });
  });

  // Quality Checks tests
  describe('findAllQualityChecks', () => {
    it('should return all quality checks', async () => {
      const checks = [{ id: '1', passed: true }];
      mockProductionService.findAllQualityChecks.mockResolvedValue(checks);

      expect(await controller.findAllQualityChecks('tenant-1')).toEqual(checks);
      expect(service.findAllQualityChecks).toHaveBeenCalledWith('tenant-1', undefined);
    });

    it('should filter quality checks by work order', async () => {
      const checks = [{ id: '1', workOrderId: 'wo-1', passed: true }];
      mockProductionService.findAllQualityChecks.mockResolvedValue(checks);

      expect(await controller.findAllQualityChecks('tenant-1', 'wo-1')).toEqual(checks);
      expect(service.findAllQualityChecks).toHaveBeenCalledWith('tenant-1', 'wo-1');
    });
  });

  describe('getQualityStatistics', () => {
    it('should return quality statistics', async () => {
      const stats = { totalChecks: 100, passedChecks: 95, failedChecks: 5 };
      mockProductionService.getQualityStatistics.mockResolvedValue(stats);

      expect(
        await controller.getQualityStatistics('tenant-1', '2026-03-01', '2026-03-31'),
      ).toEqual(stats);
      expect(service.getQualityStatistics).toHaveBeenCalledWith(
        'tenant-1',
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );
    });

    it('should return quality statistics without date range', async () => {
      const stats = { totalChecks: 100, passedChecks: 95, failedChecks: 5 };
      mockProductionService.getQualityStatistics.mockResolvedValue(stats);

      expect(await controller.getQualityStatistics('tenant-1')).toEqual(stats);
      expect(service.getQualityStatistics).toHaveBeenCalledWith(
        'tenant-1',
        undefined,
        undefined,
      );
    });
  });

  describe('approveQualityCheck', () => {
    it('should approve quality check', async () => {
      const check = { id: '1', approved: true, approvedBy: 'manager-1' };
      mockProductionService.approveQualityCheck.mockResolvedValue(check);

      expect(await controller.approveQualityCheck('1', 'manager-1', 'tenant-1')).toEqual(check);
      expect(service.approveQualityCheck).toHaveBeenCalledWith('1', 'manager-1', 'tenant-1');
    });
  });
});

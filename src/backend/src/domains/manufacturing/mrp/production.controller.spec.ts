/**
 * ProductionController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * Materials: GET all, GET low-stock, GET by ID, POST create, PUT update, DELETE
 * Molds: GET all, GET maintenance-needed, GET by ID, POST create, PUT update, DELETE, POST record-usage
 * BOMs: GET all, GET by ID, POST create, PUT update, DELETE, POST set-default
 * Work Orders: GET all, GET by ID, POST create, PUT update, DELETE, POST start/complete/pause/resume/update-progress
 * Quality Checks: GET all, GET statistics, GET by ID, POST create, PUT update, DELETE, POST approve
 * Authentication/Authorization tests
 * Validation tests
 * Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { MaterialType } from './enums/material-type.enum';
import { MoldStatus } from './enums/mold-status.enum';
import { BomStatus } from './enums/bom-status.enum';
import { WorkOrderStatus } from './enums/work-order-status.enum';

describe('ProductionController (Integration)', () => {
  let app: INestApplication;
  let productionService: jest.Mocked<ProductionService>;

  const mockUser = {
    id: 'user-123',
    email: 'production@example.com',
    tenantId: 'tenant-123',
    roles: ['production_manager'],
  };

  const mockMaterial = {
    id: 'mat-123',
    code: 'MAT-001',
    name: 'Steel Sheet',
    type: MaterialType.RAW_MATERIAL,
    unit: 'kg',
    currentStock: 1000,
    minStock: 100,
    unitPrice: 50000,
    tenantId: 'tenant-123',
  };

  const mockMold = {
    id: 'mold-123',
    code: 'MOLD-001',
    name: 'Injection Mold A',
    status: MoldStatus.ACTIVE,
    usageCount: 100,
    maxUsageCount: 10000,
    lastMaintenanceDate: new Date('2024-01-01'),
    tenantId: 'tenant-123',
  };

  const mockBom = {
    id: 'bom-123',
    code: 'BOM-001',
    productId: 'prod-123',
    version: '1.0',
    status: BomStatus.ACTIVE,
    isDefault: true,
    items: [],
    tenantId: 'tenant-123',
  };

  const mockWorkOrder = {
    id: 'wo-123',
    code: 'WO-001',
    productId: 'prod-123',
    bomId: 'bom-123',
    status: WorkOrderStatus.DRAFT,
    quantityPlanned: 100,
    quantityProduced: 0,
    quantityRejected: 0,
    startDate: new Date('2024-01-15'),
    tenantId: 'tenant-123',
  };

  const mockQualityCheck = {
    id: 'qc-123',
    workOrderId: 'wo-123',
    checkDate: new Date(),
    result: 'passed',
    notes: 'All checks passed',
    tenantId: 'tenant-123',
  };

  beforeAll(async () => {
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

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        if (request.user && request.user.tenantId) {
          return true;
        }
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductionController],
      providers: [
        {
          provide: ProductionService,
          useValue: mockProductionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    productionService = moduleFixture.get(ProductionService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== MATERIALS TESTS ====================

  describe('GET /production/materials', () => {
    it('should return all materials', async () => {
      const materials = [mockMaterial];
      productionService.findAllMaterials.mockResolvedValue(materials as any);

      const response = await request(app.getHttpServer())
        .get('/production/materials')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(materials);
      expect(productionService.findAllMaterials).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should filter materials by type', async () => {
      productionService.findAllMaterials.mockResolvedValue([mockMaterial] as any);

      await request(app.getHttpServer())
        .get(`/production/materials?type=${MaterialType.RAW_MATERIAL}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(productionService.findAllMaterials).toHaveBeenCalledWith(mockUser, MaterialType.RAW_MATERIAL);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/production/materials')
        .expect(401);
    });

    it('should return empty array when no materials', async () => {
      productionService.findAllMaterials.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/production/materials')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /production/materials/low-stock', () => {
    it('should return materials with low stock', async () => {
      const lowStockMaterials = [{ ...mockMaterial, currentStock: 50 }];
      productionService.findLowStockMaterials.mockResolvedValue(lowStockMaterials as any);

      const response = await request(app.getHttpServer())
        .get('/production/materials/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(lowStockMaterials);
      expect(productionService.findLowStockMaterials).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no low stock materials', async () => {
      productionService.findLowStockMaterials.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/production/materials/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /production/materials/:id', () => {
    it('should return material by ID', async () => {
      productionService.findMaterialById.mockResolvedValue(mockMaterial as any);

      const response = await request(app.getHttpServer())
        .get('/production/materials/mat-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockMaterial);
      expect(productionService.findMaterialById).toHaveBeenCalledWith('mat-123', mockUser);
    });

    it('should return 404 when material not found', async () => {
      productionService.findMaterialById.mockRejectedValue(
        new HttpException('Material not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/production/materials/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('POST /production/materials', () => {
    it('should create material successfully', async () => {
      const createDto = {
        code: 'MAT-002',
        name: 'Aluminum Sheet',
        type: MaterialType.RAW_MATERIAL,
        unit: 'kg',
        minStock: 50,
        unitPrice: 60000,
      };

      productionService.createMaterial.mockResolvedValue({ ...mockMaterial, ...createDto } as any);

      const response = await request(app.getHttpServer())
        .post('/production/materials')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe('MAT-002');
      expect(productionService.createMaterial).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/production/materials')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });
  });

  describe('PUT /production/materials/:id', () => {
    it('should update material successfully', async () => {
      const updateDto = { unitPrice: 55000, minStock: 150 };
      productionService.updateMaterial.mockResolvedValue({ ...mockMaterial, ...updateDto } as any);

      const response = await request(app.getHttpServer())
        .put('/production/materials/mat-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.unitPrice).toBe(55000);
      expect(productionService.updateMaterial).toHaveBeenCalledWith('mat-123', updateDto, mockUser);
    });

    it('should return 404 when material not found', async () => {
      productionService.updateMaterial.mockRejectedValue(
        new HttpException('Material not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/production/materials/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ unitPrice: 50000 })
        .expect(404);
    });
  });

  describe('DELETE /production/materials/:id', () => {
    it('should delete material successfully', async () => {
      productionService.deleteMaterial.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/production/materials/mat-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(productionService.deleteMaterial).toHaveBeenCalledWith('mat-123', mockUser);
    });

    it('should return 404 when material not found', async () => {
      productionService.deleteMaterial.mockRejectedValue(
        new HttpException('Material not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/production/materials/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when material is in use', async () => {
      productionService.deleteMaterial.mockRejectedValue(
        new HttpException('Cannot delete material in use', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/production/materials/mat-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  // ==================== MOLDS TESTS ====================

  describe('GET /production/molds', () => {
    it('should return all molds', async () => {
      const molds = [mockMold];
      productionService.findAllMolds.mockResolvedValue(molds as any);

      const response = await request(app.getHttpServer())
        .get('/production/molds')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(molds);
      expect(productionService.findAllMolds).toHaveBeenCalledWith(mockUser, undefined);
    });

    it('should filter molds by status', async () => {
      productionService.findAllMolds.mockResolvedValue([mockMold] as any);

      await request(app.getHttpServer())
        .get(`/production/molds?status=${MoldStatus.ACTIVE}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(productionService.findAllMolds).toHaveBeenCalledWith(mockUser, MoldStatus.ACTIVE);
    });
  });

  describe('GET /production/molds/maintenance-needed', () => {
    it('should return molds needing maintenance', async () => {
      const maintenanceMolds = [{ ...mockMold, usageCount: 9500 }];
      productionService.findMoldsNeedingMaintenance.mockResolvedValue(maintenanceMolds as any);

      const response = await request(app.getHttpServer())
        .get('/production/molds/maintenance-needed')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(maintenanceMolds);
      expect(productionService.findMoldsNeedingMaintenance).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('GET /production/molds/:id', () => {
    it('should return mold by ID', async () => {
      productionService.findMoldById.mockResolvedValue(mockMold as any);

      const response = await request(app.getHttpServer())
        .get('/production/molds/mold-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockMold);
      expect(productionService.findMoldById).toHaveBeenCalledWith('mold-123', mockUser);
    });
  });

  describe('POST /production/molds', () => {
    it('should create mold successfully', async () => {
      const createDto = {
        code: 'MOLD-002',
        name: 'Blow Mold B',
        maxUsageCount: 15000,
      };

      productionService.createMold.mockResolvedValue({ ...mockMold, ...createDto } as any);

      const response = await request(app.getHttpServer())
        .post('/production/molds')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe('MOLD-002');
      expect(productionService.createMold).toHaveBeenCalledWith(createDto, mockUser);
    });
  });

  describe('PUT /production/molds/:id', () => {
    it('should update mold successfully', async () => {
      const updateDto = { status: MoldStatus.MAINTENANCE };
      productionService.updateMold.mockResolvedValue({ ...mockMold, ...updateDto } as any);

      const response = await request(app.getHttpServer())
        .put('/production/molds/mold-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe(MoldStatus.MAINTENANCE);
      expect(productionService.updateMold).toHaveBeenCalledWith('mold-123', updateDto, mockUser);
    });
  });

  describe('DELETE /production/molds/:id', () => {
    it('should delete mold successfully', async () => {
      productionService.deleteMold.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/production/molds/mold-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(productionService.deleteMold).toHaveBeenCalledWith('mold-123', mockUser);
    });
  });

  describe('POST /production/molds/:id/record-usage', () => {
    it('should record mold usage successfully', async () => {
      const updatedMold = { ...mockMold, usageCount: 101 };
      productionService.recordMoldUsage.mockResolvedValue(updatedMold as any);

      const response = await request(app.getHttpServer())
        .post('/production/molds/mold-123/record-usage')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body.usageCount).toBe(101);
      expect(productionService.recordMoldUsage).toHaveBeenCalledWith('mold-123', mockUser);
    });
  });

  // ==================== BOMS TESTS ====================

  describe('GET /production/boms', () => {
    it('should return all BOMs', async () => {
      const boms = [mockBom];
      productionService.findAllBoms.mockResolvedValue(boms as any);

      const response = await request(app.getHttpServer())
        .get('/production/boms')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(boms);
      expect(productionService.findAllBoms).toHaveBeenCalledWith(mockUser, undefined, undefined);
    });

    it('should filter BOMs by productId and status', async () => {
      productionService.findAllBoms.mockResolvedValue([mockBom] as any);

      await request(app.getHttpServer())
        .get(`/production/boms?productId=prod-123&status=${BomStatus.ACTIVE}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(productionService.findAllBoms).toHaveBeenCalledWith(mockUser, 'prod-123', BomStatus.ACTIVE);
    });
  });

  describe('GET /production/boms/:id', () => {
    it('should return BOM by ID', async () => {
      productionService.findBomById.mockResolvedValue(mockBom as any);

      const response = await request(app.getHttpServer())
        .get('/production/boms/bom-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockBom);
      expect(productionService.findBomById).toHaveBeenCalledWith('bom-123', mockUser);
    });
  });

  describe('POST /production/boms', () => {
    it('should create BOM successfully', async () => {
      const createDto = {
        code: 'BOM-002',
        productId: 'prod-456',
        version: '1.0',
        items: [{ materialId: 'mat-123', quantity: 10 }],
      };

      productionService.createBom.mockResolvedValue({ ...mockBom, ...createDto } as any);

      const response = await request(app.getHttpServer())
        .post('/production/boms')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.code).toBe('BOM-002');
      expect(productionService.createBom).toHaveBeenCalledWith(createDto, mockUser);
    });
  });

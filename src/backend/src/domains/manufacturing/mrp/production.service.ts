import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, MaterialType } from './entities/material.entity';
import { Mold, MoldStatus } from './entities/mold.entity';
import { Bom, BomStatus } from './entities/bom.entity';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { QualityCheck, QualityCheckResult } from './entities/quality-check.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User, BaseRecord as PermissionRecord } from '@/common/security/permission.service';

@Injectable()
export class ProductionService {
  private secureMaterialRepo: SecureRepository<Material & PermissionRecord>;
  private secureMoldRepo: SecureRepository<Mold & PermissionRecord>;
  private secureBomRepo: SecureRepository<Bom & PermissionRecord>;
  private secureWorkOrderRepo: SecureRepository<WorkOrder & PermissionRecord>;
  private secureQualityCheckRepo: SecureRepository<QualityCheck & PermissionRecord>;

  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Mold)
    private readonly moldRepository: Repository<Mold>,
    @InjectRepository(Bom)
    private readonly bomRepository: Repository<Bom>,
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(QualityCheck)
    private readonly qualityCheckRepository: Repository<QualityCheck>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureMaterialRepo = new SecureRepository(
      materialRepository as any,
      permissionService,
      'Material',
    );
    this.secureMoldRepo = new SecureRepository(moldRepository as any, permissionService, 'Mold');
    this.secureBomRepo = new SecureRepository(bomRepository as any, permissionService, 'Bom');
    this.secureWorkOrderRepo = new SecureRepository(
      workOrderRepository as any,
      permissionService,
      'WorkOrder',
    );
    this.secureQualityCheckRepo = new SecureRepository(
      qualityCheckRepository as any,
      permissionService,
      'QualityCheck',
    );
  }

  // ==================== MATERIALS MANAGEMENT ====================

  async findAllMaterials(user: User, type?: MaterialType): Promise<Material[]> {
    const where: { type?: MaterialType } = {};
    if (type) {
      where.type = type;
    }

    return this.secureMaterialRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  async findMaterialById(id: string, user: User): Promise<Material> {
    const cacheKey = generateCacheKey('material', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const material = await this.secureMaterialRepo.findOne(user, { where: { id } });
        if (!material) {
          throw new NotFoundException(`Material with ID ${id} not found`);
        }
        return material;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createMaterial(data: Partial<Material>, user: User): Promise<Material> {
    return this.secureMaterialRepo.save(user, data);
  }

  async updateMaterial(id: string, data: Partial<Material>, user: User): Promise<Material> {
    const material = await this.findMaterialById(id, user);
    Object.assign(material, data);
    const updated = await this.secureMaterialRepo.save(user, material);

    // Invalidate cache
    const cacheKey = generateCacheKey('material', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteMaterial(id: string, user: User): Promise<void> {
    const material = await this.findMaterialById(id, user);
    await this.secureMaterialRepo.remove(user, material);

    // Invalidate cache
    const cacheKey = generateCacheKey('material', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findLowStockMaterials(user: User): Promise<Material[]> {
    const materials = await this.secureMaterialRepo.find(user, {});
    return materials.filter((m) => m.stockQuantity <= m.reorderPoint);
  }

  // ==================== MOLDS MANAGEMENT ====================

  async findAllMolds(user: User, status?: MoldStatus): Promise<Mold[]> {
    const where: { status?: MoldStatus } = {};
    if (status) {
      where.status = status;
    }

    return this.secureMoldRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { code: 'ASC' },
    });
  }

  async findMoldById(id: string, user: User): Promise<Mold> {
    const cacheKey = generateCacheKey('mold', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const mold = await this.secureMoldRepo.findOne(user, { where: { id } });
        if (!mold) {
          throw new NotFoundException(`Mold with ID ${id} not found`);
        }
        return mold;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createMold(data: Partial<Mold>, user: User): Promise<Mold> {
    return this.secureMoldRepo.save(user, data);
  }

  async updateMold(id: string, data: Partial<Mold>, user: User): Promise<Mold> {
    const mold = await this.findMoldById(id, user);
    Object.assign(mold, data);
    const updated = await this.secureMoldRepo.save(user, mold);

    // Invalidate cache
    const cacheKey = generateCacheKey('mold', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteMold(id: string, user: User): Promise<void> {
    const mold = await this.findMoldById(id, user);
    await this.secureMoldRepo.remove(user, mold);

    // Invalidate cache
    const cacheKey = generateCacheKey('mold', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findMoldsNeedingMaintenance(user: User): Promise<Mold[]> {
    const today = new Date();
    const molds = await this.secureMoldRepo.find(user, {
      where: { status: MoldStatus.ACTIVE },
    });
    return molds.filter((m) => m.nextMaintenanceDate && m.nextMaintenanceDate <= today);
  }

  async recordMoldUsage(id: string, user: User): Promise<Mold> {
    const mold = await this.findMoldById(id, user);
    mold.usageCount += 1;

    // Check if maintenance is needed
    if (mold.maxUsageCount && mold.usageCount >= mold.maxUsageCount) {
      mold.status = MoldStatus.MAINTENANCE;
    }

    const updated = await this.secureMoldRepo.save(user, mold);

    // Invalidate cache
    const cacheKey = generateCacheKey('mold', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  // ==================== BOM MANAGEMENT ====================

  async findAllBoms(user: User, productId?: string, status?: BomStatus): Promise<Bom[]> {
    const where: { productId?: string; status?: BomStatus } = {};
    if (productId) {
      where.productId = productId;
    }
    if (status) {
      where.status = status;
    }

    return this.secureBomRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { code: 'ASC' },
    });
  }

  async findBomById(id: string, user: User): Promise<Bom> {
    const cacheKey = generateCacheKey('bom', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const bom = await this.secureBomRepo.findOne(user, { where: { id } });
        if (!bom) {
          throw new NotFoundException(`BOM with ID ${id} not found`);
        }
        return bom;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createBom(data: Partial<Bom>, user: User): Promise<Bom> {
    // Calculate total material cost
    let totalMaterialCost = 0;
    if (data.materialItems) {
      totalMaterialCost = data.materialItems.reduce((sum, item) => {
        return sum + (item.totalCost || 0);
      }, 0);
    }

    const bom = {
      ...data,
      totalMaterialCost,
      totalCost: totalMaterialCost + (data.laborCost || 0) + (data.overheadCost || 0),
    };

    return this.secureBomRepo.save(user, bom);
  }

  async updateBom(id: string, data: Partial<Bom>, user: User): Promise<Bom> {
    const bom = await this.findBomById(id, user);

    // Recalculate costs if material items changed
    if (data.materialItems) {
      const totalMaterialCost = data.materialItems.reduce((sum, item) => {
        return sum + (item.totalCost || 0);
      }, 0);
      data.totalMaterialCost = totalMaterialCost;
      data.totalCost = totalMaterialCost + (data.laborCost || 0) + (data.overheadCost || 0);
    }

    Object.assign(bom, data);
    const updated = await this.secureBomRepo.save(user, bom);

    // Invalidate cache
    const cacheKey = generateCacheKey('bom', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteBom(id: string, user: User): Promise<void> {
    const bom = await this.findBomById(id, user);
    await this.secureBomRepo.remove(user, bom);

    // Invalidate cache
    const cacheKey = generateCacheKey('bom', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async setDefaultBom(id: string, productId: string, user: User): Promise<Bom> {
    // Unset other default BOMs for this product
    const boms = await this.findAllBoms(user, productId);
    for (const bom of boms) {
      if (bom.isDefault && bom.id !== id) {
        bom.isDefault = false;
        await this.secureBomRepo.save(user, bom);
      }
    }

    // Set this BOM as default
    const bom = await this.findBomById(id, user);
    bom.isDefault = true;
    const updated = await this.secureBomRepo.save(user, bom);

    // Invalidate cache
    const cacheKey = generateCacheKey('bom', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  // ==================== WORK ORDERS MANAGEMENT ====================

  async findAllWorkOrders(user: User, status?: WorkOrderStatus): Promise<WorkOrder[]> {
    const where: { status?: WorkOrderStatus } = {};
    if (status) {
      where.status = status;
    }

    return this.secureWorkOrderRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { createdAt: 'DESC' },
    });
  }

  async findWorkOrderById(id: string, user: User): Promise<WorkOrder> {
    const cacheKey = generateCacheKey('workorder', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const workOrder = await this.secureWorkOrderRepo.findOne(user, { where: { id } });
        if (!workOrder) {
          throw new NotFoundException(`Work Order with ID ${id} not found`);
        }
        return workOrder;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createWorkOrder(data: Partial<WorkOrder>, user: User): Promise<WorkOrder> {
    // Generate order number if not provided
    if (!data.orderNumber) {
      const workOrders = await this.secureWorkOrderRepo.find(user, {});
      data.orderNumber = `WO-${String(workOrders.length + 1).padStart(6, '0')}`;
    }

    return this.secureWorkOrderRepo.save(user, data);
  }

  async updateWorkOrder(id: string, data: Partial<WorkOrder>, user: User): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, user);
    Object.assign(workOrder, data);
    const updated = await this.secureWorkOrderRepo.save(user, workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteWorkOrder(id: string, user: User): Promise<void> {
    const workOrder = await this.findWorkOrderById(id, user);
    await this.secureWorkOrderRepo.remove(user, workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async startWorkOrder(id: string, user: User): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, user);

    if (
      workOrder.status !== WorkOrderStatus.READY &&
      workOrder.status !== WorkOrderStatus.PLANNED
    ) {
      throw new Error('Work order must be in READY or PLANNED status to start');
    }

    workOrder.status = WorkOrderStatus.IN_PROGRESS;
    workOrder.actualStartDate = new Date();

    const updated = await this.secureWorkOrderRepo.save(user, workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async completeWorkOrder(id: string, user: User): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, user);

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new Error('Work order must be in IN_PROGRESS status to complete');
    }

    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.actualEndDate = new Date();
    workOrder.completionPercentage = 100;

    const updated = await this.secureWorkOrderRepo.save(user, workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async pauseWorkOrder(id: string, user: User, reason?: string): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, user);

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new Error('Work order must be in IN_PROGRESS status to pause');
    }

    workOrder.status = WorkOrderStatus.PAUSED;
    if (reason) {
      workOrder.notes = (workOrder.notes || '') + `\nPaused: ${reason}`;
    }

    const updated = await this.secureWorkOrderRepo.save(user, workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async resumeWorkOrder(id: string, user: User): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, user);

    if (workOrder.status !== WorkOrderStatus.PAUSED) {
      throw new Error('Work order must be in PAUSED status to resume');
    }

    workOrder.status = WorkOrderStatus.IN_PROGRESS;

    const updated = await this.secureWorkOrderRepo.save(user, workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async updateWorkOrderProgress(
    id: string,
    quantityProduced: number,
    quantityRejected: number,
    user: User,
  ): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, user);

    workOrder.quantityProduced = quantityProduced;
    workOrder.quantityRejected = quantityRejected;
    workOrder.completionPercentage = (quantityProduced / workOrder.quantityPlanned) * 100;

    const updated = await this.secureWorkOrderRepo.save(user, workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  // ==================== QUALITY CHECKS MANAGEMENT ====================

  async findAllQualityChecks(user: User, workOrderId?: string): Promise<QualityCheck[]> {
    const where: { workOrderId?: string } = {};
    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    return this.secureQualityCheckRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { checkDate: 'DESC' },
    });
  }

  async findQualityCheckById(id: string, user: User): Promise<QualityCheck> {
    const cacheKey = generateCacheKey('qualitycheck', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const check = await this.secureQualityCheckRepo.findOne(user, { where: { id } });
        if (!check) {
          throw new NotFoundException(`Quality Check with ID ${id} not found`);
        }
        return check;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createQualityCheck(data: Partial<QualityCheck>, user: User): Promise<QualityCheck> {
    // Generate check number if not provided
    if (!data.checkNumber) {
      const checks = await this.secureQualityCheckRepo.find(user, {});
      data.checkNumber = `QC-${String(checks.length + 1).padStart(6, '0')}`;
    }

    // Calculate quantities based on result
    if (data.result === QualityCheckResult.PASSED) {
      data.quantityPassed = data.quantityChecked;
      data.quantityFailed = 0;
    } else if (data.result === QualityCheckResult.FAILED) {
      data.quantityPassed = 0;
      data.quantityFailed = data.quantityChecked;
    }

    return this.secureQualityCheckRepo.save(user, data);
  }

  async updateQualityCheck(
    id: string,
    data: Partial<QualityCheck>,
    user: User,
  ): Promise<QualityCheck> {
    const check = await this.findQualityCheckById(id, user);
    Object.assign(check, data);
    const updated = await this.secureQualityCheckRepo.save(user, check);

    // Invalidate cache
    const cacheKey = generateCacheKey('qualitycheck', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteQualityCheck(id: string, user: User): Promise<void> {
    const check = await this.findQualityCheckById(id, user);
    await this.secureQualityCheckRepo.remove(user, check);

    // Invalidate cache
    const cacheKey = generateCacheKey('qualitycheck', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async approveQualityCheck(id: string, approvedBy: string, user: User): Promise<QualityCheck> {
    const check = await this.findQualityCheckById(id, user);

    check.approvedBy = approvedBy;
    check.approvedAt = new Date();

    const updated = await this.secureQualityCheckRepo.save(user, check);

    // Invalidate cache
    const cacheKey = generateCacheKey('qualitycheck', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async getQualityStatistics(user: User, startDate?: Date, endDate?: Date) {
    const checks = await this.secureQualityCheckRepo.find(user, {});

    // Filter by date range if provided
    let filteredChecks = checks;
    if (startDate || endDate) {
      filteredChecks = checks.filter((c) => {
        const checkDate = new Date(c.checkDate);
        if (startDate && checkDate < startDate) return false;
        if (endDate && checkDate > endDate) return false;
        return true;
      });
    }

    const totalChecks = filteredChecks.length;
    const passedChecks = filteredChecks.filter((c) => c.result === QualityCheckResult.PASSED)
      .length;
    const failedChecks = filteredChecks.filter((c) => c.result === QualityCheckResult.FAILED)
      .length;
    const conditionalChecks = filteredChecks.filter(
      (c) => c.result === QualityCheckResult.CONDITIONAL,
    ).length;

    const totalQuantityChecked = filteredChecks.reduce(
      (sum, c) => sum + Number(c.quantityChecked),
      0,
    );
    const totalQuantityPassed = filteredChecks.reduce(
      (sum, c) => sum + Number(c.quantityPassed),
      0,
    );
    const totalQuantityFailed = filteredChecks.reduce(
      (sum, c) => sum + Number(c.quantityFailed),
      0,
    );

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      conditionalChecks,
      passRate: totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0,
      totalQuantityChecked,
      totalQuantityPassed,
      totalQuantityFailed,
      quantityPassRate:
        totalQuantityChecked > 0 ? (totalQuantityPassed / totalQuantityChecked) * 100 : 0,
    };
  }
}

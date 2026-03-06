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

@Injectable()
export class ProductionService {
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
  ) {}

  // Materials Management
  async findAllMaterials(tenantId: string, type?: MaterialType): Promise<Material[]> {
    const query = this.materialRepository
      .createQueryBuilder('material')
      .select([
        'material.id',
        'material.code',
        'material.name',
        'material.type',
        'material.unit',
        'material.stockQuantity',
        'material.reorderPoint',
        'material.unitCost',
      ])
      .where('material.tenantId = :tenantId', { tenantId })
      .andWhere('material.deletedAt IS NULL');

    if (type) {
      query.andWhere('material.type = :type', { type });
    }

    return query.getMany();
  }

  async findMaterialById(id: string, tenantId: string): Promise<Material> {
    const cacheKey = generateCacheKey('material', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const material = await this.materialRepository.findOne({ where: { id, tenantId } });
        if (!material) {
          throw new NotFoundException(`Material with ID ${id} not found`);
        }
        return material;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createMaterial(data: Partial<Material>, tenantId: string): Promise<Material> {
    const material = this.materialRepository.create({ ...data, tenantId });
    return this.materialRepository.save(material);
  }

  async updateMaterial(id: string, data: Partial<Material>, tenantId: string): Promise<Material> {
    await this.materialRepository.update({ id, tenantId }, data);
    const updated = await this.findMaterialById(id, tenantId);

    // Invalidate cache
    const cacheKey = generateCacheKey('material', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteMaterial(id: string, tenantId: string): Promise<void> {
    await this.materialRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('material', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findLowStockMaterials(tenantId: string): Promise<Material[]> {
    return this.materialRepository
      .createQueryBuilder('material')
      .where('material.tenantId = :tenantId', { tenantId })
      .andWhere('material.stockQuantity <= material.reorderPoint')
      .andWhere('material.deletedAt IS NULL')
      .getMany();
  }

  // ==================== MOLDS MANAGEMENT ====================

  async findAllMolds(tenantId: string, status?: MoldStatus): Promise<Mold[]> {
    const query = this.moldRepository
      .createQueryBuilder('mold')
      .select([
        'mold.id',
        'mold.code',
        'mold.name',
        'mold.status',
        'mold.usageCount',
        'mold.maxUsageCount',
        'mold.nextMaintenanceDate',
      ])
      .where('mold.tenantId = :tenantId', { tenantId })
      .andWhere('mold.deletedAt IS NULL')
      .orderBy('mold.code', 'ASC');

    if (status) {
      query.andWhere('mold.status = :status', { status });
    }

    return query.getMany();
  }

  async findMoldById(id: string, tenantId: string): Promise<Mold> {
    const cacheKey = generateCacheKey('mold', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const mold = await this.moldRepository.findOne({ where: { id, tenantId } });
        if (!mold) {
          throw new NotFoundException(`Mold with ID ${id} not found`);
        }
        return mold;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createMold(data: Partial<Mold>, tenantId: string): Promise<Mold> {
    const mold = this.moldRepository.create({ ...data, tenantId });
    return this.moldRepository.save(mold);
  }

  async updateMold(id: string, data: Partial<Mold>, tenantId: string): Promise<Mold> {
    await this.moldRepository.update({ id, tenantId }, data);
    const updated = await this.findMoldById(id, tenantId);

    // Invalidate cache
    const cacheKey = generateCacheKey('mold', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteMold(id: string, tenantId: string): Promise<void> {
    await this.moldRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('mold', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findMoldsNeedingMaintenance(tenantId: string): Promise<Mold[]> {
    const today = new Date();
    return this.moldRepository
      .createQueryBuilder('mold')
      .where('mold.tenantId = :tenantId', { tenantId })
      .andWhere('mold.status = :status', { status: MoldStatus.ACTIVE })
      .andWhere('mold.nextMaintenanceDate <= :today', { today })
      .andWhere('mold.deletedAt IS NULL')
      .orderBy('mold.nextMaintenanceDate', 'ASC')
      .getMany();
  }

  async recordMoldUsage(id: string, tenantId: string): Promise<Mold> {
    const mold = await this.findMoldById(id, tenantId);
    mold.usageCount += 1;

    // Check if maintenance is needed
    if (mold.maxUsageCount && mold.usageCount >= mold.maxUsageCount) {
      mold.status = MoldStatus.MAINTENANCE;
    }

    const updated = await this.moldRepository.save(mold);

    // Invalidate cache
    const cacheKey = generateCacheKey('mold', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  // ==================== BOM MANAGEMENT ====================

  async findAllBoms(tenantId: string, productId?: string, status?: BomStatus): Promise<Bom[]> {
    const query = this.bomRepository
      .createQueryBuilder('bom')
      .select([
        'bom.id',
        'bom.code',
        'bom.productId',
        'bom.version',
        'bom.status',
        'bom.isDefault',
        'bom.totalMaterialCost',
        'bom.totalCost',
      ])
      .where('bom.tenantId = :tenantId', { tenantId })
      .andWhere('bom.deletedAt IS NULL')
      .orderBy('bom.code', 'ASC');

    if (productId) {
      query.andWhere('bom.productId = :productId', { productId });
    }
    if (status) {
      query.andWhere('bom.status = :status', { status });
    }

    return query.getMany();
  }

  async findBomById(id: string, tenantId: string): Promise<Bom> {
    const cacheKey = generateCacheKey('bom', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const bom = await this.bomRepository.findOne({ where: { id, tenantId } });
        if (!bom) {
          throw new NotFoundException(`BOM with ID ${id} not found`);
        }
        return bom;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createBom(data: Partial<Bom>, tenantId: string): Promise<Bom> {
    // Calculate total material cost
    let totalMaterialCost = 0;
    if (data.materialItems) {
      totalMaterialCost = data.materialItems.reduce((sum, item) => {
        return sum + (item.totalCost || 0);
      }, 0);
    }

    const bom = this.bomRepository.create({
      ...data,
      tenantId,
      totalMaterialCost,
      totalCost: totalMaterialCost + (data.laborCost || 0) + (data.overheadCost || 0),
    });

    return this.bomRepository.save(bom);
  }

  async updateBom(id: string, data: Partial<Bom>, tenantId: string): Promise<Bom> {
    // Recalculate costs if material items changed
    if (data.materialItems) {
      const totalMaterialCost = data.materialItems.reduce((sum, item) => {
        return sum + (item.totalCost || 0);
      }, 0);
      data.totalMaterialCost = totalMaterialCost;
      data.totalCost = totalMaterialCost + (data.laborCost || 0) + (data.overheadCost || 0);
    }

    await this.bomRepository.update({ id, tenantId }, data);
    const updated = await this.findBomById(id, tenantId);

    // Invalidate cache
    const cacheKey = generateCacheKey('bom', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteBom(id: string, tenantId: string): Promise<void> {
    await this.bomRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('bom', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async setDefaultBom(id: string, productId: string, tenantId: string): Promise<Bom> {
    // Unset other default BOMs for this product
    await this.bomRepository.update({ tenantId, productId, isDefault: true }, { isDefault: false });

    // Set this BOM as default
    await this.bomRepository.update({ id, tenantId }, { isDefault: true });
    const updated = await this.findBomById(id, tenantId);

    // Invalidate cache
    const cacheKey = generateCacheKey('bom', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  // ==================== WORK ORDERS MANAGEMENT ====================

  async findAllWorkOrders(tenantId: string, status?: WorkOrderStatus): Promise<WorkOrder[]> {
    const query = this.workOrderRepository
      .createQueryBuilder('workOrder')
      .select([
        'workOrder.id',
        'workOrder.orderNumber',
        'workOrder.productId',
        'workOrder.status',
        'workOrder.quantityPlanned',
        'workOrder.quantityProduced',
        'workOrder.completionPercentage',
        'workOrder.plannedStartDate',
        'workOrder.plannedEndDate',
        'workOrder.actualStartDate',
        'workOrder.createdAt',
      ])
      .where('workOrder.tenantId = :tenantId', { tenantId })
      .andWhere('workOrder.deletedAt IS NULL')
      .orderBy('workOrder.createdAt', 'DESC');

    if (status) {
      query.andWhere('workOrder.status = :status', { status });
    }

    return query.getMany();
  }

  async findWorkOrderById(id: string, tenantId: string): Promise<WorkOrder> {
    const cacheKey = generateCacheKey('workorder', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const workOrder = await this.workOrderRepository.findOne({ where: { id, tenantId } });
        if (!workOrder) {
          throw new NotFoundException(`Work Order with ID ${id} not found`);
        }
        return workOrder;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createWorkOrder(data: Partial<WorkOrder>, tenantId: string): Promise<WorkOrder> {
    // Generate order number if not provided
    if (!data.orderNumber) {
      const count = await this.workOrderRepository.count({ where: { tenantId } });
      data.orderNumber = `WO-${String(count + 1).padStart(6, '0')}`;
    }

    const workOrder = this.workOrderRepository.create({ ...data, tenantId });
    return this.workOrderRepository.save(workOrder);
  }

  async updateWorkOrder(
    id: string,
    data: Partial<WorkOrder>,
    tenantId: string,
  ): Promise<WorkOrder> {
    await this.workOrderRepository.update({ id, tenantId }, data);
    const updated = await this.findWorkOrderById(id, tenantId);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteWorkOrder(id: string, tenantId: string): Promise<void> {
    await this.workOrderRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async startWorkOrder(id: string, tenantId: string): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, tenantId);

    if (
      workOrder.status !== WorkOrderStatus.READY &&
      workOrder.status !== WorkOrderStatus.PLANNED
    ) {
      throw new Error('Work order must be in READY or PLANNED status to start');
    }

    workOrder.status = WorkOrderStatus.IN_PROGRESS;
    workOrder.actualStartDate = new Date();

    const updated = await this.workOrderRepository.save(workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async completeWorkOrder(id: string, tenantId: string): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, tenantId);

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new Error('Work order must be in IN_PROGRESS status to complete');
    }

    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.actualEndDate = new Date();
    workOrder.completionPercentage = 100;

    const updated = await this.workOrderRepository.save(workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async pauseWorkOrder(id: string, tenantId: string, reason?: string): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, tenantId);

    if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new Error('Work order must be in IN_PROGRESS status to pause');
    }

    workOrder.status = WorkOrderStatus.PAUSED;
    if (reason) {
      workOrder.notes = (workOrder.notes || '') + `\nPaused: ${reason}`;
    }

    const updated = await this.workOrderRepository.save(workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async resumeWorkOrder(id: string, tenantId: string): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, tenantId);

    if (workOrder.status !== WorkOrderStatus.PAUSED) {
      throw new Error('Work order must be in PAUSED status to resume');
    }

    workOrder.status = WorkOrderStatus.IN_PROGRESS;

    const updated = await this.workOrderRepository.save(workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async updateWorkOrderProgress(
    id: string,
    quantityProduced: number,
    quantityRejected: number,
    tenantId: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.findWorkOrderById(id, tenantId);

    workOrder.quantityProduced = quantityProduced;
    workOrder.quantityRejected = quantityRejected;
    workOrder.completionPercentage = (quantityProduced / workOrder.quantityPlanned) * 100;

    const updated = await this.workOrderRepository.save(workOrder);

    // Invalidate cache
    const cacheKey = generateCacheKey('workorder', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  // ==================== QUALITY CHECKS MANAGEMENT ====================

  async findAllQualityChecks(tenantId: string, workOrderId?: string): Promise<QualityCheck[]> {
    const query = this.qualityCheckRepository
      .createQueryBuilder('qualityCheck')
      .select([
        'qualityCheck.id',
        'qualityCheck.checkNumber',
        'qualityCheck.workOrderId',
        'qualityCheck.checkDate',
        'qualityCheck.result',
        'qualityCheck.quantityChecked',
        'qualityCheck.quantityPassed',
        'qualityCheck.quantityFailed',
        'qualityCheck.checkedBy',
      ])
      .where('qualityCheck.tenantId = :tenantId', { tenantId })
      .andWhere('qualityCheck.deletedAt IS NULL')
      .orderBy('qualityCheck.checkDate', 'DESC');

    if (workOrderId) {
      query.andWhere('qualityCheck.workOrderId = :workOrderId', { workOrderId });
    }

    return query.getMany();
  }

  async findQualityCheckById(id: string, tenantId: string): Promise<QualityCheck> {
    const cacheKey = generateCacheKey('qualitycheck', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const check = await this.qualityCheckRepository.findOne({ where: { id, tenantId } });
        if (!check) {
          throw new NotFoundException(`Quality Check with ID ${id} not found`);
        }
        return check;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createQualityCheck(data: Partial<QualityCheck>, tenantId: string): Promise<QualityCheck> {
    // Generate check number if not provided
    if (!data.checkNumber) {
      const count = await this.qualityCheckRepository.count({ where: { tenantId } });
      data.checkNumber = `QC-${String(count + 1).padStart(6, '0')}`;
    }

    // Calculate quantities based on result
    if (data.result === QualityCheckResult.PASSED) {
      data.quantityPassed = data.quantityChecked;
      data.quantityFailed = 0;
    } else if (data.result === QualityCheckResult.FAILED) {
      data.quantityPassed = 0;
      data.quantityFailed = data.quantityChecked;
    }

    const check = this.qualityCheckRepository.create({ ...data, tenantId });
    return this.qualityCheckRepository.save(check);
  }

  async updateQualityCheck(
    id: string,
    data: Partial<QualityCheck>,
    tenantId: string,
  ): Promise<QualityCheck> {
    await this.qualityCheckRepository.update({ id, tenantId }, data);
    const updated = await this.findQualityCheckById(id, tenantId);

    // Invalidate cache
    const cacheKey = generateCacheKey('qualitycheck', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteQualityCheck(id: string, tenantId: string): Promise<void> {
    await this.qualityCheckRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('qualitycheck', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async approveQualityCheck(
    id: string,
    approvedBy: string,
    tenantId: string,
  ): Promise<QualityCheck> {
    const check = await this.findQualityCheckById(id, tenantId);

    check.approvedBy = approvedBy;
    check.approvedAt = new Date();

    const updated = await this.qualityCheckRepository.save(check);

    // Invalidate cache
    const cacheKey = generateCacheKey('qualitycheck', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async getQualityStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    const query = this.qualityCheckRepository
      .createQueryBuilder('qc')
      .where('qc.tenantId = :tenantId', { tenantId })
      .andWhere('qc.deletedAt IS NULL');

    if (startDate) {
      query.andWhere('qc.checkDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('qc.checkDate <= :endDate', { endDate });
    }

    const checks = await query.getMany();

    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.result === QualityCheckResult.PASSED).length;
    const failedChecks = checks.filter((c) => c.result === QualityCheckResult.FAILED).length;
    const conditionalChecks = checks.filter(
      (c) => c.result === QualityCheckResult.CONDITIONAL,
    ).length;

    const totalQuantityChecked = checks.reduce((sum, c) => sum + Number(c.quantityChecked), 0);
    const totalQuantityPassed = checks.reduce((sum, c) => sum + Number(c.quantityPassed), 0);
    const totalQuantityFailed = checks.reduce((sum, c) => sum + Number(c.quantityFailed), 0);

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

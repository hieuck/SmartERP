import { db, BOM, WorkOrder, ProductionPlan } from '@/lib/offline/db';
import { BaseOfflineService } from './base-offline.service';

/**
 * BOM (Bill of Materials) offline service
 */
export class BOMOfflineService extends BaseOfflineService<BOM> {
  constructor() {
    super(db.boms, 'boms');
  }

  async getByBomNumber(bomNumber: string): Promise<BOM | undefined> {
    return db.boms.where('bomNumber').equals(bomNumber).first();
  }

  async getByProduct(productId: string): Promise<BOM[]> {
    return db.boms.where('productId').equals(productId).toArray();
  }

  async getActive(): Promise<BOM[]> {
    const all = await db.boms.toArray();
    return all.filter((bom) => bom.isActive);
  }
}

/**
 * Work Order offline service
 */
export class WorkOrderOfflineService extends BaseOfflineService<WorkOrder> {
  constructor() {
    super(db.workOrders, 'workOrders');
  }

  async getByWorkOrderNumber(workOrderNumber: string): Promise<WorkOrder | undefined> {
    return db.workOrders.where('workOrderNumber').equals(workOrderNumber).first();
  }

  async getByBom(bomId: string): Promise<WorkOrder[]> {
    return db.workOrders.where('bomId').equals(bomId).toArray();
  }

  async getByProduct(productId: string): Promise<WorkOrder[]> {
    return db.workOrders.where('productId').equals(productId).toArray();
  }

  async getByStatus(status: string): Promise<WorkOrder[]> {
    return db.workOrders.where('status').equals(status).toArray();
  }

  async getInProgress(): Promise<WorkOrder[]> {
    return db.workOrders.where('status').equals('in_progress').toArray();
  }
}

/**
 * Production Plan offline service
 */
export class ProductionPlanOfflineService extends BaseOfflineService<ProductionPlan> {
  constructor() {
    super(db.productionPlans, 'productionPlans');
  }

  async getByPlanNumber(planNumber: string): Promise<ProductionPlan | undefined> {
    return db.productionPlans.where('planNumber').equals(planNumber).first();
  }

  async getByStatus(status: string): Promise<ProductionPlan[]> {
    return db.productionPlans.where('status').equals(status).toArray();
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<ProductionPlan[]> {
    return db.productionPlans
      .where('startDate')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getActive(): Promise<ProductionPlan[]> {
    const now = new Date();
    const all = await db.productionPlans.toArray();
    return all.filter(plan => 
      new Date(plan.startDate) <= now && 
      new Date(plan.endDate) >= now &&
      (plan.status === 'approved' || plan.status === 'in_progress')
    );
  }
}

// Export singleton instances
export const bomOfflineService = new BOMOfflineService();
export const workOrderOfflineService = new WorkOrderOfflineService();
export const productionPlanOfflineService = new ProductionPlanOfflineService();

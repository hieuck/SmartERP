import { db, StockAdjustment, StockTransfer, BinLocation } from '@/lib/offline/db';
import { BaseOfflineService } from './base-offline.service';

/**
 * Stock Adjustment offline service
 */
export class StockAdjustmentOfflineService extends BaseOfflineService<StockAdjustment> {
  constructor() {
    super(db.stockAdjustments, 'stockAdjustments');
  }

  async getByAdjustmentNumber(adjustmentNumber: string): Promise<StockAdjustment | undefined> {
    return db.stockAdjustments.where('adjustmentNumber').equals(adjustmentNumber).first();
  }

  async getByWarehouse(warehouseId: string): Promise<StockAdjustment[]> {
    return db.stockAdjustments.where('warehouseId').equals(warehouseId).toArray();
  }

  async getByStatus(status: string): Promise<StockAdjustment[]> {
    return db.stockAdjustments.where('status').equals(status).toArray();
  }

  async getByType(adjustmentType: string): Promise<StockAdjustment[]> {
    const all = await db.stockAdjustments.toArray();
    return all.filter(adj => adj.adjustmentType === adjustmentType);
  }
}

/**
 * Stock Transfer offline service
 */
export class StockTransferOfflineService extends BaseOfflineService<StockTransfer> {
  constructor() {
    super(db.stockTransfers, 'stockTransfers');
  }

  async getByTransferNumber(transferNumber: string): Promise<StockTransfer | undefined> {
    return db.stockTransfers.where('transferNumber').equals(transferNumber).first();
  }

  async getByFromWarehouse(fromWarehouseId: string): Promise<StockTransfer[]> {
    return db.stockTransfers.where('fromWarehouseId').equals(fromWarehouseId).toArray();
  }

  async getByToWarehouse(toWarehouseId: string): Promise<StockTransfer[]> {
    return db.stockTransfers.where('toWarehouseId').equals(toWarehouseId).toArray();
  }

  async getByStatus(status: string): Promise<StockTransfer[]> {
    return db.stockTransfers.where('status').equals(status).toArray();
  }
}

/**
 * Bin Location offline service
 */
export class BinLocationOfflineService extends BaseOfflineService<BinLocation> {
  constructor() {
    super(db.binLocations, 'binLocations');
  }

  async getByBinCode(binCode: string): Promise<BinLocation | undefined> {
    return db.binLocations.where('binCode').equals(binCode).first();
  }

  async getByWarehouse(warehouseId: string): Promise<BinLocation[]> {
    return db.binLocations.where('warehouseId').equals(warehouseId).toArray();
  }

  async getActive(): Promise<BinLocation[]> {
    return db.binLocations.where('isActive').equals(1).toArray();
  }

  async getAvailable(): Promise<BinLocation[]> {
    const all = await db.binLocations.toArray();
    return all.filter(bin => 
      bin.isActive && 
      bin.capacity && 
      bin.currentOccupancy !== undefined &&
      bin.currentOccupancy < bin.capacity
    );
  }
}

// Export singleton instances
export const stockAdjustmentOfflineService = new StockAdjustmentOfflineService();
export const stockTransferOfflineService = new StockTransferOfflineService();
export const binLocationOfflineService = new BinLocationOfflineService();

import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeEqualsChain = <T>(result: T) => ({
  equals: vi.fn(() => ({
    first: vi.fn(async () => (Array.isArray(result) ? result[0] : result)),
    toArray: vi.fn(async () => (Array.isArray(result) ? result : [result])),
  })),
});

const stockAdjustmentsWhere = vi.fn();
const stockAdjustmentsToArray = vi.fn();
const stockTransfersWhere = vi.fn();
const binLocationsWhere = vi.fn();
const binLocationsToArray = vi.fn();

vi.mock('@/lib/offline/db', () => ({
  db: {
    stockAdjustments: {
      where: stockAdjustmentsWhere,
      toArray: stockAdjustmentsToArray,
    },
    stockTransfers: {
      where: stockTransfersWhere,
    },
    binLocations: {
      where: binLocationsWhere,
      toArray: binLocationsToArray,
    },
  },
}));

vi.mock('./base-offline.service', () => ({
  BaseOfflineService: class {
    constructor(_table: unknown, _endpoint: string) {}
  },
}));

describe('inventory offline services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries stock adjustments by number, warehouse, and status and filters by type', async () => {
    const adjustment = { id: 'adj-1', adjustmentNumber: 'ADJ-001' };
    const adjustments = [adjustment];
    stockAdjustmentsWhere
      .mockReturnValueOnce(makeEqualsChain(adjustment))
      .mockReturnValueOnce(makeEqualsChain(adjustments))
      .mockReturnValueOnce(makeEqualsChain(adjustments));
    stockAdjustmentsToArray.mockResolvedValue([
      { id: 'adj-1', adjustmentType: 'damage' },
      { id: 'adj-2', adjustmentType: 'count' },
    ]);

    const { stockAdjustmentOfflineService } = await import('./inventory-offline.service');

    const byNumber = await stockAdjustmentOfflineService.getByAdjustmentNumber('ADJ-001');
    const byWarehouse = await stockAdjustmentOfflineService.getByWarehouse('wh-1');
    const byStatus = await stockAdjustmentOfflineService.getByStatus('draft');
    const byType = await stockAdjustmentOfflineService.getByType('damage');

    expect(stockAdjustmentsWhere).toHaveBeenNthCalledWith(1, 'adjustmentNumber');
    expect(stockAdjustmentsWhere).toHaveBeenNthCalledWith(2, 'warehouseId');
    expect(stockAdjustmentsWhere).toHaveBeenNthCalledWith(3, 'status');
    expect(byNumber).toEqual(adjustment);
    expect(byWarehouse).toEqual(adjustments);
    expect(byStatus).toEqual(adjustments);
    expect(byType).toEqual([{ id: 'adj-1', adjustmentType: 'damage' }]);
  });

  it('queries stock transfers by number, source, destination, and status', async () => {
    const transfer = { id: 'tr-1', transferNumber: 'TR-001' };
    const transfers = [transfer];
    stockTransfersWhere
      .mockReturnValueOnce(makeEqualsChain(transfer))
      .mockReturnValueOnce(makeEqualsChain(transfers))
      .mockReturnValueOnce(makeEqualsChain(transfers))
      .mockReturnValueOnce(makeEqualsChain(transfers));

    const { stockTransferOfflineService } = await import('./inventory-offline.service');

    const byNumber = await stockTransferOfflineService.getByTransferNumber('TR-001');
    const byFrom = await stockTransferOfflineService.getByFromWarehouse('wh-1');
    const byTo = await stockTransferOfflineService.getByToWarehouse('wh-2');
    const byStatus = await stockTransferOfflineService.getByStatus('pending');

    expect(stockTransfersWhere).toHaveBeenNthCalledWith(1, 'transferNumber');
    expect(stockTransfersWhere).toHaveBeenNthCalledWith(2, 'fromWarehouseId');
    expect(stockTransfersWhere).toHaveBeenNthCalledWith(3, 'toWarehouseId');
    expect(stockTransfersWhere).toHaveBeenNthCalledWith(4, 'status');
    expect(byNumber).toEqual(transfer);
    expect(byFrom).toEqual(transfers);
    expect(byTo).toEqual(transfers);
    expect(byStatus).toEqual(transfers);
  });

  it('queries bin locations and filters available bins in memory', async () => {
    const bin = { id: 'bin-1', binCode: 'A-01' };
    const bins = [bin];
    binLocationsWhere
      .mockReturnValueOnce(makeEqualsChain(bin))
      .mockReturnValueOnce(makeEqualsChain(bins));
    binLocationsToArray.mockResolvedValue([
      { id: 'bin-1', isActive: true, capacity: 100, currentOccupancy: 50 },
      { id: 'bin-2', isActive: true, capacity: 100, currentOccupancy: 100 },
      { id: 'bin-3', isActive: false, capacity: 100, currentOccupancy: 20 },
    ]);

    const { binLocationOfflineService } = await import('./inventory-offline.service');

    const byCode = await binLocationOfflineService.getByBinCode('A-01');
    const byWarehouse = await binLocationOfflineService.getByWarehouse('wh-1');
    const active = await binLocationOfflineService.getActive();
    const available = await binLocationOfflineService.getAvailable();

    expect(binLocationsWhere).toHaveBeenNthCalledWith(1, 'binCode');
    expect(binLocationsWhere).toHaveBeenNthCalledWith(2, 'warehouseId');
    expect(byCode).toEqual(bin);
    expect(byWarehouse).toEqual(bins);
    expect(active).toEqual([
      { id: 'bin-1', isActive: true, capacity: 100, currentOccupancy: 50 },
      { id: 'bin-2', isActive: true, capacity: 100, currentOccupancy: 100 },
    ]);
    expect(available).toEqual([{ id: 'bin-1', isActive: true, capacity: 100, currentOccupancy: 50 }]);
  });
});

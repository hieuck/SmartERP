import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeEqualsChain = <T>(result: T) => ({
  equals: vi.fn(() => ({
    first: vi.fn(async () => (Array.isArray(result) ? result[0] : result)),
    toArray: vi.fn(async () => (Array.isArray(result) ? result : [result])),
  })),
  between: vi.fn(() => ({
    toArray: vi.fn(async () => (Array.isArray(result) ? result : [result])),
  })),
});

const bomsWhere = vi.fn();
const bomsToArray = vi.fn();
const workOrdersWhere = vi.fn();
const productionPlansWhere = vi.fn();
const productionPlansToArray = vi.fn();

vi.mock('@/lib/offline/db', () => ({
  db: {
    boms: {
      where: bomsWhere,
      toArray: bomsToArray,
    },
    workOrders: {
      where: workOrdersWhere,
    },
    productionPlans: {
      where: productionPlansWhere,
      toArray: productionPlansToArray,
    },
  },
}));

vi.mock('./base-offline.service', () => ({
  BaseOfflineService: class {
    constructor(_table: unknown, _endpoint: string) {}
  },
}));

describe('manufacturing offline services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries BOMs by number, product, and active status', async () => {
    const bom = { id: 'bom-1', bomNumber: 'BOM-001' };
    const boms = [bom];
    bomsWhere.mockReturnValueOnce(makeEqualsChain(bom)).mockReturnValueOnce(makeEqualsChain(boms));
    bomsToArray.mockResolvedValueOnce([
      { id: 'bom-1', bomNumber: 'BOM-001', isActive: true },
      { id: 'bom-2', bomNumber: 'BOM-002', isActive: false },
    ]);

    const { bomOfflineService } = await import('./manufacturing-offline.service');

    const byNumber = await bomOfflineService.getByBomNumber('BOM-001');
    const byProduct = await bomOfflineService.getByProduct('prod-1');
    const active = await bomOfflineService.getActive();

    expect(bomsWhere).toHaveBeenNthCalledWith(1, 'bomNumber');
    expect(bomsWhere).toHaveBeenNthCalledWith(2, 'productId');
    expect(byNumber).toEqual(bom);
    expect(byProduct).toEqual(boms);
    expect(active).toEqual([{ id: 'bom-1', bomNumber: 'BOM-001', isActive: true }]);
  });

  it('queries work orders by dimensions and in-progress state', async () => {
    const order = { id: 'wo-1', workOrderNumber: 'WO-001' };
    const orders = [order];
    workOrdersWhere
      .mockReturnValueOnce(makeEqualsChain(order))
      .mockReturnValueOnce(makeEqualsChain(orders))
      .mockReturnValueOnce(makeEqualsChain(orders))
      .mockReturnValueOnce(makeEqualsChain(orders))
      .mockReturnValueOnce(makeEqualsChain(orders));

    const { workOrderOfflineService } = await import('./manufacturing-offline.service');

    const byNumber = await workOrderOfflineService.getByWorkOrderNumber('WO-001');
    const byBom = await workOrderOfflineService.getByBom('bom-1');
    const byProduct = await workOrderOfflineService.getByProduct('prod-1');
    const byStatus = await workOrderOfflineService.getByStatus('ready');
    const inProgress = await workOrderOfflineService.getInProgress();

    expect(workOrdersWhere).toHaveBeenNthCalledWith(1, 'workOrderNumber');
    expect(workOrdersWhere).toHaveBeenNthCalledWith(2, 'bomId');
    expect(workOrdersWhere).toHaveBeenNthCalledWith(3, 'productId');
    expect(workOrdersWhere).toHaveBeenNthCalledWith(4, 'status');
    expect(workOrdersWhere).toHaveBeenNthCalledWith(5, 'status');
    expect(byNumber).toEqual(order);
    expect(byBom).toEqual(orders);
    expect(byProduct).toEqual(orders);
    expect(byStatus).toEqual(orders);
    expect(inProgress).toEqual(orders);
  });

  it('queries production plans and filters active plans in memory', async () => {
    const plan = { id: 'plan-1', planNumber: 'PLAN-001' };
    const plans = [plan];
    const now = new Date();
    const past = new Date(now.getTime() - 86400000).toISOString();
    const future = new Date(now.getTime() + 86400000).toISOString();
    productionPlansWhere
      .mockReturnValueOnce(makeEqualsChain(plan))
      .mockReturnValueOnce(makeEqualsChain(plans))
      .mockReturnValueOnce(makeEqualsChain(plans));
    productionPlansToArray.mockResolvedValue([
      { id: 'plan-1', startDate: past, endDate: future, status: 'approved' },
      { id: 'plan-2', startDate: past, endDate: future, status: 'draft' },
    ]);

    const { productionPlanOfflineService } = await import('./manufacturing-offline.service');

    const byNumber = await productionPlanOfflineService.getByPlanNumber('PLAN-001');
    const byStatus = await productionPlanOfflineService.getByStatus('approved');
    const byDate = await productionPlanOfflineService.getByDateRange(
      new Date('2026-03-01'),
      new Date('2026-03-31'),
    );
    const active = await productionPlanOfflineService.getActive();

    expect(productionPlansWhere).toHaveBeenNthCalledWith(1, 'planNumber');
    expect(productionPlansWhere).toHaveBeenNthCalledWith(2, 'status');
    expect(productionPlansWhere).toHaveBeenNthCalledWith(3, 'startDate');
    expect(byNumber).toEqual(plan);
    expect(byStatus).toEqual(plans);
    expect(byDate).toEqual(plans);
    expect(active).toEqual([{ id: 'plan-1', startDate: past, endDate: future, status: 'approved' }]);
  });
});

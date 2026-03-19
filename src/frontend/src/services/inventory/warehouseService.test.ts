import warehouseService from './warehouseService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('warehouseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles warehouse CRUD with versioned inventory endpoints', async () => {
    const warehouses = [{ id: 'wh-1', code: 'HCM', name: 'Ho Chi Minh' }];
    const warehouse = { id: 'wh-1', code: 'HCM', name: 'Ho Chi Minh' };
    const created = { id: 'wh-2', code: 'HN', name: 'Ha Noi' };
    const updated = { id: 'wh-1', name: 'HCM Updated' };
    const deleted = { success: true };
    mockApiGet.mockResolvedValueOnce({ data: warehouses });
    mockApiGet.mockResolvedValueOnce({ data: warehouse });
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: deleted });

    const listResult = await warehouseService.getWarehouses({ status: 'active', search: 'HCM' });
    const singleResult = await warehouseService.getWarehouse('wh-1');
    const createResult = await warehouseService.createWarehouse({ code: 'HN', name: 'Ha Noi' });
    const updateResult = await warehouseService.updateWarehouse('wh-1', { name: 'HCM Updated' });
    const deleteResult = await warehouseService.deleteWarehouse('wh-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/inventory/warehouses', {
      params: { status: 'active', search: 'HCM' },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/inventory/warehouses/wh-1');
    expect(api.post).toHaveBeenCalledWith('/api/v1/inventory/warehouses', {
      code: 'HN',
      name: 'Ha Noi',
    });
    expect(api.put).toHaveBeenCalledWith('/api/v1/inventory/warehouses/wh-1', {
      name: 'HCM Updated',
    });
    expect(api.delete).toHaveBeenCalledWith('/api/v1/inventory/warehouses/wh-1');
    expect(listResult).toEqual(warehouses);
    expect(singleResult).toEqual(warehouse);
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
    expect(deleteResult).toEqual(deleted);
  });

  it('gets stock by warehouse and consolidated stock', async () => {
    const stock = { data: [{ warehouseId: 'wh-1', productId: 'prod-1', quantity: 10 }] };
    const consolidated = { data: [{ productId: 'prod-1', quantity: 25 }] };
    mockApiGet.mockResolvedValueOnce({ data: stock });
    mockApiGet.mockResolvedValueOnce({ data: consolidated });

    const stockResult = await warehouseService.getStockByWarehouse('wh-1', {
      search: 'laptop',
      page: 1,
      limit: 20,
    });
    const consolidatedResult = await warehouseService.getConsolidatedStock({
      search: 'laptop',
      page: 2,
      limit: 10,
    });

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/inventory/warehouses/wh-1/stock', {
      params: { search: 'laptop', page: 1, limit: 20 },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/inventory/stock/consolidated', {
      params: { search: 'laptop', page: 2, limit: 10 },
    });
    expect(stockResult).toEqual(stock);
    expect(consolidatedResult).toEqual(consolidated);
  });

  it('handles stock transfer lifecycle', async () => {
    const transfers = { data: [{ id: 'tr-1', code: 'TR-001', status: 'pending' }] };
    const transfer = { id: 'tr-1', code: 'TR-001', status: 'draft' };
    const created = { id: 'tr-2', code: 'TR-002', status: 'draft' };
    const updated = { id: 'tr-1', notes: 'Urgent transfer' };
    const approved = { id: 'tr-1', status: 'in_transit' };
    const cancelled = { id: 'tr-1', status: 'cancelled' };
    mockApiGet.mockResolvedValueOnce({ data: transfers });
    mockApiGet.mockResolvedValueOnce({ data: transfer });
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiPost.mockResolvedValueOnce({ data: approved });
    mockApiPost.mockResolvedValueOnce({ data: cancelled });

    const listResult = await warehouseService.getStockTransfers({
      status: 'pending',
      fromWarehouseId: 'wh-1',
      page: 1,
      limit: 10,
    });
    const singleResult = await warehouseService.getStockTransfer('tr-1');
    const createResult = await warehouseService.createStockTransfer({
      fromWarehouseId: 'wh-1',
      toWarehouseId: 'wh-2',
      items: [{ id: 'item-1', productId: 'prod-1', quantity: 5 }],
    });
    const updateResult = await warehouseService.updateStockTransfer('tr-1', {
      notes: 'Urgent transfer',
    });
    const approveResult = await warehouseService.approveStockTransfer('tr-1');
    const cancelResult = await warehouseService.cancelStockTransfer('tr-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/inventory/transfers', {
      params: { status: 'pending', fromWarehouseId: 'wh-1', page: 1, limit: 10 },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/inventory/transfers/tr-1');
    expect(api.post).toHaveBeenNthCalledWith(1, '/api/v1/inventory/transfers', {
      fromWarehouseId: 'wh-1',
      toWarehouseId: 'wh-2',
      items: [{ id: 'item-1', productId: 'prod-1', quantity: 5 }],
    });
    expect(api.put).toHaveBeenCalledWith('/api/v1/inventory/transfers/tr-1', {
      notes: 'Urgent transfer',
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/api/v1/inventory/transfers/tr-1/approve');
    expect(api.post).toHaveBeenNthCalledWith(3, '/api/v1/inventory/transfers/tr-1/cancel');
    expect(listResult).toEqual(transfers);
    expect(singleResult).toEqual(transfer);
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
    expect(approveResult).toEqual(approved);
    expect(cancelResult).toEqual(cancelled);
  });

  it('gets warehouse reports from reporting endpoints', async () => {
    const warehouseReport = { summary: { totalItems: 10 } };
    const consolidatedReport = { summary: { totalWarehouses: 3 } };
    mockApiGet.mockResolvedValueOnce({ data: warehouseReport });
    mockApiGet.mockResolvedValueOnce({ data: consolidatedReport });

    const warehouseResult = await warehouseService.getWarehouseStockReport('wh-1', {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });
    const consolidatedResult = await warehouseService.getConsolidatedStockReport({
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/reports/warehouses/wh-1/stock', {
      params: { startDate: '2026-03-01', endDate: '2026-03-31' },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/reports/warehouses/consolidated', {
      params: { startDate: '2026-03-01', endDate: '2026-03-31' },
    });
    expect(warehouseResult).toEqual(warehouseReport);
    expect(consolidatedResult).toEqual(consolidatedReport);
  });
});

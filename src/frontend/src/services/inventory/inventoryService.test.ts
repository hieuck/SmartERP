import inventoryService, {
  StockMovementType,
  type CreateInventoryDto,
  type StockMovementDto,
  type UpdateInventoryDto,
} from './inventoryService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('inventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets inventory with query params', async () => {
    const params = { page: 1, limit: 20, warehouseId: 'wh-1', lowStock: true };
    const response = { data: [{ id: 'inv-1', quantity: 5 }], meta: { total: 1 } };
    mockApiGet.mockResolvedValue({ data: response });

    const result = await inventoryService.getAll(params);

    expect(api.get).toHaveBeenCalledWith('/inventory', { params });
    expect(result).toEqual(response);
  });

  it('gets inventory and stock receipts by id', async () => {
    const inventory = { id: 'inv-1', productId: 'prod-1', quantity: 10 };
    const receipt = { id: 'receipt-1', receiptNumber: 'SR-001', warehouseId: 'wh-1' };
    mockApiGet.mockResolvedValueOnce({ data: inventory });
    mockApiGet.mockResolvedValueOnce({ data: receipt });

    const inventoryResult = await inventoryService.getById('inv-1');
    const receiptResult = await inventoryService.getStockReceipt('receipt-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/inventory/inv-1');
    expect(api.get).toHaveBeenNthCalledWith(2, '/inventory/stock-receipts/receipt-1');
    expect(inventoryResult).toEqual(inventory);
    expect(receiptResult).toEqual(receipt);
  });

  it('creates and updates stock receipts', async () => {
    const createPayload = {
      warehouseId: 'wh-1',
      supplierId: 'sup-1',
      items: [{ productId: 'prod-1', quantity: 5, unitPrice: 20 }],
    };
    const updatePayload = { status: 'received' as const };
    const created = { id: 'receipt-1', receiptNumber: 'SR-001', ...createPayload };
    const updated = { id: 'receipt-1', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });

    const createdResult = await inventoryService.createStockReceipt(createPayload);
    const updatedResult = await inventoryService.updateStockReceipt('receipt-1', updatePayload);

    expect(api.post).toHaveBeenNthCalledWith(1, '/inventory/stock-receipts', createPayload);
    expect(api.put).toHaveBeenNthCalledWith(1, '/inventory/stock-receipts/receipt-1', updatePayload);
    expect(createdResult).toEqual(created);
    expect(updatedResult).toEqual(updated);
  });

  it('creates, updates, and deletes inventory records', async () => {
    const createPayload: CreateInventoryDto = {
      productId: 'prod-1',
      warehouseId: 'wh-1',
      quantity: 50,
      minQuantity: 10,
    };
    const updatePayload: UpdateInventoryDto = { quantity: 45, maxQuantity: 100 };
    const created = { id: 'inv-1', ...createPayload };
    const updated = { id: 'inv-1', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const createdResult = await inventoryService.create(createPayload);
    const updatedResult = await inventoryService.update('inv-1', updatePayload);
    await inventoryService.delete('inv-1');

    expect(api.post).toHaveBeenNthCalledWith(1, '/inventory', createPayload);
    expect(api.put).toHaveBeenNthCalledWith(1, '/inventory/inv-1', updatePayload);
    expect(api.delete).toHaveBeenCalledWith('/inventory/inv-1');
    expect(createdResult).toEqual(created);
    expect(updatedResult).toEqual(updated);
  });

  it('gets low stock items and inventory by product and warehouse', async () => {
    const lowStock = [{ productId: 'prod-1', currentQuantity: 2, minQuantity: 10 }];
    const byProduct = [{ id: 'inv-1', productId: 'prod-1' }];
    const byWarehouse = [{ id: 'inv-2', warehouseId: 'wh-1' }];
    mockApiGet.mockResolvedValueOnce({ data: lowStock });
    mockApiGet.mockResolvedValueOnce({ data: byProduct });
    mockApiGet.mockResolvedValueOnce({ data: byWarehouse });

    const lowStockResult = await inventoryService.getLowStock();
    const byProductResult = await inventoryService.getByProduct('prod-1');
    const byWarehouseResult = await inventoryService.getByWarehouse('wh-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/inventory/low-stock');
    expect(api.get).toHaveBeenNthCalledWith(2, '/inventory/product/prod-1');
    expect(api.get).toHaveBeenNthCalledWith(3, '/inventory/warehouse/wh-1');
    expect(lowStockResult).toEqual(lowStock);
    expect(byProductResult).toEqual(byProduct);
    expect(byWarehouseResult).toEqual(byWarehouse);
  });

  it('creates and lists stock movements', async () => {
    const payload: StockMovementDto = {
      productId: 'prod-1',
      warehouseId: 'wh-1',
      type: StockMovementType.IN,
      quantity: 20,
      reference: 'PO-001',
    };
    const movement = { id: 'mov-1', ...payload };
    const movements = { data: [movement], meta: { total: 1 } };
    const params = { page: 1, limit: 10, type: StockMovementType.IN };
    mockApiPost.mockResolvedValueOnce({ data: movement });
    mockApiGet.mockResolvedValueOnce({ data: movements });

    const created = await inventoryService.createMovement(payload);
    const listed = await inventoryService.getMovements(params);

    expect(api.post).toHaveBeenNthCalledWith(1, '/inventory/movements', payload);
    expect(api.get).toHaveBeenNthCalledWith(1, '/inventory/movements', { params });
    expect(created).toEqual(movement);
    expect(listed).toEqual(movements);
  });

  it('handles stock in, stock out, transfer, and adjustment operations', async () => {
    const stockInResult = { id: 'mov-1', type: StockMovementType.IN };
    const stockOutResult = { id: 'mov-2', type: StockMovementType.OUT };
    const transferResult = { id: 'mov-3', type: StockMovementType.TRANSFER };
    const adjustResult = { id: 'mov-4', type: StockMovementType.ADJUSTMENT };
    mockApiPost.mockResolvedValueOnce({ data: stockInResult });
    mockApiPost.mockResolvedValueOnce({ data: stockOutResult });
    mockApiPost.mockResolvedValueOnce({ data: transferResult });
    mockApiPost.mockResolvedValueOnce({ data: adjustResult });

    const stockIn = await inventoryService.stockIn('prod-1', 'wh-1', 10, 'PO-001', 'Receive goods');
    const stockOut = await inventoryService.stockOut(
      'prod-1',
      'wh-1',
      4,
      'SO-001',
      'Ship goods',
    );
    const transfer = await inventoryService.transfer('prod-1', 'wh-1', 'wh-2', 3, 'Rebalance');
    const adjust = await inventoryService.adjust('prod-1', 'wh-1', -2, 'Damaged goods');

    expect(api.post).toHaveBeenNthCalledWith(1, '/inventory/stock-in', {
      productId: 'prod-1',
      warehouseId: 'wh-1',
      quantity: 10,
      reference: 'PO-001',
      notes: 'Receive goods',
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/inventory/stock-out', {
      productId: 'prod-1',
      warehouseId: 'wh-1',
      quantity: 4,
      reference: 'SO-001',
      notes: 'Ship goods',
    });
    expect(api.post).toHaveBeenNthCalledWith(3, '/inventory/transfer', {
      productId: 'prod-1',
      fromWarehouseId: 'wh-1',
      toWarehouseId: 'wh-2',
      quantity: 3,
      notes: 'Rebalance',
    });
    expect(api.post).toHaveBeenNthCalledWith(4, '/inventory/adjust', {
      productId: 'prod-1',
      warehouseId: 'wh-1',
      quantity: -2,
      reason: 'Damaged goods',
    });
    expect(stockIn).toEqual(stockInResult);
    expect(stockOut).toEqual(stockOutResult);
    expect(transfer).toEqual(transferResult);
    expect(adjust).toEqual(adjustResult);
  });
});

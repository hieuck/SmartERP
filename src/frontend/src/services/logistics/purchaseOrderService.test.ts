import purchaseOrderService, {
  PurchaseOrderStatus,
  type CreatePurchaseOrderDto,
  type ReceiveItemsDto,
  type UpdatePurchaseOrderDto,
} from './purchaseOrderService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('purchaseOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets purchase orders with query params and by id', async () => {
    const params = { page: 1, limit: 20, status: PurchaseOrderStatus.PENDING };
    const orders = { data: [{ id: 'po-1', poNumber: 'PO-001' }], meta: { total: 1 } };
    const order = { id: 'po-1', poNumber: 'PO-001', status: PurchaseOrderStatus.PENDING };
    mockApiGet.mockResolvedValueOnce({ data: orders });
    mockApiGet.mockResolvedValueOnce({ data: order });

    const listResult = await purchaseOrderService.getAll(params);
    const singleResult = await purchaseOrderService.getById('po-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/purchase-orders', { params });
    expect(api.get).toHaveBeenNthCalledWith(2, '/purchase-orders/po-1');
    expect(listResult).toEqual(orders);
    expect(singleResult).toEqual(order);
  });

  it('creates, updates, and deletes a purchase order', async () => {
    const createPayload: CreatePurchaseOrderDto = {
      supplierId: 'supplier-1',
      orderDate: '2026-03-19',
      items: [{ productId: 'prod-1', quantity: 5, unitPrice: 100 }],
      tax: 10,
      discount: 0,
    };
    const updatePayload: UpdatePurchaseOrderDto = {
      notes: 'Urgent delivery',
      expectedDeliveryDate: '2026-03-25',
    };
    const created = { id: 'po-1', ...createPayload };
    const updated = { id: 'po-1', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const createResult = await purchaseOrderService.create(createPayload);
    const updateResult = await purchaseOrderService.update('po-1', updatePayload);
    await purchaseOrderService.delete('po-1');

    expect(api.post).toHaveBeenCalledWith('/purchase-orders', createPayload);
    expect(api.put).toHaveBeenCalledWith('/purchase-orders/po-1', updatePayload);
    expect(api.delete).toHaveBeenCalledWith('/purchase-orders/po-1');
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('approves, receives items, cancels, and gets statistics', async () => {
    const receivePayload: ReceiveItemsDto = {
      items: [{ productId: 'prod-1', quantity: 3 }],
    };
    const approved = { id: 'po-1', status: PurchaseOrderStatus.APPROVED };
    const received = { id: 'po-1', status: PurchaseOrderStatus.RECEIVED };
    const cancelled = { id: 'po-1', status: PurchaseOrderStatus.CANCELLED };
    const stats = { totalOrders: 10, totalAmount: 20000, byStatus: { DRAFT: 1, PENDING: 2 } };
    mockApiPost.mockResolvedValueOnce({ data: approved });
    mockApiPost.mockResolvedValueOnce({ data: received });
    mockApiPost.mockResolvedValueOnce({ data: cancelled });
    mockApiGet.mockResolvedValueOnce({ data: stats });

    const approveResult = await purchaseOrderService.approve('po-1');
    const receiveResult = await purchaseOrderService.receiveItems('po-1', receivePayload);
    const cancelResult = await purchaseOrderService.cancel('po-1', 'Supplier issue');
    const statsResult = await purchaseOrderService.getStatistics();

    expect(api.post).toHaveBeenNthCalledWith(1, '/purchase-orders/po-1/approve');
    expect(api.post).toHaveBeenNthCalledWith(2, '/purchase-orders/po-1/receive', receivePayload);
    expect(api.post).toHaveBeenNthCalledWith(3, '/purchase-orders/po-1/cancel', {
      reason: 'Supplier issue',
    });
    expect(api.get).toHaveBeenCalledWith('/purchase-orders/statistics');
    expect(approveResult).toEqual(approved);
    expect(receiveResult).toEqual(received);
    expect(cancelResult).toEqual(cancelled);
    expect(statsResult).toEqual(stats);
  });
});

import orderService, {
  OrderStatus,
  PaymentStatus,
  type CreateOrderDto,
  type UpdateOrderDto,
} from './orderService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiPatch = vi.mocked(api.patch);
const mockApiDelete = vi.mocked(api.delete);

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets all orders with query params', async () => {
    const params = {
      page: 1,
      limit: 20,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
    };
    const response = { data: [{ id: 'order-1', orderNumber: 'SO-001' }], meta: { total: 1 } };
    mockApiGet.mockResolvedValue({ data: { data: response.data, meta: response.meta } });

    const result = await orderService.getAll(params);

    expect(api.get).toHaveBeenCalledWith('/orders', { params });
    expect(result).toEqual(response);
  });

  it('gets an order by id', async () => {
    const order = { id: 'order-1', orderNumber: 'SO-001', status: OrderStatus.DRAFT };
    mockApiGet.mockResolvedValue({ data: { data: order } });

    const result = await orderService.getById('order-1');

    expect(api.get).toHaveBeenCalledWith('/orders/order-1');
    expect(result).toEqual(order);
  });

  it('creates an order', async () => {
    const payload: CreateOrderDto = {
      customerId: 'customer-1',
      orderDate: '2026-03-19',
      items: [{ productId: 'product-1', quantity: 2, unitPrice: 100, discount: 0 }],
      tax: 10,
      shippingFee: 5,
    };
    const created = { id: 'order-1', ...payload, status: OrderStatus.DRAFT };
    mockApiPost.mockResolvedValue({ data: { data: created } });

    const result = await orderService.create(payload);

    expect(api.post).toHaveBeenCalledWith('/orders', payload);
    expect(result).toEqual(created);
  });

  it('updates an order', async () => {
    const payload: UpdateOrderDto = {
      shippingAddress: '123 Main St',
      notes: 'Urgent delivery',
    };
    const updated = { id: 'order-1', ...payload };
    mockApiPut.mockResolvedValue({ data: { data: updated } });

    const result = await orderService.update('order-1', payload);

    expect(api.put).toHaveBeenCalledWith('/orders/order-1', payload);
    expect(result).toEqual(updated);
  });

  it('deletes an order', async () => {
    mockApiDelete.mockResolvedValue({ data: undefined });

    await orderService.delete('order-1');

    expect(api.delete).toHaveBeenCalledWith('/orders/order-1');
  });

  it('confirms and cancels an order', async () => {
    const confirmed = { id: 'order-1', status: OrderStatus.CONFIRMED };
    const cancelled = { id: 'order-1', status: OrderStatus.CANCELLED };
    mockApiPost.mockResolvedValueOnce({ data: { data: confirmed } });
    mockApiPost.mockResolvedValueOnce({ data: { data: cancelled } });

    const confirmedResult = await orderService.confirm('order-1');
    const cancelledResult = await orderService.cancel('order-1', 'Customer changed mind');

    expect(api.post).toHaveBeenNthCalledWith(1, '/orders/order-1/confirm');
    expect(api.post).toHaveBeenNthCalledWith(2, '/orders/order-1/cancel', {
      reason: 'Customer changed mind',
    });
    expect(confirmedResult).toEqual(confirmed);
    expect(cancelledResult).toEqual(cancelled);
  });

  it('updates order status', async () => {
    const updated = { id: 'order-1', status: OrderStatus.SHIPPED };
    mockApiPatch.mockResolvedValue({ data: { data: updated } });

    const result = await orderService.updateStatus('order-1', OrderStatus.SHIPPED);

    expect(api.patch).toHaveBeenCalledWith('/orders/order-1/status', {
      status: OrderStatus.SHIPPED,
    });
    expect(result).toEqual(updated);
  });

  it('records a payment for an order', async () => {
    const updated = {
      id: 'order-1',
      paidAmount: 150,
      paymentStatus: PaymentStatus.PARTIAL,
    };
    mockApiPost.mockResolvedValue({ data: { data: updated } });

    const result = await orderService.recordPayment('order-1', 150);

    expect(api.post).toHaveBeenCalledWith('/orders/order-1/payment', { amount: 150 });
    expect(result).toEqual(updated);
  });

  it('gets order statistics', async () => {
    const stats = {
      totalOrders: 100,
      totalRevenue: 500000,
      averageOrderValue: 5000,
      byStatus: {
        [OrderStatus.DRAFT]: 5,
        [OrderStatus.PENDING]: 10,
        [OrderStatus.CONFIRMED]: 20,
        [OrderStatus.PROCESSING]: 15,
        [OrderStatus.SHIPPED]: 18,
        [OrderStatus.DELIVERED]: 28,
        [OrderStatus.CANCELLED]: 4,
      },
      byPaymentStatus: {
        [PaymentStatus.UNPAID]: 12,
        [PaymentStatus.PARTIAL]: 18,
        [PaymentStatus.PAID]: 70,
      },
    };
    mockApiGet.mockResolvedValue({ data: { data: stats } });

    const result = await orderService.getStatistics();

    expect(api.get).toHaveBeenCalledWith('/orders/statistics');
    expect(result).toEqual(stats);
  });
});

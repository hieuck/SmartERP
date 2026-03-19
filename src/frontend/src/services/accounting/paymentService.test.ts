import paymentService, {
  PaymentMethod,
  PaymentStatus,
  type CreatePaymentDto,
  type RefundPaymentDto,
  type UpdatePaymentDto,
} from './paymentService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets payments with query params through both list methods', async () => {
    const params = {
      page: 1,
      limit: 20,
      status: PaymentStatus.PENDING,
      method: PaymentMethod.BANK_TRANSFER,
    };
    const response = { data: [{ id: 'pay-1', amount: 1000 }], meta: { total: 1 } };
    mockApiGet.mockResolvedValueOnce({ data: response });
    mockApiGet.mockResolvedValueOnce({ data: response });

    const getAllResult = await paymentService.getAll(params);
    const getPaymentsResult = await paymentService.getPayments(params);

    expect(api.get).toHaveBeenNthCalledWith(1, '/payments', { params });
    expect(api.get).toHaveBeenNthCalledWith(2, '/payments', { params });
    expect(getAllResult).toEqual(response);
    expect(getPaymentsResult).toEqual(response);
  });

  it('gets a payment by id', async () => {
    const payment = { id: 'pay-1', paymentNumber: 'PMT-001', status: PaymentStatus.PENDING };
    mockApiGet.mockResolvedValue({ data: payment });

    const result = await paymentService.getById('pay-1');

    expect(api.get).toHaveBeenCalledWith('/payments/pay-1');
    expect(result).toEqual(payment);
  });

  it('creates and updates a payment', async () => {
    const createPayload: CreatePaymentDto = {
      customerId: 'customer-1',
      orderId: 'order-1',
      amount: 1000,
      method: PaymentMethod.CARD,
      paymentDate: '2026-03-19',
      reference: 'TXN-001',
    };
    const updatePayload: UpdatePaymentDto = {
      notes: 'Verified by finance',
      method: PaymentMethod.BANK_TRANSFER,
    };
    const created = { id: 'pay-1', ...createPayload, status: PaymentStatus.PENDING };
    const updated = { id: 'pay-1', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });

    const createdResult = await paymentService.create(createPayload);
    const updatedResult = await paymentService.update('pay-1', updatePayload);

    expect(api.post).toHaveBeenNthCalledWith(1, '/payments', createPayload);
    expect(api.put).toHaveBeenNthCalledWith(1, '/payments/pay-1', updatePayload);
    expect(createdResult).toEqual(created);
    expect(updatedResult).toEqual(updated);
  });

  it('deletes a payment', async () => {
    mockApiDelete.mockResolvedValue({ data: undefined });

    await paymentService.delete('pay-1');

    expect(api.delete).toHaveBeenCalledWith('/payments/pay-1');
  });

  it('completes, refunds, and reconciles a payment', async () => {
    const refundPayload: RefundPaymentDto = { amount: 200, reason: 'Duplicate charge' };
    const completed = { id: 'pay-1', status: PaymentStatus.COMPLETED };
    const refunded = { id: 'pay-1', status: PaymentStatus.REFUNDED };
    const reconciled = { id: 'pay-1', status: PaymentStatus.COMPLETED, reconciled: true };
    mockApiPost.mockResolvedValueOnce({ data: completed });
    mockApiPost.mockResolvedValueOnce({ data: refunded });
    mockApiPost.mockResolvedValueOnce({ data: reconciled });

    const completeResult = await paymentService.complete('pay-1');
    const refundResult = await paymentService.refund('pay-1', refundPayload);
    const reconcileResult = await paymentService.reconcile('pay-1');

    expect(api.post).toHaveBeenNthCalledWith(1, '/payments/pay-1/complete');
    expect(api.post).toHaveBeenNthCalledWith(2, '/payments/pay-1/refund', refundPayload);
    expect(api.post).toHaveBeenNthCalledWith(3, '/payments/pay-1/reconcile');
    expect(completeResult).toEqual(completed);
    expect(refundResult).toEqual(refunded);
    expect(reconcileResult).toEqual(reconciled);
  });

  it('gets payment statistics and payments by method', async () => {
    const stats = {
      totalPayments: 50,
      totalAmount: 100000,
      pendingAmount: 5000,
      completedAmount: 90000,
    };
    const byMethod = [{ id: 'pay-1', method: PaymentMethod.CASH }];
    mockApiGet.mockResolvedValueOnce({ data: stats });
    mockApiGet.mockResolvedValueOnce({ data: byMethod });

    const statsResult = await paymentService.getStatistics();
    const byMethodResult = await paymentService.getByMethod(PaymentMethod.CASH);

    expect(api.get).toHaveBeenNthCalledWith(1, '/payments/statistics');
    expect(api.get).toHaveBeenNthCalledWith(2, '/payments/method/CASH');
    expect(statsResult).toEqual(stats);
    expect(byMethodResult).toEqual(byMethod);
  });
});

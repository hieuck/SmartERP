import paymentGatewayService, {
  type CreatePaymentDto,
  type RefundPaymentDto,
  type VerifyPaymentDto,
} from './paymentGatewayService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);

describe('paymentGatewayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates, verifies, and refunds gateway payments', async () => {
    const createPayload: CreatePaymentDto = {
      gateway: 'momo',
      amount: 150000,
      orderId: 'order-1',
      returnUrl: 'https://app/return',
    };
    const verifyPayload: VerifyPaymentDto = {
      gateway: 'momo',
      transactionId: 'txn-1',
      params: { signature: 'abc' },
    };
    const refundPayload: RefundPaymentDto = {
      transactionId: 'txn-1',
      amount: 150000,
      reason: 'Customer request',
    };
    const created = { success: true, paymentUrl: 'https://pay', transactionId: 'txn-1' };
    const verified = { success: true, message: 'Verified' };
    const refunded = { success: true, message: 'Refunded' };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPost.mockResolvedValueOnce({ data: verified });
    mockApiPost.mockResolvedValueOnce({ data: refunded });

    const createResult = await paymentGatewayService.createPayment(createPayload);
    const verifyResult = await paymentGatewayService.verifyPayment(verifyPayload);
    const refundResult = await paymentGatewayService.refundPayment(refundPayload);

    expect(api.post).toHaveBeenNthCalledWith(1, '/payment-gateway', createPayload);
    expect(api.post).toHaveBeenNthCalledWith(2, '/payment-gateway/verify', verifyPayload);
    expect(api.post).toHaveBeenNthCalledWith(3, '/payment-gateway/refund', refundPayload);
    expect(createResult).toEqual(created);
    expect(verifyResult).toEqual(verified);
    expect(refundResult).toEqual(refunded);
  });

  it('gets a transaction and lists transactions with query params', async () => {
    const transaction = { id: 'txn-1', gateway: 'momo', orderId: 'order-1', amount: 150000 };
    const transactions = [transaction];
    const params = { gateway: 'momo', status: 'success', limit: 10, offset: 0 };
    mockApiGet.mockResolvedValueOnce({ data: transaction });
    mockApiGet.mockResolvedValueOnce({ data: transactions });

    const transactionResult = await paymentGatewayService.getTransaction('txn-1');
    const listResult = await paymentGatewayService.listTransactions(params);

    expect(api.get).toHaveBeenNthCalledWith(1, '/payment-gateway/transactions/txn-1');
    expect(api.get).toHaveBeenNthCalledWith(2, '/payment-gateway/transactions', { params });
    expect(transactionResult).toEqual(transaction);
    expect(listResult).toEqual(transactions);
  });
});

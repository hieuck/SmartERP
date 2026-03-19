import invoiceService, {
  InvoiceStatus,
  type CreateInvoiceDto,
  type RecordPaymentDto,
  type UpdateInvoiceDto,
} from './invoiceService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets invoices with query params and invoice by id', async () => {
    const params = { page: 1, limit: 20, status: InvoiceStatus.SENT };
    const invoices = { data: [{ id: 'inv-1', invoiceNumber: 'INV-001' }], meta: { total: 1 } };
    const invoice = { id: 'inv-1', invoiceNumber: 'INV-001', status: InvoiceStatus.SENT };
    mockApiGet.mockResolvedValueOnce({ data: invoices });
    mockApiGet.mockResolvedValueOnce({ data: invoice });

    const listResult = await invoiceService.getAll(params);
    const singleResult = await invoiceService.getById('inv-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/invoices', { params });
    expect(api.get).toHaveBeenNthCalledWith(2, '/invoices/inv-1');
    expect(listResult).toEqual(invoices);
    expect(singleResult).toEqual(invoice);
  });

  it('creates, updates, and deletes an invoice', async () => {
    const createPayload: CreateInvoiceDto = {
      customerId: 'customer-1',
      issueDate: '2026-03-19',
      dueDate: '2026-03-30',
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: 100, discount: 0, tax: 10 }],
      tax: 10,
      discount: 0,
    };
    const updatePayload: UpdateInvoiceDto = {
      notes: 'Updated note',
      dueDate: '2026-04-05',
    };
    const created = { id: 'inv-1', ...createPayload };
    const updated = { id: 'inv-1', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const createResult = await invoiceService.create(createPayload);
    const updateResult = await invoiceService.update('inv-1', updatePayload);
    await invoiceService.delete('inv-1');

    expect(api.post).toHaveBeenCalledWith('/invoices', createPayload);
    expect(api.put).toHaveBeenCalledWith('/invoices/inv-1', updatePayload);
    expect(api.delete).toHaveBeenCalledWith('/invoices/inv-1');
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('sends, records payment, and cancels an invoice', async () => {
    const paymentPayload: RecordPaymentDto = {
      amount: 200,
      paymentDate: '2026-03-20',
      paymentMethod: 'bank_transfer',
      reference: 'TXN-001',
    };
    const sent = { id: 'inv-1', status: InvoiceStatus.SENT };
    const paid = { id: 'inv-1', status: InvoiceStatus.PAID, paidAmount: 200 };
    const cancelled = { id: 'inv-1', status: InvoiceStatus.CANCELLED };
    mockApiPost.mockResolvedValueOnce({ data: sent });
    mockApiPost.mockResolvedValueOnce({ data: paid });
    mockApiPost.mockResolvedValueOnce({ data: cancelled });

    const sendResult = await invoiceService.send('inv-1');
    const paymentResult = await invoiceService.recordPayment('inv-1', paymentPayload);
    const cancelResult = await invoiceService.cancel('inv-1');

    expect(api.post).toHaveBeenNthCalledWith(1, '/invoices/inv-1/send');
    expect(api.post).toHaveBeenNthCalledWith(2, '/invoices/inv-1/payment', paymentPayload);
    expect(api.post).toHaveBeenNthCalledWith(3, '/invoices/inv-1/cancel');
    expect(sendResult).toEqual(sent);
    expect(paymentResult).toEqual(paid);
    expect(cancelResult).toEqual(cancelled);
  });

  it('gets invoice statistics and overdue invoices', async () => {
    const stats = { totalInvoices: 10, paidInvoices: 7, overdueInvoices: 2 };
    const overdue = [{ id: 'inv-9', status: InvoiceStatus.OVERDUE }];
    mockApiGet.mockResolvedValueOnce({ data: stats });
    mockApiGet.mockResolvedValueOnce({ data: overdue });

    const statsResult = await invoiceService.getStatistics();
    const overdueResult = await invoiceService.getOverdue();

    expect(api.get).toHaveBeenNthCalledWith(1, '/invoices/statistics');
    expect(api.get).toHaveBeenNthCalledWith(2, '/invoices/overdue');
    expect(statsResult).toEqual(stats);
    expect(overdueResult).toEqual(overdue);
  });
});

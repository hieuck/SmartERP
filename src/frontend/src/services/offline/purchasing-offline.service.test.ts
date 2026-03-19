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

const purchaseReceiptsWhere = vi.fn();
const supplierInvoicesWhere = vi.fn();
const supplierInvoicesToArray = vi.fn();

vi.mock('@/lib/offline/db', () => ({
  db: {
    purchaseReceipts: {
      where: purchaseReceiptsWhere,
    },
    supplierInvoices: {
      where: supplierInvoicesWhere,
      toArray: supplierInvoicesToArray,
    },
  },
}));

vi.mock('./base-offline.service', () => ({
  BaseOfflineService: class {
    constructor(_table: unknown, _endpoint: string) {}
  },
}));

describe('purchasing offline services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries purchase receipts by number, supplier, status, and date range', async () => {
    const receipt = { id: 'pr-1', receiptNumber: 'PR-001' };
    const receipts = [receipt];
    purchaseReceiptsWhere
      .mockReturnValueOnce(makeEqualsChain(receipt))
      .mockReturnValueOnce(makeEqualsChain(receipts))
      .mockReturnValueOnce(makeEqualsChain(receipts))
      .mockReturnValueOnce(makeEqualsChain(receipts));

    const { purchaseReceiptOfflineService } = await import('./purchasing-offline.service');

    const byNumber = await purchaseReceiptOfflineService.getByReceiptNumber('PR-001');
    const bySupplier = await purchaseReceiptOfflineService.getBySupplier('sup-1');
    const byStatus = await purchaseReceiptOfflineService.getByStatus('received');
    const byDate = await purchaseReceiptOfflineService.getByDateRange(
      new Date('2026-03-01'),
      new Date('2026-03-31'),
    );

    expect(purchaseReceiptsWhere).toHaveBeenNthCalledWith(1, 'receiptNumber');
    expect(purchaseReceiptsWhere).toHaveBeenNthCalledWith(2, 'supplierId');
    expect(purchaseReceiptsWhere).toHaveBeenNthCalledWith(3, 'status');
    expect(purchaseReceiptsWhere).toHaveBeenNthCalledWith(4, 'receiptDate');
    expect(byNumber).toEqual(receipt);
    expect(bySupplier).toEqual(receipts);
    expect(byStatus).toEqual(receipts);
    expect(byDate).toEqual(receipts);
  });

  it('queries supplier invoices and filters overdue invoices in memory', async () => {
    const invoice = { id: 'si-1', invoiceNumber: 'SI-001' };
    const invoices = [invoice];
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    supplierInvoicesWhere
      .mockReturnValueOnce(makeEqualsChain(invoice))
      .mockReturnValueOnce(makeEqualsChain(invoices))
      .mockReturnValueOnce(makeEqualsChain(invoices));
    supplierInvoicesToArray.mockResolvedValue([
      { id: 'si-1', dueDate: pastDate, status: 'pending', paidAmount: 0, totalAmount: 100 },
      { id: 'si-2', dueDate: futureDate, status: 'pending', paidAmount: 0, totalAmount: 100 },
      { id: 'si-3', dueDate: pastDate, status: 'paid', paidAmount: 100, totalAmount: 100 },
    ]);

    const { supplierInvoiceOfflineService } = await import('./purchasing-offline.service');

    const byNumber = await supplierInvoiceOfflineService.getByInvoiceNumber('SI-001');
    const bySupplier = await supplierInvoiceOfflineService.getBySupplier('sup-1');
    const byStatus = await supplierInvoiceOfflineService.getByStatus('pending');
    const overdue = await supplierInvoiceOfflineService.getOverdue();

    expect(supplierInvoicesWhere).toHaveBeenNthCalledWith(1, 'invoiceNumber');
    expect(supplierInvoicesWhere).toHaveBeenNthCalledWith(2, 'supplierId');
    expect(supplierInvoicesWhere).toHaveBeenNthCalledWith(3, 'status');
    expect(byNumber).toEqual(invoice);
    expect(bySupplier).toEqual(invoices);
    expect(byStatus).toEqual(invoices);
    expect(overdue).toEqual([
      { id: 'si-1', dueDate: pastDate, status: 'pending', paidAmount: 0, totalAmount: 100 },
    ]);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeEqualsChain = <T>(result: T) => ({
  equals: vi.fn(() => ({
    first: vi.fn(async () => (Array.isArray(result) ? result[0] : result)),
    toArray: vi.fn(async () => (Array.isArray(result) ? result : [result])),
  })),
});

const quotationsWhere = vi.fn();
const quotationsToArray = vi.fn();
const deliveryNotesWhere = vi.fn();

vi.mock('@/lib/offline/db', () => ({
  db: {
    quotations: {
      where: quotationsWhere,
      toArray: quotationsToArray,
    },
    deliveryNotes: {
      where: deliveryNotesWhere,
    },
  },
}));

vi.mock('./base-offline.service', () => ({
  BaseOfflineService: class {
    constructor(_table: unknown, _endpoint: string) {}
  },
}));

describe('sales offline services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries quotation offline service by number, customer, and status', async () => {
    const quotation = { id: 'quo-1', quotationNumber: 'Q-001' };
    const quotations = [quotation];
    quotationsWhere
      .mockReturnValueOnce(makeEqualsChain(quotation))
      .mockReturnValueOnce(makeEqualsChain(quotations))
      .mockReturnValueOnce(makeEqualsChain(quotations));

    const { quotationOfflineService } = await import('./sales-offline.service');

    const byNumber = await quotationOfflineService.getByQuotationNumber('Q-001');
    const byCustomer = await quotationOfflineService.getByCustomer('cus-1');
    const byStatus = await quotationOfflineService.getByStatus('draft');

    expect(quotationsWhere).toHaveBeenNthCalledWith(1, 'quotationNumber');
    expect(quotationsWhere).toHaveBeenNthCalledWith(2, 'customerId');
    expect(quotationsWhere).toHaveBeenNthCalledWith(3, 'status');
    expect(byNumber).toEqual(quotation);
    expect(byCustomer).toEqual(quotations);
    expect(byStatus).toEqual(quotations);
  });

  it('filters expired quotations in memory', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    quotationsToArray.mockResolvedValue([
      { id: 'quo-1', validUntil: pastDate, status: 'sent' },
      { id: 'quo-2', validUntil: futureDate, status: 'sent' },
      { id: 'quo-3', validUntil: pastDate, status: 'draft' },
    ]);

    const { quotationOfflineService } = await import('./sales-offline.service');
    const result = await quotationOfflineService.getExpired();

    expect(result).toEqual([{ id: 'quo-1', validUntil: pastDate, status: 'sent' }]);
  });

  it('queries delivery note offline service by number, sales order, customer, and status', async () => {
    const deliveryNote = { id: 'dn-1', deliveryNumber: 'DN-001' };
    const deliveryNotes = [deliveryNote];
    deliveryNotesWhere
      .mockReturnValueOnce(makeEqualsChain(deliveryNote))
      .mockReturnValueOnce(makeEqualsChain(deliveryNotes))
      .mockReturnValueOnce(makeEqualsChain(deliveryNotes))
      .mockReturnValueOnce(makeEqualsChain(deliveryNotes));

    const { deliveryNoteOfflineService } = await import('./sales-offline.service');

    const byNumber = await deliveryNoteOfflineService.getByDeliveryNumber('DN-001');
    const bySalesOrder = await deliveryNoteOfflineService.getBySalesOrder('so-1');
    const byCustomer = await deliveryNoteOfflineService.getByCustomer('cus-1');
    const byStatus = await deliveryNoteOfflineService.getByStatus('draft');

    expect(deliveryNotesWhere).toHaveBeenNthCalledWith(1, 'deliveryNumber');
    expect(deliveryNotesWhere).toHaveBeenNthCalledWith(2, 'salesOrderId');
    expect(deliveryNotesWhere).toHaveBeenNthCalledWith(3, 'customerId');
    expect(deliveryNotesWhere).toHaveBeenNthCalledWith(4, 'status');
    expect(byNumber).toEqual(deliveryNote);
    expect(bySalesOrder).toEqual(deliveryNotes);
    expect(byCustomer).toEqual(deliveryNotes);
    expect(byStatus).toEqual(deliveryNotes);
  });
});

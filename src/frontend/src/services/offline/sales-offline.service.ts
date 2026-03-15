import { db, Quotation, DeliveryNote } from '@/lib/offline/db';
import { BaseOfflineService } from './base-offline.service';

/**
 * Quotation offline service
 */
export class QuotationOfflineService extends BaseOfflineService<Quotation> {
  constructor() {
    super(db.quotations, 'quotations');
  }

  async getByQuotationNumber(quotationNumber: string): Promise<Quotation | undefined> {
    return db.quotations.where('quotationNumber').equals(quotationNumber).first();
  }

  async getByCustomer(customerId: string): Promise<Quotation[]> {
    return db.quotations.where('customerId').equals(customerId).toArray();
  }

  async getByStatus(status: string): Promise<Quotation[]> {
    return db.quotations.where('status').equals(status).toArray();
  }

  async getExpired(): Promise<Quotation[]> {
    const now = new Date();
    const all = await db.quotations.toArray();
    return all.filter(quotation => 
      quotation.validUntil && 
      new Date(quotation.validUntil) < now && 
      quotation.status === 'sent'
    );
  }
}

/**
 * Delivery Note offline service
 */
export class DeliveryNoteOfflineService extends BaseOfflineService<DeliveryNote> {
  constructor() {
    super(db.deliveryNotes, 'deliveryNotes');
  }

  async getByDeliveryNumber(deliveryNumber: string): Promise<DeliveryNote | undefined> {
    return db.deliveryNotes.where('deliveryNumber').equals(deliveryNumber).first();
  }

  async getBySalesOrder(salesOrderId: string): Promise<DeliveryNote[]> {
    return db.deliveryNotes.where('salesOrderId').equals(salesOrderId).toArray();
  }

  async getByCustomer(customerId: string): Promise<DeliveryNote[]> {
    return db.deliveryNotes.where('customerId').equals(customerId).toArray();
  }

  async getByStatus(status: string): Promise<DeliveryNote[]> {
    return db.deliveryNotes.where('status').equals(status).toArray();
  }
}

// Export singleton instances
export const quotationOfflineService = new QuotationOfflineService();
export const deliveryNoteOfflineService = new DeliveryNoteOfflineService();

import { db, PurchaseReceipt, SupplierInvoice } from '@/lib/offline/db';
import { BaseOfflineService } from './base-offline.service';

/**
 * Purchase Receipt offline service
 */
export class PurchaseReceiptOfflineService extends BaseOfflineService<PurchaseReceipt> {
  constructor() {
    super(db.purchaseReceipts, 'purchaseReceipts');
  }

  async getByReceiptNumber(receiptNumber: string): Promise<PurchaseReceipt | undefined> {
    return db.purchaseReceipts.where('receiptNumber').equals(receiptNumber).first();
  }

  async getBySupplier(supplierId: string): Promise<PurchaseReceipt[]> {
    return db.purchaseReceipts.where('supplierId').equals(supplierId).toArray();
  }

  async getByStatus(status: string): Promise<PurchaseReceipt[]> {
    return db.purchaseReceipts.where('status').equals(status).toArray();
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<PurchaseReceipt[]> {
    return db.purchaseReceipts
      .where('receiptDate')
      .between(startDate, endDate, true, true)
      .toArray();
  }
}

/**
 * Supplier Invoice offline service
 */
export class SupplierInvoiceOfflineService extends BaseOfflineService<SupplierInvoice> {
  constructor() {
    super(db.supplierInvoices, 'supplierInvoices');
  }

  async getByInvoiceNumber(invoiceNumber: string): Promise<SupplierInvoice | undefined> {
    return db.supplierInvoices.where('invoiceNumber').equals(invoiceNumber).first();
  }

  async getBySupplier(supplierId: string): Promise<SupplierInvoice[]> {
    return db.supplierInvoices.where('supplierId').equals(supplierId).toArray();
  }

  async getByStatus(status: string): Promise<SupplierInvoice[]> {
    return db.supplierInvoices.where('status').equals(status).toArray();
  }

  async getOverdue(): Promise<SupplierInvoice[]> {
    const now = new Date();
    const all = await db.supplierInvoices.toArray();
    return all.filter(invoice => 
      invoice.dueDate && 
      new Date(invoice.dueDate) < now && 
      invoice.status !== 'paid' &&
      invoice.paidAmount < invoice.totalAmount
    );
  }
}

// Export singleton instances
export const purchaseReceiptOfflineService = new PurchaseReceiptOfflineService();
export const supplierInvoiceOfflineService = new SupplierInvoiceOfflineService();

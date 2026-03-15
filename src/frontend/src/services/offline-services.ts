/**
 * Offline Services for all entities
 * Pre-configured OfflineService instances for each entity type
 */

import { createOfflineService } from '../lib/offline/offline-service';
import type { 
  User, 
  Product, 
  Customer, 
  Supplier, 
  SalesOrder, 
  Invoice,
  Payment,
  PurchaseOrder,
  Warehouse,
  Stock,
  StockReceipt
} from '../lib/offline/db';

// User service
export const userOfflineService = createOfflineService<User>('users', 'users');

// Product service
export const productOfflineService = createOfflineService<Product>('products', 'products');

// Customer service
export const customerOfflineService = createOfflineService<Customer>('customers', 'customers');

// Supplier service
export const supplierOfflineService = createOfflineService<Supplier>('suppliers', 'suppliers');

// Sales Order service
export const salesOrderOfflineService = createOfflineService<SalesOrder>('salesOrders', 'salesOrders');

// Invoice service
export const invoiceOfflineService = createOfflineService<Invoice>('invoices', 'invoices');

// Payment service (Batch 1)
export const paymentOfflineService = createOfflineService<Payment>('payments', 'payments');

// Purchase Order service (Batch 1)
export const purchaseOrderOfflineService = createOfflineService<PurchaseOrder>('purchaseOrders', 'purchaseOrders');

// Warehouse service (Batch 1)
export const warehouseOfflineService = createOfflineService<Warehouse>('warehouses', 'warehouses');

// Stock service (Batch 1)
export const stockOfflineService = createOfflineService<Stock>('stocks', 'stocks');

// Stock Receipt service (Batch 1)
export const stockReceiptOfflineService = createOfflineService<StockReceipt>('stockReceipts', 'stockReceipts');

/**
 * Export all services
 */
export const offlineServices = {
  users: userOfflineService,
  products: productOfflineService,
  customers: customerOfflineService,
  suppliers: supplierOfflineService,
  salesOrders: salesOrderOfflineService,
  invoices: invoiceOfflineService,
  payments: paymentOfflineService,
  purchaseOrders: purchaseOrderOfflineService,
  warehouses: warehouseOfflineService,
  stocks: stockOfflineService,
  stockReceipts: stockReceiptOfflineService,
};

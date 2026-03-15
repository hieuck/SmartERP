/**
 * Offline Services for all entities
 * Pre-configured OfflineService instances for each entity type
 */

import { createOfflineService } from '../lib/offline/offline-service';
import type { User, Product, Customer, Supplier, SalesOrder, Invoice } from '../lib/offline/db';

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
};

import Dexie, { Table } from 'dexie';

// Sync status enum matching backend
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
}

// Base interface for all entities
export interface BaseEntity {
  id: string;
  tenantId: string;
  version: number;
  lastSyncedAt?: Date;
  syncStatus: SyncStatus;
  offlineId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// User entity
export interface User extends BaseEntity {
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
}

// Product entity (matches backend Product entity)
export interface Product extends BaseEntity {
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId?: string;
  status: string;
  type?: string;
  trackingType?: string;
  hasExpiry?: boolean;
  barcode?: string;
  brand?: string;
  manufacturer?: string;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  images?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  isActive?: boolean;
  isFeatured?: boolean;
}

// Customer entity (matches backend Customer entity)
export interface Customer extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
  notes?: string;
  status: string;
  creditLimit?: number;
  currentBalance?: number;
  metadata?: Record<string, unknown>;
}

// Supplier entity (matches backend Supplier entity)
export interface Supplier extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
  notes?: string;
  status: string;
  paymentTerms?: number;
  currentBalance?: number;
  metadata?: Record<string, unknown>;
}

// Order entity (matches backend Order entity - renamed from SalesOrder)
export interface SalesOrder extends BaseEntity {
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  status: string;
  items?: Record<string, unknown>;
  notes?: string;
}

// Invoice entity (matches backend Invoice entity)
export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  type: string;
  customerId?: string;
  supplierId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: string;
  items: Record<string, unknown>;
  notes?: string;
}

// Sync queue item
export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  version?: number;
  offlineId?: string;
  createdAt: Date;
  retryCount: number;
}

// Offline database class
export class OfflineDB extends Dexie {
  users!: Table<User, string>;
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  suppliers!: Table<Supplier, string>;
  salesOrders!: Table<SalesOrder, string>;
  invoices!: Table<Invoice, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('SmartERP');
    
    this.version(1).stores({
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });

    // Version 2: Add core entities (indexes match backend)
    this.version(2).stores({
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      products: 'id, tenantId, sku, name, status, categoryId, stockQuantity, syncStatus, lastSyncedAt',
      customers: 'id, tenantId, name, email, phone, status, syncStatus, lastSyncedAt',
      suppliers: 'id, tenantId, name, email, status, syncStatus, lastSyncedAt',
      salesOrders: 'id, tenantId, orderNumber, customerId, status, syncStatus, lastSyncedAt',
      invoices: 'id, tenantId, invoiceNumber, customerId, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });
  }
}

// Export singleton instance
export const db = new OfflineDB();

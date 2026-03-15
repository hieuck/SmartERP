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

// Payment entity (matches backend Payment entity)
export interface Payment extends BaseEntity {
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: string; // pending, processing, completed, failed, refunded
  paymentDate?: Date;
  transactionId?: string;
  currency: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// PurchaseOrder entity (from frontend interface)
export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  supplierId: string;
  orderDate: Date;
  expectedDate?: Date;
  status: string; // draft, pending, approved, ordered, received, cancelled
  totalAmount: number;
  items: Record<string, unknown>[];
  notes?: string;
}

// Warehouse entity (from frontend interface)
export interface Warehouse extends BaseEntity {
  code: string;
  name: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  status: string; // active, inactive
  isDefault: boolean;
  metadata?: Record<string, unknown>;
}

// Stock/Inventory entity (matches backend Inventory entity)
export interface Stock extends BaseEntity {
  productId: string;
  warehouseId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockDate?: Date;
  lastCountDate?: Date;
  unitCost?: number;
  totalValue: number;
  location?: string;
  bin?: string;
  aisle?: string;
  shelf?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// StockReceipt entity (inferred from typical ERP pattern)
export interface StockReceipt extends BaseEntity {
  receiptNumber: string;
  warehouseId: string;
  supplierId?: string;
  purchaseOrderId?: string;
  receiptDate: Date;
  status: string; // draft, pending, received, cancelled
  totalAmount: number;
  items: Record<string, unknown>[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

// Material entity (matches backend Material entity)
export interface Material extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  type: string; // raw_material, component, consumable, etc.
  unit: string;
  purchasePrice: number;
  supplierId?: string;
  stockQuantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  storageLocation?: string;
  notes?: string;
  status: string; // active, inactive
}

// Mold entity (matches backend Mold entity)
export interface Mold extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  category?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  material?: string;
  purchaseCost?: number;
  purchaseDate?: Date;
  supplierId?: string;
  status: string; // active, inactive, maintenance, retired
  condition: string; // excellent, good, fair, poor
  usageCount: number;
  maxUsageCount?: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceIntervalDays?: number;
  storageLocation?: string;
  notes?: string;
  maintenanceHistory?: Array<{
    date: string;
    type: string;
    description: string;
    cost?: number;
    performedBy?: string;
  }>;
}

// ProductionOrder entity (matches backend WorkOrder entity)
export interface ProductionOrder extends BaseEntity {
  orderNumber: string;
  name: string;
  description?: string;
  productId: string;
  productName?: string;
  bomId?: string;
  bomCode?: string;
  status: string; // draft, planned, in_progress, completed, cancelled
  priority: string; // low, normal, high, urgent
  quantityPlanned: number;
  qtyProduced: number;
  quantityRejected: number;
  unit: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  assignedTo?: string;
  assignedToName?: string;
  workstation?: string;
  materialConsumption?: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    quantityPlanned: number;
    quantityConsumed: number;
    unit: string;
  }>;
  operationProgress?: Array<{
    stepNumber: number;
    name: string;
    status: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    notes?: string;
  }>;
  qualityChecks?: Array<{
    checkTime: string;
    inspector: string;
    result: string;
    notes?: string;
    defects?: Array<{
      type: string;
      quantity: number;
      description: string;
    }>;
  }>;
  completionPercentage?: number;
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

// Attendance entity (matches backend Attendance entity)
export interface Attendance extends BaseEntity {
  employeeId: string;
  date: Date;
  checkIn: string;
  checkOut?: string | null;
  hoursWorked: number;
  notes?: string | null;
}

// Notification entity (matches backend Notification entity)
export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: string; // info, warning, success, error
  status: string; // unread, read
  link?: string;
  metadata?: Record<string, unknown>;
  readAt?: Date;
}

// Category entity (matches backend Category entity)
export interface Category extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  level: number;
  path?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
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
  payments!: Table<Payment, string>;
  purchaseOrders!: Table<PurchaseOrder, string>;
  warehouses!: Table<Warehouse, string>;
  stocks!: Table<Stock, string>;
  stockReceipts!: Table<StockReceipt, string>;
  materials!: Table<Material, string>;
  molds!: Table<Mold, string>;
  productionOrders!: Table<ProductionOrder, string>;
  attendances!: Table<Attendance, string>;
  notifications!: Table<Notification, string>;
  categories!: Table<Category, string>;
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

    // Version 3: Add Batch 1 entities (Payment, PurchaseOrder, Warehouse, Stock, StockReceipt)
    this.version(3).stores({
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      products: 'id, tenantId, sku, name, status, categoryId, stockQuantity, syncStatus, lastSyncedAt',
      customers: 'id, tenantId, name, email, phone, status, syncStatus, lastSyncedAt',
      suppliers: 'id, tenantId, name, email, status, syncStatus, lastSyncedAt',
      salesOrders: 'id, tenantId, orderNumber, customerId, status, syncStatus, lastSyncedAt',
      invoices: 'id, tenantId, invoiceNumber, customerId, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',
      payments: 'id, tenantId, orderId, status, paymentDate, syncStatus, lastSyncedAt',
      purchaseOrders: 'id, tenantId, poNumber, supplierId, status, orderDate, syncStatus, lastSyncedAt',
      warehouses: 'id, tenantId, code, name, status, isDefault, syncStatus, lastSyncedAt',
      stocks: 'id, tenantId, productId, warehouseId, quantity, syncStatus, lastSyncedAt',
      stockReceipts: 'id, tenantId, receiptNumber, warehouseId, status, receiptDate, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });

    // Version 4: Add Batch 2A entities (Material, Mold, ProductionOrder)
    this.version(4).stores({
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      products: 'id, tenantId, sku, name, status, categoryId, stockQuantity, syncStatus, lastSyncedAt',
      customers: 'id, tenantId, name, email, phone, status, syncStatus, lastSyncedAt',
      suppliers: 'id, tenantId, name, email, status, syncStatus, lastSyncedAt',
      salesOrders: 'id, tenantId, orderNumber, customerId, status, syncStatus, lastSyncedAt',
      invoices: 'id, tenantId, invoiceNumber, customerId, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',
      payments: 'id, tenantId, orderId, status, paymentDate, syncStatus, lastSyncedAt',
      purchaseOrders: 'id, tenantId, poNumber, supplierId, status, orderDate, syncStatus, lastSyncedAt',
      warehouses: 'id, tenantId, code, name, status, isDefault, syncStatus, lastSyncedAt',
      stocks: 'id, tenantId, productId, warehouseId, quantity, syncStatus, lastSyncedAt',
      stockReceipts: 'id, tenantId, receiptNumber, warehouseId, status, receiptDate, syncStatus, lastSyncedAt',
      materials: 'id, tenantId, code, name, type, status, stockQuantity, syncStatus, lastSyncedAt',
      molds: 'id, tenantId, code, name, status, condition, usageCount, syncStatus, lastSyncedAt',
      productionOrders: 'id, tenantId, orderNumber, productId, status, priority, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });

    // Version 5: Add Batch 3A entities (Attendance, Notification)
    this.version(5).stores({
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      products: 'id, tenantId, sku, name, status, categoryId, stockQuantity, syncStatus, lastSyncedAt',
      customers: 'id, tenantId, name, email, phone, status, syncStatus, lastSyncedAt',
      suppliers: 'id, tenantId, name, email, status, syncStatus, lastSyncedAt',
      salesOrders: 'id, tenantId, orderNumber, customerId, status, syncStatus, lastSyncedAt',
      invoices: 'id, tenantId, invoiceNumber, customerId, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',
      payments: 'id, tenantId, orderId, status, paymentDate, syncStatus, lastSyncedAt',
      purchaseOrders: 'id, tenantId, poNumber, supplierId, status, orderDate, syncStatus, lastSyncedAt',
      warehouses: 'id, tenantId, code, name, status, isDefault, syncStatus, lastSyncedAt',
      stocks: 'id, tenantId, productId, warehouseId, quantity, syncStatus, lastSyncedAt',
      stockReceipts: 'id, tenantId, receiptNumber, warehouseId, status, receiptDate, syncStatus, lastSyncedAt',
      materials: 'id, tenantId, code, name, type, status, stockQuantity, syncStatus, lastSyncedAt',
      molds: 'id, tenantId, code, name, status, condition, usageCount, syncStatus, lastSyncedAt',
      productionOrders: 'id, tenantId, orderNumber, productId, status, priority, syncStatus, lastSyncedAt',
      attendances: 'id, tenantId, employeeId, date, syncStatus, lastSyncedAt',
      notifications: 'id, tenantId, userId, type, status, createdAt, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });
  }
}

// Export singleton instance
export const db = new OfflineDB();

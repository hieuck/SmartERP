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
  customerName?: string;
  orderDate?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  taxAmount?: number;
  discount?: number;
  discountAmount?: number;
  shippingFee?: number;
  paidAmount?: number;
  status: string;
  items?: Record<string, unknown>;
  notes?: string;
}

// Invoice entity (matches backend Invoice entity)
export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  type: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  invoiceDate: Date;
  issueDate?: string; // alias for invoiceDate (string form)
  dueDate?: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
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
  invoiceId?: string;
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
  expectedDeliveryDate?: Date;
  shippingFee?: number;
  discountAmount?: number;
  deliveryAddress?: string;
  paymentTerms?: string;
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

// ============================================
// NEW ENTITIES FOR 50% COVERAGE (27 entities)
// ============================================

// ACCOUNTING (4 entities)
export interface Account extends BaseEntity {
  accountNumber: string;
  accountName: string;
  accountType: string; // asset, liability, equity, revenue, expense
  parentAccountId?: string;
  currency: string;
  balance: number;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface JournalEntry extends BaseEntity {
  entryNumber: string;
  entryDate: Date;
  referenceNumber?: string;
  description?: string;
  totalDebit: number;
  totalCredit: number;
  status: string; // draft, posted, cancelled
  postedDate?: Date;
  lines: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
}

export interface Ledger extends BaseEntity {
  accountId: string;
  journalEntryId: string;
  transactionDate: Date;
  description?: string;
  debit: number;
  credit: number;
  balance: number;
  referenceNumber?: string;
  metadata?: Record<string, unknown>;
}

export interface TaxRate extends BaseEntity {
  taxName: string;
  taxCode: string;
  rate: number;
  taxType: string; // sales, purchase, both
  isActive: boolean;
  description?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  metadata?: Record<string, unknown>;
}

// PURCHASING (2 entities - PurchaseOrder already exists)
export interface PurchaseReceipt extends BaseEntity {
  receiptNumber: string;
  purchaseOrderId?: string;
  supplierId: string;
  receiptDate: Date;
  status: string; // draft, received, cancelled
  totalAmount: number;
  items: Record<string, unknown>[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface SupplierInvoice extends BaseEntity {
  invoiceNumber: string;
  supplierId: string;
  purchaseOrderId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: string; // draft, pending, paid, overdue, cancelled
  items: Record<string, unknown>[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

// SALES (2 entities - SalesOrder already exists)
export interface Quotation extends BaseEntity {
  quotationNumber: string;
  customerId: string;
  quotationDate: Date;
  validUntil?: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string; // draft, sent, accepted, rejected, expired
  items: Record<string, unknown>[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryNote extends BaseEntity {
  deliveryNumber: string;
  salesOrderId: string;
  customerId: string;
  deliveryDate: Date;
  status: string; // draft, in_transit, delivered, cancelled
  warehouseId?: string;
  items: Record<string, unknown>[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

// INVENTORY (3 entities)
export interface StockAdjustment extends BaseEntity {
  adjustmentNumber: string;
  warehouseId: string;
  adjustmentDate: Date;
  adjustmentType: string; // increase, decrease, recount
  reason?: string;
  status: string; // draft, approved, cancelled
  items: Record<string, unknown>[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface StockTransfer extends BaseEntity {
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  transferDate: Date;
  status: string; // draft, in_transit, received, cancelled
  items: Record<string, unknown>[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface BinLocation extends BaseEntity {
  warehouseId: string;
  binCode: string;
  binName: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  level?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

// MANUFACTURING (3 entities)
export interface BOM extends BaseEntity {
  bomNumber: string;
  productId: string;
  bomName: string;
  quantity: number;
  uom: string;
  isActive: boolean;
  items: Record<string, unknown>[]; // components
  operations?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
}

export interface WorkOrder extends BaseEntity {
  workOrderNumber: string;
  bomId: string;
  productId: string;
  plannedQuantity: number;
  producedQuantity: number;
  status: string; // draft, planned, in_progress, completed, cancelled
  startDate?: Date;
  endDate?: Date;
  warehouseId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductionPlan extends BaseEntity {
  planNumber: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  status: string; // draft, approved, in_progress, completed, cancelled
  items: Record<string, unknown>[]; // work orders
  notes?: string;
  metadata?: Record<string, unknown>;
}

// HR (4 entities)
export interface Employee extends BaseEntity {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  positionId?: string;
  hireDate: Date;
  status: string; // active, inactive, terminated
  salary?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface Department extends BaseEntity {
  departmentCode: string;
  departmentName: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface Position extends BaseEntity {
  positionCode: string;
  positionName: string;
  description?: string;
  departmentId?: string;
  level?: string;
  minSalary?: number;
  maxSalary?: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface Shift extends BaseEntity {
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  workingHours: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

// PROJECT (3 entities)
export interface Project extends BaseEntity {
  projectCode: string;
  projectName: string;
  description?: string;
  customerId?: string;
  startDate: Date;
  endDate?: Date;
  status: string; // planning, in_progress, on_hold, completed, cancelled
  budget?: number;
  actualCost?: number;
  managerId?: string;
  metadata?: Record<string, unknown>;
}

export interface Task extends BaseEntity {
  taskNumber: string;
  projectId: string;
  taskName: string;
  description?: string;
  assignedTo?: string;
  startDate?: Date;
  dueDate?: Date;
  status: string; // todo, in_progress, review, completed, cancelled
  priority: string; // low, medium, high, urgent
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  metadata?: Record<string, unknown>;
}

export interface TimeEntry extends BaseEntity {
  employeeId: string;
  projectId?: string;
  taskId?: string;
  entryDate: Date;
  hours: number;
  description?: string;
  billable: boolean;
  status: string; // draft, submitted, approved, rejected
  metadata?: Record<string, unknown>;
}

// PLATFORM (4 entities)
export interface Document extends BaseEntity {
  documentNumber: string;
  documentName: string;
  documentType: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  uploadedBy?: string;
  status: string; // draft, active, archived
  metadata?: Record<string, unknown>;
}

export interface Report extends BaseEntity {
  reportCode: string;
  reportName: string;
  reportType: string;
  description?: string;
  parameters?: Record<string, unknown>;
  schedule?: string;
  lastRunAt?: Date;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface Workflow extends BaseEntity {
  workflowCode: string;
  workflowName: string;
  description?: string;
  entityType: string;
  steps: Record<string, unknown>[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface Settings extends BaseEntity {
  settingKey: string;
  settingValue: string;
  settingType: string; // string, number, boolean, json
  category: string;
  description?: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
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
  // Existing entities (14)
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
  attendances!: Table<Attendance, string>;
  notifications!: Table<Notification, string>;
  categories!: Table<Category, string>;

  // New entities for 50% coverage (27)
  // Accounting (4)
  accounts!: Table<Account, string>;
  journalEntries!: Table<JournalEntry, string>;
  ledgers!: Table<Ledger, string>;
  taxRates!: Table<TaxRate, string>;

  // Purchasing (2)
  purchaseReceipts!: Table<PurchaseReceipt, string>;
  supplierInvoices!: Table<SupplierInvoice, string>;

  // Sales (2)
  quotations!: Table<Quotation, string>;
  deliveryNotes!: Table<DeliveryNote, string>;

  // Inventory (3)
  stockAdjustments!: Table<StockAdjustment, string>;
  stockTransfers!: Table<StockTransfer, string>;
  binLocations!: Table<BinLocation, string>;

  // Manufacturing (3)
  boms!: Table<BOM, string>;
  workOrders!: Table<WorkOrder, string>;
  productionPlans!: Table<ProductionPlan, string>;

  // HR (4)
  employees!: Table<Employee, string>;
  departments!: Table<Department, string>;
  positions!: Table<Position, string>;
  shifts!: Table<Shift, string>;

  // Project (3)
  projects!: Table<Project, string>;
  tasks!: Table<Task, string>;
  timeEntries!: Table<TimeEntry, string>;

  // Platform (4)
  documents!: Table<Document, string>;
  reports!: Table<Report, string>;
  workflows!: Table<Workflow, string>;
  settings!: Table<Settings, string>;

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
      products:
        'id, tenantId, sku, name, status, categoryId, stockQuantity, syncStatus, lastSyncedAt',
      customers: 'id, tenantId, name, email, phone, status, syncStatus, lastSyncedAt',
      suppliers: 'id, tenantId, name, email, status, syncStatus, lastSyncedAt',
      salesOrders: 'id, tenantId, orderNumber, customerId, status, syncStatus, lastSyncedAt',
      invoices:
        'id, tenantId, invoiceNumber, customerId, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });

    // Version 3: Add Batch 1 entities (Payment, PurchaseOrder, Warehouse, Stock, StockReceipt)
    this.version(3).stores({
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      products:
        'id, tenantId, sku, name, status, categoryId, stockQuantity, syncStatus, lastSyncedAt',
      customers: 'id, tenantId, name, email, phone, status, syncStatus, lastSyncedAt',
      suppliers: 'id, tenantId, name, email, status, syncStatus, lastSyncedAt',
      salesOrders: 'id, tenantId, orderNumber, customerId, status, syncStatus, lastSyncedAt',
      invoices:
        'id, tenantId, invoiceNumber, customerId, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',
      payments: 'id, tenantId, orderId, status, paymentDate, syncStatus, lastSyncedAt',
      purchaseOrders:
        'id, tenantId, poNumber, supplierId, status, orderDate, syncStatus, lastSyncedAt',
      warehouses: 'id, tenantId, code, name, status, isDefault, syncStatus, lastSyncedAt',
      stocks: 'id, tenantId, productId, warehouseId, quantity, syncStatus, lastSyncedAt',
      stockReceipts:
        'id, tenantId, receiptNumber, warehouseId, status, receiptDate, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });

    // Version 4: Add Batch 3A entities (Attendance, Notification, Category)
    this.version(4).stores({
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      products:
        'id, tenantId, sku, name, status, categoryId, stockQuantity, syncStatus, lastSyncedAt',
      customers: 'id, tenantId, name, email, phone, status, syncStatus, lastSyncedAt',
      suppliers: 'id, tenantId, name, email, status, syncStatus, lastSyncedAt',
      salesOrders: 'id, tenantId, orderNumber, customerId, status, syncStatus, lastSyncedAt',
      invoices:
        'id, tenantId, invoiceNumber, customerId, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',
      payments: 'id, tenantId, orderId, status, paymentDate, syncStatus, lastSyncedAt',
      purchaseOrders:
        'id, tenantId, poNumber, supplierId, status, orderDate, syncStatus, lastSyncedAt',
      warehouses: 'id, tenantId, code, name, status, isDefault, syncStatus, lastSyncedAt',
      stocks: 'id, tenantId, productId, warehouseId, quantity, syncStatus, lastSyncedAt',
      stockReceipts:
        'id, tenantId, receiptNumber, warehouseId, status, receiptDate, syncStatus, lastSyncedAt',
      attendances: 'id, tenantId, employeeId, date, syncStatus, lastSyncedAt',
      notifications: 'id, tenantId, userId, type, status, createdAt, syncStatus, lastSyncedAt',
      categories: 'id, tenantId, code, name, parentId, level, isActive, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });

    // Version 5: Add 27 new entities for 50% coverage
    this.version(5).stores({
      // Existing entities (14)
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      products:
        'id, tenantId, sku, name, status, categoryId, stockQuantity, syncStatus, lastSyncedAt',
      customers: 'id, tenantId, name, email, phone, status, syncStatus, lastSyncedAt',
      suppliers: 'id, tenantId, name, email, status, syncStatus, lastSyncedAt',
      salesOrders: 'id, tenantId, orderNumber, customerId, status, syncStatus, lastSyncedAt',
      invoices:
        'id, tenantId, invoiceNumber, customerId, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',
      payments: 'id, tenantId, orderId, status, paymentDate, syncStatus, lastSyncedAt',
      purchaseOrders:
        'id, tenantId, poNumber, supplierId, status, orderDate, syncStatus, lastSyncedAt',
      warehouses: 'id, tenantId, code, name, status, isDefault, syncStatus, lastSyncedAt',
      stocks: 'id, tenantId, productId, warehouseId, quantity, syncStatus, lastSyncedAt',
      stockReceipts:
        'id, tenantId, receiptNumber, warehouseId, status, receiptDate, syncStatus, lastSyncedAt',
      attendances: 'id, tenantId, employeeId, date, syncStatus, lastSyncedAt',
      notifications: 'id, tenantId, userId, type, status, createdAt, syncStatus, lastSyncedAt',
      categories: 'id, tenantId, code, name, parentId, level, isActive, syncStatus, lastSyncedAt',

      // Accounting (4)
      accounts:
        'id, tenantId, accountNumber, accountName, accountType, isActive, syncStatus, lastSyncedAt',
      journalEntries: 'id, tenantId, entryNumber, entryDate, status, syncStatus, lastSyncedAt',
      ledgers: 'id, tenantId, accountId, journalEntryId, transactionDate, syncStatus, lastSyncedAt',
      taxRates: 'id, tenantId, taxCode, taxName, isActive, syncStatus, lastSyncedAt',

      // Purchasing (2)
      purchaseReceipts:
        'id, tenantId, receiptNumber, supplierId, status, receiptDate, syncStatus, lastSyncedAt',
      supplierInvoices:
        'id, tenantId, invoiceNumber, supplierId, invoiceDate, status, syncStatus, lastSyncedAt',

      // Sales (2)
      quotations:
        'id, tenantId, quotationNumber, customerId, quotationDate, status, syncStatus, lastSyncedAt',
      deliveryNotes:
        'id, tenantId, deliveryNumber, salesOrderId, customerId, deliveryDate, status, syncStatus, lastSyncedAt',

      // Inventory (3)
      stockAdjustments:
        'id, tenantId, adjustmentNumber, warehouseId, adjustmentDate, status, syncStatus, lastSyncedAt',
      stockTransfers:
        'id, tenantId, transferNumber, fromWarehouseId, toWarehouseId, transferDate, status, syncStatus, lastSyncedAt',
      binLocations:
        'id, tenantId, warehouseId, binCode, binName, isActive, syncStatus, lastSyncedAt',

      // Manufacturing (3)
      boms: 'id, tenantId, bomNumber, productId, isActive, syncStatus, lastSyncedAt',
      workOrders:
        'id, tenantId, workOrderNumber, bomId, productId, status, syncStatus, lastSyncedAt',
      productionPlans:
        'id, tenantId, planNumber, startDate, endDate, status, syncStatus, lastSyncedAt',

      // HR (4)
      employees:
        'id, tenantId, employeeNumber, email, departmentId, positionId, status, syncStatus, lastSyncedAt',
      departments:
        'id, tenantId, departmentCode, departmentName, isActive, syncStatus, lastSyncedAt',
      positions:
        'id, tenantId, positionCode, positionName, departmentId, isActive, syncStatus, lastSyncedAt',
      shifts: 'id, tenantId, shiftCode, shiftName, isActive, syncStatus, lastSyncedAt',

      // Project (3)
      projects:
        'id, tenantId, projectCode, projectName, customerId, status, syncStatus, lastSyncedAt',
      tasks:
        'id, tenantId, taskNumber, projectId, assignedTo, status, priority, syncStatus, lastSyncedAt',
      timeEntries:
        'id, tenantId, employeeId, projectId, taskId, entryDate, status, syncStatus, lastSyncedAt',

      // Platform (4)
      documents:
        'id, tenantId, documentNumber, documentType, relatedEntity, relatedEntityId, status, syncStatus, lastSyncedAt',
      reports:
        'id, tenantId, reportCode, reportName, reportType, isActive, syncStatus, lastSyncedAt',
      workflows:
        'id, tenantId, workflowCode, workflowName, entityType, isActive, syncStatus, lastSyncedAt',
      settings: 'id, tenantId, settingKey, category, syncStatus, lastSyncedAt',

      syncQueue: '++id, entity, operation, createdAt',
    });
  }
}

// Export singleton instance
export const db = new OfflineDB();

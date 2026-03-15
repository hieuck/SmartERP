import * as SQLite from 'expo-sqlite';

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
  lastSyncedAt?: string; // ISO timestamp
  syncStatus: SyncStatus;
  offlineId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  metadata?: string; // JSON string
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
  metadata?: string; // JSON string
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
  metadata?: string; // JSON string
}

// SalesOrder entity (matches backend Order entity)
export interface SalesOrder extends BaseEntity {
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  status: string;
  items?: string; // JSON string
  notes?: string;
}

// Invoice entity (matches backend Invoice entity)
export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  type: string;
  customerId?: string;
  supplierId?: string;
  invoiceDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: string;
  items: string; // JSON string
  notes?: string;
}

// Payment entity (matches backend Payment entity)
export interface Payment extends BaseEntity {
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentDate?: string;
  transactionId?: string;
  currency: string;
  notes?: string;
  metadata?: string; // JSON string
}

// PurchaseOrder entity
export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  supplierId: string;
  orderDate: string;
  expectedDate?: string;
  status: string;
  totalAmount: number;
  items: string; // JSON string
  notes?: string;
}

// Warehouse entity
export interface Warehouse extends BaseEntity {
  code: string;
  name: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  status: string;
  isDefault: boolean;
  metadata?: string; // JSON string
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
  lastRestockDate?: string;
  lastCountDate?: string;
  unitCost?: number;
  totalValue: number;
  location?: string;
  bin?: string;
  aisle?: string;
  shelf?: string;
  notes?: string;
  metadata?: string; // JSON string
}

// StockReceipt entity
export interface StockReceipt extends BaseEntity {
  receiptNumber: string;
  warehouseId: string;
  supplierId?: string;
  purchaseOrderId?: string;
  receiptDate: string;
  status: string;
  totalAmount: number;
  items: string; // JSON string
  notes?: string;
  metadata?: string; // JSON string
}

// Attendance entity (matches backend Attendance entity)
export interface Attendance extends BaseEntity {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  hoursWorked: number;
  notes?: string;
}

// Notification entity (matches backend Notification entity)
export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: string;
  status: string;
  link?: string;
  metadata?: string; // JSON string
  readAt?: string;
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
  metadata?: string; // JSON string
  createdBy?: string;
  updatedBy?: string;
}

// Sync queue item
export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  entity: string;
  data: string; // JSON string
  version?: number;
  offlineId?: string;
  createdAt: string;
  retryCount: number;
}

/**
 * Offline Database Class using SQLite
 * Matches frontend IndexedDB pattern with Dexie.js
 */
class OfflineDB {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'SmartERP.db';

  /**
   * Initialize database and create tables
   */
  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create all tables with proper schema
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        email TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,
      
      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        cost REAL,
        categoryId TEXT,
        status TEXT NOT NULL,
        type TEXT,
        trackingType TEXT,
        hasExpiry INTEGER,
        barcode TEXT,
        brand TEXT,
        manufacturer TEXT,
        weight REAL,
        weightUnit TEXT,
        stockQuantity INTEGER,
        minStockLevel INTEGER,
        maxStockLevel INTEGER,
        metadata TEXT,
        isActive INTEGER,
        isFeatured INTEGER,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        postalCode TEXT,
        taxId TEXT,
        website TEXT,
        notes TEXT,
        status TEXT NOT NULL,
        creditLimit REAL,
        currentBalance REAL,
        metadata TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Suppliers table
      `CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        postalCode TEXT,
        taxId TEXT,
        website TEXT,
        notes TEXT,
        status TEXT NOT NULL,
        paymentTerms INTEGER,
        currentBalance REAL,
        metadata TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // SalesOrders table
      `CREATE TABLE IF NOT EXISTS salesOrders (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        orderNumber TEXT NOT NULL,
        customerId TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        status TEXT NOT NULL,
        items TEXT,
        notes TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Invoices table
      `CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        invoiceNumber TEXT NOT NULL,
        type TEXT NOT NULL,
        customerId TEXT,
        supplierId TEXT,
        invoiceDate TEXT NOT NULL,
        dueDate TEXT,
        subtotal REAL NOT NULL,
        taxAmount REAL NOT NULL,
        totalAmount REAL NOT NULL,
        paidAmount REAL NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        items TEXT NOT NULL,
        notes TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Payments table
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        orderId TEXT NOT NULL,
        amount REAL NOT NULL,
        paymentMethod TEXT NOT NULL,
        status TEXT NOT NULL,
        paymentDate TEXT,
        transactionId TEXT,
        currency TEXT NOT NULL,
        notes TEXT,
        metadata TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // PurchaseOrders table
      `CREATE TABLE IF NOT EXISTS purchaseOrders (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        poNumber TEXT NOT NULL,
        supplierId TEXT NOT NULL,
        orderDate TEXT NOT NULL,
        expectedDate TEXT,
        status TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        items TEXT NOT NULL,
        notes TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Warehouses table
      `CREATE TABLE IF NOT EXISTS warehouses (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        ward TEXT,
        district TEXT,
        city TEXT,
        phone TEXT,
        status TEXT NOT NULL,
        isDefault INTEGER NOT NULL,
        metadata TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Stocks table
      `CREATE TABLE IF NOT EXISTS stocks (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        productId TEXT NOT NULL,
        warehouseId TEXT,
        quantity REAL NOT NULL,
        reservedQuantity REAL NOT NULL,
        availableQuantity REAL NOT NULL,
        minStockLevel REAL NOT NULL,
        maxStockLevel REAL NOT NULL,
        reorderPoint REAL NOT NULL,
        reorderQuantity REAL NOT NULL,
        lastRestockDate TEXT,
        lastCountDate TEXT,
        unitCost REAL,
        totalValue REAL NOT NULL,
        location TEXT,
        bin TEXT,
        aisle TEXT,
        shelf TEXT,
        notes TEXT,
        metadata TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // StockReceipts table
      `CREATE TABLE IF NOT EXISTS stockReceipts (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        receiptNumber TEXT NOT NULL,
        warehouseId TEXT NOT NULL,
        supplierId TEXT,
        purchaseOrderId TEXT,
        receiptDate TEXT NOT NULL,
        status TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        items TEXT NOT NULL,
        notes TEXT,
        metadata TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Attendances table
      `CREATE TABLE IF NOT EXISTS attendances (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        employeeId TEXT NOT NULL,
        date TEXT NOT NULL,
        checkIn TEXT NOT NULL,
        checkOut TEXT,
        hoursWorked REAL NOT NULL,
        notes TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        link TEXT,
        metadata TEXT,
        readAt TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        parentId TEXT,
        level INTEGER NOT NULL,
        path TEXT,
        icon TEXT,
        image TEXT,
        sortOrder INTEGER NOT NULL,
        isActive INTEGER NOT NULL,
        metadata TEXT,
        createdBy TEXT,
        updatedBy TEXT,
        version INTEGER DEFAULT 1,
        lastSyncedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )`,

      // SyncQueue table
      `CREATE TABLE IF NOT EXISTS syncQueue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        entity TEXT NOT NULL,
        data TEXT NOT NULL,
        version INTEGER,
        offlineId TEXT,
        createdAt TEXT NOT NULL,
        retryCount INTEGER DEFAULT 0
      )`,
    ];

    // Execute all table creation statements
    for (const sql of tables) {
      await this.db.execAsync(sql);
    }

    // Create indexes for performance
    await this.createIndexes();
  }

  /**
   * Create indexes for frequently queried fields
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const indexes = [
      // Users indexes
      'CREATE INDEX IF NOT EXISTS idx_users_tenantId ON users(tenantId)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_syncStatus ON users(syncStatus)',
      
      // Products indexes
      'CREATE INDEX IF NOT EXISTS idx_products_tenantId ON products(tenantId)',
      'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
      'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
      'CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products(categoryId)',
      'CREATE INDEX IF NOT EXISTS idx_products_syncStatus ON products(syncStatus)',
      
      // Customers indexes
      'CREATE INDEX IF NOT EXISTS idx_customers_tenantId ON customers(tenantId)',
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',
      'CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status)',
      'CREATE INDEX IF NOT EXISTS idx_customers_syncStatus ON customers(syncStatus)',
      
      // Suppliers indexes
      'CREATE INDEX IF NOT EXISTS idx_suppliers_tenantId ON suppliers(tenantId)',
      'CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status)',
      'CREATE INDEX IF NOT EXISTS idx_suppliers_syncStatus ON suppliers(syncStatus)',
      
      // SalesOrders indexes
      'CREATE INDEX IF NOT EXISTS idx_salesOrders_tenantId ON salesOrders(tenantId)',
      'CREATE INDEX IF NOT EXISTS idx_salesOrders_customerId ON salesOrders(customerId)',
      'CREATE INDEX IF NOT EXISTS idx_salesOrders_status ON salesOrders(status)',
      'CREATE INDEX IF NOT EXISTS idx_salesOrders_syncStatus ON salesOrders(syncStatus)',
      
      // Invoices indexes
      'CREATE INDEX IF NOT EXISTS idx_invoices_tenantId ON invoices(tenantId)',
      'CREATE INDEX IF NOT EXISTS idx_invoices_customerId ON invoices(customerId)',
      'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)',
      'CREATE INDEX IF NOT EXISTS idx_invoices_syncStatus ON invoices(syncStatus)',
      
      // Payments indexes
      'CREATE INDEX IF NOT EXISTS idx_payments_tenantId ON payments(tenantId)',
      'CREATE INDEX IF NOT EXISTS idx_payments_orderId ON payments(orderId)',
      'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
      'CREATE INDEX IF NOT EXISTS idx_payments_syncStatus ON payments(syncStatus)',
      
      // Stocks indexes
      'CREATE INDEX IF NOT EXISTS idx_stocks_tenantId ON stocks(tenantId)',
      'CREATE INDEX IF NOT EXISTS idx_stocks_productId ON stocks(productId)',
      'CREATE INDEX IF NOT EXISTS idx_stocks_warehouseId ON stocks(warehouseId)',
      'CREATE INDEX IF NOT EXISTS idx_stocks_syncStatus ON stocks(syncStatus)',
      
      // SyncQueue indexes
      'CREATE INDEX IF NOT EXISTS idx_syncQueue_entity ON syncQueue(entity)',
      'CREATE INDEX IF NOT EXISTS idx_syncQueue_createdAt ON syncQueue(createdAt)',
    ];

    for (const sql of indexes) {
      await this.db.execAsync(sql);
    }
  }

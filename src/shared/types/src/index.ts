// Base Entity Types
export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  version: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// User & Auth Types
export interface User extends BaseEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
}

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface Permission {
  resource: string;
  actions: PermissionAction[];
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
}

// Product Types
export interface Product extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  images: ProductImage[];
  barcode?: string;
  qrCode?: string;
  weight?: number;
  status: ProductStatus;
  customFields?: Record<string, any>;
  tags?: string[];
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  order: number;
  uploadedAt: Date;
}

// Inventory Types
export interface Stock extends BaseEntity {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  reorderPoint?: number;
}

export enum StockMovementType {
  RECEIPT = 'receipt',
  ISSUE = 'issue',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

// Order Types
export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPING = 'shipping',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

// Event Types
export interface EventMessage {
  eventId: string;
  eventType: string;
  tenantId: string;
  timestamp: Date;
  payload: any;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  userId: string;
  correlationId: string;
  causationId?: string;
}

// Export all types
export * from './common';
export * from './entities';

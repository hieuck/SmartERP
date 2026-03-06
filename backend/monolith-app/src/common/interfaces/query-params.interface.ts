/**
 * Common query parameter interfaces for API endpoints
 * Used to replace 'any' types with proper TypeScript types
 */

export interface PaginationQuery {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface SearchQuery extends PaginationQuery {
  search?: string;
  q?: string;
}

export interface FilterQuery extends SearchQuery {
  status?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface SortQuery {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface BaseQuery extends FilterQuery, SortQuery {}

// Specific query interfaces for different modules
export interface AccountingQuery extends BaseQuery {
  accountType?: string;
  fiscalYear?: number;
}

export interface AuditQuery extends BaseQuery {
  action?: string;
  entityType?: string;
  userId?: string;
}

export interface ProductQuery extends BaseQuery {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface OrderQuery extends BaseQuery {
  customerId?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
}

export interface CustomerQuery extends BaseQuery {
  segment?: string;
  minBalance?: number;
  maxBalance?: number;
}

export interface SupplierQuery extends BaseQuery {
  minRating?: number;
  maxRating?: number;
}

// Generic metadata interface
export interface EntityMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

// Generic JSON data interface
export interface JsonData {
  [key: string]: unknown;
}

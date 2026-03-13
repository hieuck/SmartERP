/**
 * Query Interfaces
 * 
 * Common query parameter interfaces for API endpoints
 * Used across backend, frontend, and mobile for consistent API communication
 */

/**
 * Basic pagination parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

/**
 * Search query with pagination
 */
export interface SearchQuery extends PaginationQuery {
  search?: string;
  q?: string;
}

/**
 * Filter query with common filters
 */
export interface FilterQuery extends SearchQuery {
  status?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Sort parameters
 */
export interface SortQuery {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Base query combining all common parameters
 */
export interface BaseQuery extends FilterQuery, SortQuery {}

/**
 * Accounting-specific query parameters
 */
export interface AccountingQuery extends BaseQuery {
  accountType?: string;
  fiscalYear?: number;
}

/**
 * Audit log query parameters
 */
export interface AuditQuery extends BaseQuery {
  action?: string;
  entityType?: string;
  userId?: string;
}

/**
 * Product query parameters
 */
export interface ProductQuery extends BaseQuery {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

/**
 * Order query parameters
 */
export interface OrderQuery extends BaseQuery {
  customerId?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
}

/**
 * Customer query parameters
 */
export interface CustomerQuery extends BaseQuery {
  segment?: string;
  minBalance?: number;
  maxBalance?: number;
}

/**
 * Supplier query parameters
 */
export interface SupplierQuery extends BaseQuery {
  minRating?: number;
  maxRating?: number;
}

/**
 * Generic metadata interface
 */
export interface EntityMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Generic JSON data interface
 */
export interface JsonData {
  [key: string]: unknown;
}

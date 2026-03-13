/**
 * Pagination Interfaces
 * 
 * Cursor-based and offset-based pagination interfaces
 * Used for consistent pagination across all API endpoints
 */

/**
 * Cursor structure for cursor-based pagination
 */
export interface Cursor {
  id: string;
  createdAt?: Date;
  [key: string]: unknown;
}

/**
 * Cursor pagination response
 */
export interface CursorPaginationResponse<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
  };
}

/**
 * Offset pagination response
 */
export interface OffsetPaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Page info for relay-style pagination
 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

/**
 * Pagination Utilities
 * 
 * Helper functions for cursor-based and offset-based pagination
 */

import { Cursor, CursorPaginationResponse, OffsetPaginationResponse } from '../interfaces/pagination';

/**
 * Encode cursor to base64
 * 
 * @param cursor - Cursor object to encode
 * @returns Base64 encoded cursor string
 */
export const encodeCursor = (cursor: Cursor): string => {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
};

/**
 * Decode cursor from base64
 * 
 * @param cursor - Base64 encoded cursor string
 * @returns Decoded cursor object
 * @throws Error if cursor format is invalid
 */
export const decodeCursor = (cursor: string): Cursor => {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
};

/**
 * Create cursor pagination response
 * 
 * @param items - Array of items
 * @param limit - Items per page
 * @param hasMore - Whether there are more items
 * @returns Cursor pagination response
 */
export const createPaginationResponse = <T extends { id: string }>(
  items: T[],
  limit: number,
  hasMore: boolean = false,
): CursorPaginationResponse<T> => {
  const hasNextPage = hasMore || items.length > limit;
  const data = hasNextPage ? items.slice(0, limit) : items;

  return {
    data,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: false, // Can be implemented if needed
      startCursor: data.length > 0 ? encodeCursor({ id: data[0].id }) : null,
      endCursor: data.length > 0 ? encodeCursor({ id: data[data.length - 1].id }) : null,
    },
  };
};

/**
 * Create offset pagination response
 * 
 * @param items - Array of items
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Offset pagination response
 */
export const createOffsetPaginationResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): OffsetPaginationResponse<T> => {
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Calculate skip value for offset pagination
 * 
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Number of items to skip
 */
export const calculateSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Validate pagination parameters
 * 
 * @param page - Page number
 * @param limit - Items per page
 * @param maxLimit - Maximum allowed limit
 * @returns Validated and normalized parameters
 */
export const validatePaginationParams = (
  page?: number,
  limit?: number,
  maxLimit: number = 100,
): { page: number; limit: number } => {
  const normalizedPage = Math.max(1, page || 1);
  const normalizedLimit = Math.min(maxLimit, Math.max(1, limit || 10));
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
  };
};

import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cursor-based Pagination DTO
 *
 * More efficient than offset pagination for large datasets
 * Provides consistent results even when data changes
 */
export class CursorPaginationDto {
  @ApiPropertyOptional({
    description: 'Cursor for next page (base64 encoded)',
    example: 'eyJpZCI6IjEyMyIsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMDEifQ==',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  direction?: 'asc' | 'desc' = 'desc';
}

/**
 * Cursor Pagination Response
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
 * Cursor structure
 */
export interface Cursor {
  id: string;
  createdAt?: Date;
  [key: string]: unknown;
}

/**
 * Encode cursor to base64
 */
export const encodeCursor = (cursor: Cursor): string => {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
};

/**
 * Decode cursor from base64
 */
export const decodeCursor = (cursor: string): Cursor => {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
};

/**
 * Create pagination response
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

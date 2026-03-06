import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder, FindManyOptions } from 'typeorm';
import { PaginationDto, PaginatedResponse, PaginationHelper } from './pagination.dto';

@Injectable()
export class PaginationService {
  /**
   * Paginate using TypeORM Repository
   */
  async paginate<T>(
    repository: Repository<T>,
    paginationDto: PaginationDto,
    options?: FindManyOptions<T>,
  ): Promise<PaginatedResponse<T>> {
    const { page, limit } = PaginationHelper.normalize(paginationDto.page, paginationDto.limit);

    const skip = PaginationHelper.getSkip(page, limit);

    const [data, total] = await repository.findAndCount({
      ...options,
      skip,
      take: limit,
      order: paginationDto.sortBy
        ? { [paginationDto.sortBy]: paginationDto.sortOrder || 'DESC' }
        : options?.order,
    });

    return PaginationHelper.createResponse(data, page, limit, total);
  }

  /**
   * Paginate using TypeORM QueryBuilder
   */
  async paginateQueryBuilder<T>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<T>> {
    const { page, limit } = PaginationHelper.normalize(paginationDto.page, paginationDto.limit);

    const skip = PaginationHelper.getSkip(page, limit);

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Apply sorting if specified
    if (paginationDto.sortBy) {
      queryBuilder.orderBy(paginationDto.sortBy, paginationDto.sortOrder || 'DESC');
    }

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return PaginationHelper.createResponse(data, page, limit, total);
  }

  /**
   * Paginate raw data array (for in-memory pagination)
   */
  paginateArray<T>(data: T[], paginationDto: PaginationDto): PaginatedResponse<T> {
    const { page, limit } = PaginationHelper.normalize(paginationDto.page, paginationDto.limit);

    const skip = PaginationHelper.getSkip(page, limit);
    const paginatedData = data.slice(skip, skip + limit);

    return PaginationHelper.createResponse(paginatedData, page, limit, data.length);
  }

  /**
   * Create cursor-based pagination (for infinite scroll)
   */
  async paginateCursor<T>(
    queryBuilder: SelectQueryBuilder<T>,
    cursor: string | null,
    limit: number = 20,
    cursorField: string = 'id',
  ): Promise<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const normalizedLimit = Math.min(100, Math.max(1, limit));

    // Apply cursor filter if provided
    if (cursor) {
      queryBuilder.andWhere(`${cursorField} > :cursor`, { cursor });
    }

    // Fetch one extra item to determine if there are more results
    queryBuilder.take(normalizedLimit + 1);

    const data = await queryBuilder.getMany();
    const hasMore = data.length > normalizedLimit;

    // Remove the extra item if present
    if (hasMore) {
      data.pop();
    }

    // Get the cursor for the next page
    const nextCursor =
      hasMore && data.length > 0 ? (data[data.length - 1] as any)[cursorField] : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }
}

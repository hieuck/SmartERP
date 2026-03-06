import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private cacheService: CacheService,
  ) {}

  async log(
    tenantId: string,
    userId: string,
    action: AuditAction,
    entityType: string,
    entityId?: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
    description?: string,
  ): Promise<AuditLog> {
    const log = this.auditRepository.create({
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      description,
    });
    return this.auditRepository.save(log);
  }

  async findAll(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    userId?: string,
    entityType?: string,
  ): Promise<AuditLog[]> {
    const where: Record<string, unknown> = { tenantId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }
    if (userId) {
      where.userId = userId;
    }
    if (entityType) {
      where.entityType = entityType;
    }

    return this.auditRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findByEntity(tenantId: string, entityType: string, entityId: string): Promise<AuditLog[]> {
    const cacheKey = generateCacheKey('audit', tenantId, `entity:${entityType}:${entityId}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.auditRepository.find({
          where: { tenantId, entityType, entityId },
          order: { createdAt: 'DESC' },
        });
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByUser(tenantId: string, userId: string): Promise<AuditLog[]> {
    const cacheKey = generateCacheKey('audit', tenantId, `user:${userId}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.auditRepository.find({
          where: { tenantId, userId },
          order: { createdAt: 'DESC' },
          take: 100,
        });
      },
      CacheTTL.MEDIUM,
    );
  }

  async getActivitySummary(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    byAction: Record<AuditAction, number>;
    byEntityType: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const cacheKey = generateCacheKey(
      'audit',
      tenantId,
      `summary:${startDate.toISOString()}:${endDate.toISOString()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const logs = await this.auditRepository.find({
          where: {
            tenantId,
            createdAt: Between(startDate, endDate),
          },
        });

        const summary = {
          total: logs.length,
          byAction: {} as Record<AuditAction, number>,
          byEntityType: {} as Record<string, number>,
          byUser: {} as Record<string, number>,
        };

        logs.forEach((log) => {
          // Count by action
          summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;

          // Count by entity type
          summary.byEntityType[log.entityType] = (summary.byEntityType[log.entityType] || 0) + 1;

          // Count by user
          summary.byUser[log.userId] = (summary.byUser[log.userId] || 0) + 1;
        });

        return summary;
      },
      CacheTTL.LONG, // Activity summaries can be cached longer
    );
  }
}

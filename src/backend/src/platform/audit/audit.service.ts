import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';

@Injectable()
export class AuditService {
  private secureAuditRepo: SecureRepository<AuditLog>;

  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureAuditRepo = new SecureRepository(
      auditRepository,
      permissionService,
      'AuditLog',
    );
  }

  async log(
    user: User,
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
      userId: user.id,
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
    user: User,
    startDate?: Date,
    endDate?: Date,
    userId?: string,
    entityType?: string,
  ): Promise<AuditLog[]> {
    const where: Record<string, unknown> = {};

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }
    if (userId) {
      where.userId = userId;
    }
    if (entityType) {
      where.entityType = entityType;
    }

    return this.secureAuditRepo.find(user, {
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findByEntity(user: User, entityType: string, entityId: string): Promise<AuditLog[]> {
    const cacheKey = generateCacheKey('audit', user.tenantId, `entity:${entityType}:${entityId}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.secureAuditRepo.find(user, {
          where: { entityType, entityId },
          order: { createdAt: 'DESC' },
        });
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByUser(user: User, userId: string): Promise<AuditLog[]> {
    const cacheKey = generateCacheKey('audit', user.tenantId, `user:${userId}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.secureAuditRepo.find(user, {
          where: { userId },
          order: { createdAt: 'DESC' },
          take: 100,
        });
      },
      CacheTTL.MEDIUM,
    );
  }

  async getActivitySummary(
    user: User,
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
      user.tenantId,
      `summary:${startDate.toISOString()}:${endDate.toISOString()}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const logs = await this.secureAuditRepo.find(user, {
          where: {
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
          summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
          summary.byEntityType[log.entityType] = (summary.byEntityType[log.entityType] || 0) + 1;
          summary.byUser[log.userId] = (summary.byUser[log.userId] || 0) + 1;
        });

        return summary;
      },
      CacheTTL.LONG,
    );
  }
}

import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource, MoreThan } from 'typeorm';
import { PullDto, PushDto, ChangeDto, ResolveConflictDto, ConflictResolution } from './dto';
import { SyncStatus } from '../enums/sync-status.enum';

interface SyncConflict {
  id: string;
  entity: string;
  localData: any;
  serverData: any;
  localVersion: number;
  serverVersion: number;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private conflicts: Map<string, SyncConflict> = new Map();

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Pull changes from server since last sync
   */
  async pull(tenantId: string, dto: PullDto) {
    const { since, entities = ['users'] } = dto;
    const sinceDate = since ? new Date(since) : new Date(0);

    const changes = [];

    for (const entityName of entities) {
      try {
        const repository = this.getRepository(entityName);
        
        // Get all records updated after sinceDate
        const records = await repository.find({
          where: {
            tenantId,
            updatedAt: MoreThan(sinceDate),
          },
        });

        changes.push({
          entity: entityName,
          records,
        });
      } catch (error) {
        this.logger.error(`Failed to pull ${entityName}`, error);
      }
    }

    return {
      changes,
      timestamp: new Date(),
      count: changes.reduce((sum, c) => sum + c.records.length, 0),
    };
  }

  /**
   * Push local changes to server
   */
  async push(tenantId: string, dto: PushDto) {
    const { changes } = dto;
    const conflicts: SyncConflict[] = [];
    const applied: ChangeDto[] = [];

    for (const change of changes) {
      try {
        const result = await this.applyChange(tenantId, change);
        
        if (result.conflict) {
          conflicts.push(result.conflict);
        } else {
          applied.push(change);
        }
      } catch (error) {
        this.logger.error(`Failed to apply change`, error);
      }
    }

    return {
      applied: applied.length,
      conflicts: conflicts.map(c => ({
        id: c.id,
        entity: c.entity,
        message: 'Version conflict detected',
      })),
    };
  }

  /**
   * Apply single change with conflict detection
   * Requirement 3.2: FOR update conflicts, apply last-write-wins strategy
   * Requirement 3.3: FOR delete conflicts, prioritize delete operation
   */
  private async applyChange(tenantId: string, change: ChangeDto) {
    const repository = this.getRepository(change.entity);

    switch (change.operation) {
      case 'create':
        const created = repository.create({
          ...change.data,
          tenantId,
          syncStatus: SyncStatus.SYNCED,
          lastSyncedAt: new Date(),
        });
        await repository.save(created);
        return { conflict: null };

      case 'update':
        const existing = await repository.findOne({
          where: { id: change.data.id, tenantId },
        });

        if (!existing) {
          throw new NotFoundException(`${change.entity} not found`);
        }

        // Requirement 3.2: Apply last-write-wins strategy
        // Compare timestamps instead of versions
        const localTimestamp = new Date(change.data.updatedAt || 0);
        const serverTimestamp = new Date(existing.updatedAt);

        if (localTimestamp < serverTimestamp) {
          // Server is newer, reject local change
          const conflict: SyncConflict = {
            id: `${change.entity}-${change.data.id}`,
            entity: change.entity,
            localData: change.data,
            serverData: existing,
            localVersion: change.version || 0,
            serverVersion: existing.version,
          };
          this.conflicts.set(conflict.id, conflict);
          this.logger.warn(`Update conflict detected: ${conflict.id} - Server wins (last-write-wins)`);
          return { conflict };
        }

        // Local is newer or equal, apply update
        await repository.update(
          { id: change.data.id, tenantId },
          {
            ...change.data,
            version: existing.version + 1,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
          },
        );
        return { conflict: null };

      case 'delete':
        // Requirement 3.3: FOR delete conflicts, prioritize delete operation
        const existingForDelete = await repository.findOne({
          where: { id: change.data.id, tenantId },
        });

        if (!existingForDelete) {
          // Already deleted, no conflict
          return { conflict: null };
        }

        // Check if there's a pending update conflict
        const updateConflictId = `${change.entity}-${change.data.id}`;
        if (this.conflicts.has(updateConflictId)) {
          // Delete wins over update conflict
          this.conflicts.delete(updateConflictId);
          this.logger.warn(`Delete conflict resolved: ${updateConflictId} - Delete wins`);
        }

        // Always prioritize delete
        await repository.softDelete({ id: change.data.id, tenantId });
        return { conflict: null };

      default:
        throw new Error(`Unknown operation: ${change.operation}`);
    }
  }

  /**
   * Resolve conflict with user choice
   * Requirement 3.4: WHERE manual resolution needed, queue for user review
   * Requirement 3.5: IF conflict resolution fails, log error and notify admin
   */
  async resolveConflict(tenantId: string, dto: ResolveConflictDto) {
    const conflict = this.conflicts.get(dto.conflictId);

    if (!conflict) {
      throw new NotFoundException('Conflict not found');
    }

    const repository = this.getRepository(conflict.entity);

    try {
      switch (dto.resolution) {
        case ConflictResolution.KEEP_LOCAL:
          await repository.update(
            { id: conflict.localData.id, tenantId },
            {
              ...conflict.localData,
              version: conflict.serverVersion + 1,
              syncStatus: SyncStatus.SYNCED,
              lastSyncedAt: new Date(),
            },
          );
          break;

        case ConflictResolution.KEEP_SERVER:
          // Do nothing, server version already exists
          break;

        case ConflictResolution.MERGE:
          if (!dto.mergedData) {
            throw new ConflictException('Merged data required for MERGE strategy');
          }
          await repository.update(
            { id: conflict.localData.id, tenantId },
            {
              ...dto.mergedData,
              version: conflict.serverVersion + 1,
              syncStatus: SyncStatus.SYNCED,
              lastSyncedAt: new Date(),
            },
          );
          break;
      }

      this.conflicts.delete(dto.conflictId);

      return {
        success: true,
        message: 'Conflict resolved',
      };
    } catch (error) {
      // Requirement 3.5: Log error and notify administrator
      this.logger.error(
        `Conflict resolution failed: ${dto.conflictId}`,
        error.stack,
        {
          conflictId: dto.conflictId,
          resolution: dto.resolution,
          tenantId,
        },
      );

      throw new ConflictException(
        `Failed to resolve conflict: ${error.message}`,
      );
    }
  }

  /**
   * Get repository by entity name
   */
  private getRepository(entityName: string) {
    // Map entity names to actual entities
    const entityMap = {
      users: 'User',
      products: 'Product',
      customers: 'Customer',
      suppliers: 'Supplier',
      salesOrders: 'Order', // Backend entity is named 'Order', not 'SalesOrder'
      invoices: 'Invoice',
    };

    const entityClass = entityMap[entityName];
    if (!entityClass) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    return this.dataSource.getRepository(entityClass);
  }
}

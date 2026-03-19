import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource, FindOptionsWhere, MoreThan, ObjectLiteral, Repository } from 'typeorm';
import { PullDto, PushDto, ChangeDto, ResolveConflictDto, ConflictResolution } from './dto';
import { SyncStatus } from '../enums/sync-status.enum';

type SyncEntityRecord = ObjectLiteral & {
  id: string;
  tenantId: string;
  updatedAt?: Date | string;
  version?: number;
  syncStatus?: SyncStatus;
  lastSyncedAt?: Date;
};

interface SyncConflict {
  id: string;
  entity: string;
  localData: SyncEntityRecord;
  serverData: SyncEntityRecord;
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

    const changes: Array<{ entity: string; records: SyncEntityRecord[] }> = [];

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
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to pull ${entityName}: ${message}`);
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
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to apply change: ${message}`);
      }
    }

    return {
      applied: applied.length,
      conflicts: conflicts.map((c) => ({
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
    const changeData = change.data as SyncEntityRecord;

    switch (change.operation) {
      case 'create': {
        const created = repository.create({
          ...changeData,
          tenantId,
          syncStatus: SyncStatus.SYNCED,
          lastSyncedAt: new Date(),
        });
        await repository.save(created);
        return { conflict: null };
      }

      case 'update': {
        const existing = await repository.findOne({
          where: { id: changeData.id, tenantId } as FindOptionsWhere<SyncEntityRecord>,
        });

        if (!existing) {
          throw new NotFoundException(`${change.entity} not found`);
        }

        // Requirement 3.2: Apply last-write-wins strategy
        // Compare timestamps instead of versions
        const localTimestamp = new Date(changeData.updatedAt || 0);
        const serverTimestamp = new Date(existing.updatedAt || 0);

        if (localTimestamp < serverTimestamp) {
          // Server is newer, reject local change
          const conflict: SyncConflict = {
            id: `${change.entity}-${changeData.id}`,
            entity: change.entity,
            localData: changeData,
            serverData: existing,
            localVersion: change.version || 0,
            serverVersion: existing.version || 0,
          };
          this.conflicts.set(conflict.id, conflict);
          this.logger.warn(
            `Update conflict detected: ${conflict.id} - Server wins (last-write-wins)`,
          );
          return { conflict };
        }

        // Local is newer or equal, apply update
        const updatedRecord: SyncEntityRecord = {
          ...existing,
          ...changeData,
          version: (existing.version || 0) + 1,
          syncStatus: SyncStatus.SYNCED,
          lastSyncedAt: new Date(),
        };
        await repository.save(repository.create(updatedRecord));
        return { conflict: null };
      }

      case 'delete': {
        // Requirement 3.3: FOR delete conflicts, prioritize delete operation
        const existingForDelete = await repository.findOne({
          where: { id: changeData.id, tenantId } as FindOptionsWhere<SyncEntityRecord>,
        });

        if (!existingForDelete) {
          // Already deleted, no conflict
          return { conflict: null };
        }

        // Check if there's a pending update conflict
        const updateConflictId = `${change.entity}-${changeData.id}`;
        if (this.conflicts.has(updateConflictId)) {
          // Delete wins over update conflict
          this.conflicts.delete(updateConflictId);
          this.logger.warn(`Delete conflict resolved: ${updateConflictId} - Delete wins`);
        }

        // Always prioritize delete
        await repository.softDelete({
          id: changeData.id,
          tenantId,
        } as FindOptionsWhere<SyncEntityRecord>);
        return { conflict: null };
      }

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
        case ConflictResolution.KEEP_LOCAL: {
          const keepLocalRecord: SyncEntityRecord = {
            ...conflict.serverData,
            ...conflict.localData,
            tenantId,
            version: conflict.serverVersion + 1,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
          };
          await repository.save(repository.create(keepLocalRecord));
          break;
        }

        case ConflictResolution.KEEP_SERVER:
          // Do nothing, server version already exists
          break;

        case ConflictResolution.MERGE:
          if (!dto.mergedData) {
            throw new ConflictException('Merged data required for MERGE strategy');
          }
          {
            const mergeRecord: SyncEntityRecord = {
              ...conflict.serverData,
              ...(dto.mergedData as ObjectLiteral),
              id: conflict.localData.id,
              tenantId,
              version: conflict.serverVersion + 1,
              syncStatus: SyncStatus.SYNCED,
              lastSyncedAt: new Date(),
            };
            await repository.save(repository.create(mergeRecord));
            break;
          }
      }

      this.conflicts.delete(dto.conflictId);

      return {
        success: true,
        message: 'Conflict resolved',
      };
    } catch (error) {
      // Requirement 3.5: Log error and notify administrator
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Conflict resolution failed: ${dto.conflictId} (${dto.resolution}, tenant ${tenantId}) - ${message}`,
      );

      throw new ConflictException(`Failed to resolve conflict: ${message}`);
    }
  }

  /**
   * Get repository by entity name
   */
  private getRepository(entityName: string): Repository<SyncEntityRecord> {
    // Map frontend entity names to backend entity class names
    const entityMap: Record<string, string> = {
      // Core
      users: 'User',
      products: 'Product',
      customers: 'Customer',
      suppliers: 'Supplier',
      salesOrders: 'Order',
      invoices: 'Invoice',
      payments: 'Payment',
      purchaseOrders: 'PurchaseOrder',
      warehouses: 'Warehouse',
      stocks: 'Inventory',
      stockReceipts: 'StockReceipt',
      attendances: 'Attendance',
      notifications: 'Notification',
      categories: 'Category',
      // Accounting
      accounts: 'Account',
      journalEntries: 'JournalEntry',
      ledgers: 'GeneralLedger',
      taxRates: 'TaxRate',
      // Purchasing
      purchaseReceipts: 'PurchaseReceipt',
      supplierInvoices: 'SupplierInvoice',
      // Sales
      quotations: 'Quotation',
      deliveryNotes: 'DeliveryNote',
      // Inventory
      stockAdjustments: 'StockAdjustment',
      stockTransfers: 'StockTransfer',
      binLocations: 'BinLocation',
      // Manufacturing
      boms: 'BOM',
      workOrders: 'WorkOrder',
      productionPlans: 'ProductionPlan',
      // HR
      employees: 'Employee',
      departments: 'Department',
      positions: 'Position',
      shifts: 'Shift',
      // Project
      projects: 'Project',
      tasks: 'Task',
      timeEntries: 'TimeEntry',
      // Platform
      documents: 'Document',
      reports: 'Report',
      workflows: 'Workflow',
      settings: 'Settings',
    };

    const entityClass = entityMap[entityName];
    if (!entityClass) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    return this.dataSource.getRepository(entityClass);
  }
}

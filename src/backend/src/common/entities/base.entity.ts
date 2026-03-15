import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SyncStatus } from '../enums/sync-status.enum';

/**
 * Base entity with tenant_id for multi-tenancy and sync metadata for offline-first
 * All entities should extend this class
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // Offline-first sync metadata
  @Column({ type: 'int', default: 1, comment: 'Version for optimistic locking' })
  version: number;

  @Column({
    type: 'timestamp',
    name: 'last_synced_at',
    nullable: true,
    comment: 'Last sync timestamp for offline-first',
  })
  lastSyncedAt?: Date;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    name: 'sync_status',
    default: SyncStatus.SYNCED,
    comment: 'Sync status for offline-first',
  })
  syncStatus: SyncStatus;

  @Column({
    type: 'uuid',
    name: 'offline_id',
    nullable: true,
    comment: 'Temporary ID for offline-created records',
  })
  offlineId?: string;
}

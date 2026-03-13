import { Entity, Column, Index } from 'typeorm';import { MoldStatus } from '../enums/mold-status.enum';
import { MoldCondition } from '../enums/mold-condition.enum';

import { BaseEntity } from '@/common/entities/base.entity';

@Entity('molds')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'status'])
export class Mold extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'jsonb', nullable: true })
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };

  @Column({ type: 'varchar', length: 100, nullable: true })
  material?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'purchase_cost' })
  purchaseCost?: number;

  @Column({ type: 'date', nullable: true, name: 'purchase_date' })
  purchaseDate?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'supplier_id' })
  supplierId?: string;

  @Column({
    type: 'enum',
    enum: MoldStatus,
    default: MoldStatus.ACTIVE,
  })
  status: MoldStatus;

  @Column({
    type: 'enum',
    enum: MoldCondition,
    default: MoldCondition.EXCELLENT,
  })
  condition: MoldCondition;

  @Column({ type: 'int', default: 0, name: 'usage_count' })
  usageCount: number;

  @Column({ type: 'int', nullable: true, name: 'max_usage_count' })
  maxUsageCount?: number;

  @Column({ type: 'date', nullable: true, name: 'last_maintenance_date' })
  lastMaintenanceDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'next_maintenance_date' })
  nextMaintenanceDate?: Date;

  @Column({ type: 'int', nullable: true, name: 'maintenance_interval_days' })
  maintenanceIntervalDays?: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'storage_location' })
  storageLocation?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'maintenance_history' })
  maintenanceHistory?: Array<{
    date: string;
    type: string;
    description: string;
    cost?: number;
    performedBy?: string;
  }>;
}

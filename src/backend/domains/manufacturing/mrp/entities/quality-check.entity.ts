import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

export enum QualityCheckType {
  INCOMING = 'incoming',
  IN_PROCESS = 'in_process',
  FINAL = 'final',
  RANDOM = 'random',
}

export enum QualityCheckResult {
  PASSED = 'passed',
  FAILED = 'failed',
  CONDITIONAL = 'conditional',
}

@Entity('quality_checks')
@Index(['tenantId', 'checkNumber'], { unique: true })
@Index(['tenantId', 'workOrderId'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'result'])
export class QualityCheck extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'check_number' })
  checkNumber: string;

  @Column({
    type: 'enum',
    enum: QualityCheckType,
  })
  type: QualityCheckType;

  @Column({ type: 'uuid', nullable: true, name: 'work_order_id' })
  workOrderId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'work_order_number' })
  workOrderNumber?: string;

  @Column({ type: 'uuid', nullable: true, name: 'product_id' })
  productId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'product_name' })
  productName?: string;

  @Column({ type: 'uuid', nullable: true, name: 'batch_id' })
  batchId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'batch_number' })
  batchNumber?: string;

  @Column({ type: 'timestamp', name: 'check_date' })
  checkDate: Date;

  @Column({ type: 'uuid', name: 'inspector_id' })
  inspectorId: string;

  @Column({ type: 'varchar', length: 255, name: 'inspector_name' })
  inspectorName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'quantity_checked' })
  quantityChecked: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'quantity_passed' })
  quantityPassed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'quantity_failed' })
  quantityFailed: number;

  @Column({ type: 'varchar', length: 50, default: 'pcs' })
  unit: string;

  @Column({
    type: 'enum',
    enum: QualityCheckResult,
  })
  result: QualityCheckResult;

  @Column({ type: 'jsonb', nullable: true, name: 'check_items' })
  checkItems?: Array<{
    parameter: string;
    specification: string;
    actualValue: string;
    result: string;
    notes?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  defects?: Array<{
    type: string;
    severity: string;
    quantity: number;
    description: string;
    location?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true, name: 'corrective_action' })
  correctiveAction?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt?: Date;
}

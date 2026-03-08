import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

export enum WorkOrderStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('work_orders')
@Index(['tenantId', 'orderNumber'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'bomId'])
export class WorkOrder extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'order_number' })
  orderNumber: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'product_name' })
  productName?: string;

  @Column({ type: 'uuid', nullable: true, name: 'bom_id' })
  bomId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'bom_code' })
  bomCode?: string;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.DRAFT,
  })
  status: WorkOrderStatus;

  @Column({
    type: 'enum',
    enum: WorkOrderPriority,
    default: WorkOrderPriority.NORMAL,
  })
  priority: WorkOrderPriority;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'quantity_planned' })
  quantityPlanned: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'quantity_produced' })
  quantityProduced: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'quantity_rejected' })
  quantityRejected: number;

  @Column({ type: 'varchar', length: 50, default: 'pcs' })
  unit: string;

  @Column({ type: 'date', nullable: true, name: 'planned_start_date' })
  plannedStartDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'planned_end_date' })
  plannedEndDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_start_date' })
  actualStartDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_end_date' })
  actualEndDate?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_to' })
  assignedTo?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'assigned_to_name' })
  assignedToName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workstation?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'material_consumption' })
  materialConsumption?: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    quantityPlanned: number;
    quantityConsumed: number;
    unit: string;
  }>;

  @Column({ type: 'jsonb', nullable: true, name: 'operation_progress' })
  operationProgress?: Array<{
    stepNumber: number;
    name: string;
    status: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    notes?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true, name: 'quality_checks' })
  qualityChecks?: Array<{
    checkTime: string;
    inspector: string;
    result: string;
    notes?: string;
    defects?: Array<{
      type: string;
      quantity: number;
      description: string;
    }>;
  }>;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'completion_percentage',
  })
  completionPercentage?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt?: Date;
}

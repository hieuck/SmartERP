import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum BomStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity('boms')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'status'])
export class Bom extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'product_name' })
  productName?: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({
    type: 'enum',
    enum: BomStatus,
    default: BomStatus.DRAFT,
  })
  status: BomStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1, name: 'quantity_to_produce' })
  quantityToProduce: number;

  @Column({ type: 'varchar', length: 50, default: 'pcs' })
  unit: string;

  @Column({ type: 'jsonb', name: 'material_items' })
  materialItems: Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    quantity: number;
    unit: string;
    unitCost?: number;
    totalCost?: number;
    notes?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true, name: 'operation_steps' })
  operationSteps?: Array<{
    stepNumber: number;
    name: string;
    description?: string;
    duration?: number;
    durationUnit?: string;
    workstation?: string;
    notes?: string;
  }>;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'total_material_cost' })
  totalMaterialCost?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'labor_cost' })
  laborCost?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'overhead_cost' })
  overheadCost?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'total_cost' })
  totalCost?: number;

  @Column({ type: 'int', nullable: true, name: 'estimated_duration_minutes' })
  estimatedDurationMinutes?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  @Column({ type: 'date', nullable: true, name: 'effective_date' })
  effectiveDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate?: Date;
}

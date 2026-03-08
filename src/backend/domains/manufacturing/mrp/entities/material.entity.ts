import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

export enum MaterialType {
  RAW = 'raw',
  PLASTER = 'plaster',
  MOLD = 'mold',
  PAINT = 'paint',
  ACCESSORY = 'accessory',
  PACKAGING = 'packaging',
}

@Entity('materials')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'type'])
export class Material extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: MaterialType,
  })
  type: MaterialType;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'purchase_price' })
  purchasePrice: number;

  @Column({ type: 'uuid', nullable: true, name: 'supplier_id' })
  supplierId?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'stock_quantity' })
  stockQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'min_quantity' })
  minQuantity?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'max_quantity' })
  maxQuantity?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'reorder_point' })
  reorderPoint?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'reorder_quantity' })
  reorderQuantity?: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'storage_location' })
  storageLocation?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;
}

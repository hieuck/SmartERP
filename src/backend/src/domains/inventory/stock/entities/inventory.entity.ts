import { Entity, Column, Index, ManyToOne, JoinColumn, ValueTransformer } from 'typeorm';

import { BaseEntity } from '@/common/entities/base.entity';
import { Product } from '../../product/entities/product.entity';

const decimalTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | number | null) => (value === null ? null : Number(value)),
};

@Entity('stock')
@Index(['tenantId', 'productId', 'warehouseId'], { unique: true })
@Index(['tenantId', 'quantity']) // Low stock queries
@Index(['tenantId', 'warehouseId']) // Warehouse filtering
@Index(['tenantId', 'productId']) // Product inventory lookup
export class Inventory extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'warehouse_id', type: 'uuid', nullable: true })
  warehouseId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'reserved',
    transformer: decimalTransformer,
  })
  reservedQuantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'available',
    transformer: decimalTransformer,
  })
  availableQuantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'min_stock',
    transformer: decimalTransformer,
  })
  minStockLevel: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'max_stock',
    transformer: decimalTransformer,
  })
  maxStockLevel: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'reorder_point',
    transformer: decimalTransformer,
  })
  reorderPoint: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'reorder_quantity',
    transformer: decimalTransformer,
  })
  reorderQuantity: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_restock_date' })
  lastRestockDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_count_date' })
  lastCountDate?: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'unit_cost',
    transformer: decimalTransformer,
  })
  unitCost?: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'total_value',
    transformer: decimalTransformer,
  })
  totalValue: number;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  bin?: string;

  @Column({ nullable: true })
  aisle?: string;

  @Column({ nullable: true })
  shelf?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy?: string;
}

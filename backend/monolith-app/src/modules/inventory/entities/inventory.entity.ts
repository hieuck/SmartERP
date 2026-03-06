import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from '../../product/entities/product.entity';

export enum InventoryTransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  RETURN = 'return',
  DAMAGE = 'damage',
  LOSS = 'loss',
}

@Entity('inventory')
@Index(['tenantId', 'productId', 'warehouseId'], { unique: true })
@Index(['tenantId', 'quantity']) // Low stock queries
@Index(['tenantId', 'warehouseId']) // Warehouse filtering
@Index(['tenantId', 'productId']) // Product inventory lookup
export class Inventory extends BaseEntity {
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'warehouse_id', nullable: true })
  warehouseId?: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0, name: 'reserved_quantity' })
  reservedQuantity: number;

  @Column({ type: 'int', default: 0, name: 'available_quantity' })
  availableQuantity: number;

  @Column({ type: 'int', default: 0, name: 'min_stock_level' })
  minStockLevel: number;

  @Column({ type: 'int', default: 0, name: 'max_stock_level' })
  maxStockLevel: number;

  @Column({ type: 'int', default: 0, name: 'reorder_point' })
  reorderPoint: number;

  @Column({ type: 'int', default: 0, name: 'reorder_quantity' })
  reorderQuantity: number;

  @Column({ nullable: true, name: 'last_restock_date' })
  lastRestockDate?: Date;

  @Column({ nullable: true, name: 'last_count_date' })
  lastCountDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'unit_cost' })
  unitCost?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_value' })
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

  @Column({ nullable: true })
  updatedBy?: string;
}

import { Entity, Column, Index } from 'typeorm';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';
import { TrackingType } from '../enums/tracking-type.enum';
import { BaseEntity } from '@/common/entities/base.entity';

@Entity('products')
@Index(['tenantId', 'sku'], { unique: true })
@Index(['tenantId', 'status']) // Status filtering
@Index(['tenantId', 'categoryId']) // Category filtering
@Index(['tenantId', 'name']) // Name search
@Index(['tenantId', 'stockQuantity']) // Low stock queries
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column()
  sku: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: string;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.PHYSICAL,
  })
  type: ProductType;

  @Column({
    type: 'enum',
    enum: TrackingType,
    default: TrackingType.NONE,
    name: 'tracking_type',
  })
  trackingType: TrackingType;

  @Column({ name: 'has_expiry', default: false })
  hasExpiry: boolean;

  @Column({ nullable: true })
  barcode?: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  manufacturer?: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight?: number;

  @Column({ name: 'weight_unit', nullable: true })
  weightUnit?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height?: number;

  @Column({ name: 'dimension_unit', nullable: true })
  dimensionUnit?: string;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ name: 'min_stock_level', type: 'int', default: 0 })
  minStockLevel: number;

  @Column({ name: 'max_stock_level', type: 'int', default: 0 })
  maxStockLevel: number;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;
}

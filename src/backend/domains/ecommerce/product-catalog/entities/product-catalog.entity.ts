import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../../../core/user/entities/user.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

/**
 * ProductCatalog entity for eCommerce products
 * Extends base Product with eCommerce-specific fields
 */
@Entity('product_catalog')
export class ProductCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string; // Stock Keeping Unit

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice: number; // Original price for showing discount

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ default: 0 })
  stockQuantity: number;

  @Column({ default: 0 })
  minStockLevel: number;

  @Column({ default: true })
  trackInventory: boolean;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  // SEO fields
  @Column({ nullable: true })
  slug: string; // URL-friendly name

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ type: 'text', nullable: true })
  metaDescription: string;

  @Column({ type: 'simple-array', nullable: true })
  metaKeywords: string[];

  // Images
  @Column({ nullable: true })
  featuredImage: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  // Categories & Tags
  @Column({ nullable: true })
  categoryId: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  // Shipping
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number; // in kg

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length: number; // in cm

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number; // in cm

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number; // in cm

  @Column({ default: true })
  requiresShipping: boolean;

  // Variants (JSON for flexibility)
  @Column({ type: 'jsonb', nullable: true })
  variants: any; // { size: ['S', 'M', 'L'], color: ['Red', 'Blue'] }

  // Display order
  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column()
  tenantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Auto-generate slug from name
  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.name && !this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  // Validation
  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (!this.sku || this.sku.trim().length === 0) {
      throw new Error('SKU is required');
    }

    if (this.price < 0) {
      throw new Error('Price must be non-negative');
    }

    if (this.compareAtPrice && this.compareAtPrice < this.price) {
      throw new Error('Compare at price must be greater than or equal to price');
    }

    if (this.stockQuantity < 0) {
      throw new Error('Stock quantity must be non-negative');
    }

    if (this.minStockLevel < 0) {
      throw new Error('Min stock level must be non-negative');
    }

    // Auto-update status based on stock
    if (this.trackInventory && this.stockQuantity === 0) {
      this.status = ProductStatus.OUT_OF_STOCK;
    }
  }

  // Helper: Check if product is on sale
  get isOnSale(): boolean {
    return this.compareAtPrice && this.compareAtPrice > this.price;
  }

  // Helper: Calculate discount percentage
  get discountPercentage(): number {
    if (!this.isOnSale) return 0;
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }

  // Helper: Check if product is in stock
  get isInStock(): boolean {
    if (!this.trackInventory) return true;
    return this.stockQuantity > 0;
  }

  // Helper: Check if product is low stock
  get isLowStock(): boolean {
    if (!this.trackInventory) return false;
    return this.stockQuantity > 0 && this.stockQuantity <= this.minStockLevel;
  }
}

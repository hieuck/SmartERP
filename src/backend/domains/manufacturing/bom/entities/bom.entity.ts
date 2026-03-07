import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Product } from '../../../inventory/product/entities/product.entity';
import { BOMLine } from './bom-line.entity';

export enum BOMType {
  MANUFACTURE = 'manufacture',
  KIT = 'kit',
}

@Entity('boms')
@Index(['tenantId', 'productId'])
export class BOM {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ unique: true })
  reference: string; // BOM-2026-0001

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'product_qty', default: 1 })
  productQty: number;

  @Column({
    type: 'enum',
    enum: BOMType,
    default: BOMType.MANUFACTURE,
  })
  type: BOMType;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_cost', default: 0 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_cost', default: 0 })
  unitCost: number;

  @OneToMany(() => BOMLine, line => line.bom, { cascade: true, eager: true })
  lines: BOMLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateCosts() {
    if (this.lines && this.lines.length > 0) {
      this.totalCost = this.lines.reduce((sum, line) => {
        return sum + (line.quantity * (line.unitCost || 0));
      }, 0);
      this.unitCost = this.totalCost / (this.productQty || 1);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (this.productQty <= 0) {
      throw new Error('Product quantity must be greater than 0');
    }
  }
}

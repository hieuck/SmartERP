import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BOM } from './bom.entity';
import { Product } from '../../../inventory/product/entities/product.entity';

@Entity('bom_lines')
@Index(['tenantId', 'bomId'])
export class BOMLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'bom_id' })
  bomId: string;

  @ManyToOne(() => BOM, bom => bom.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bom_id' })
  bom: BOM;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_cost', default: 0 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_cost', default: 0 })
  totalCost: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotalCost() {
    this.totalCost = this.quantity * (this.unitCost || 0);
  }

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (this.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }
}

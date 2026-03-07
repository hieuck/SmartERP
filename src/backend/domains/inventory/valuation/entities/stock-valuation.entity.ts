import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('stock_valuations')
@Index(['productId', 'warehouseId', 'tenantId'])
@Index(['date', 'createdAt'])
export class StockValuation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_cost' })
  unitCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_cost' })
  totalCost: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'reference_type' })
  referenceType: string; // 'purchase', 'production', 'adjustment'

  @Column({ name: 'reference_id' })
  referenceId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { BatchStock } from './batch-stock.entity';

@Entity('batches')
@Index(['tenantId', 'number'], { unique: true })
@Index(['tenantId', 'productId'])
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: true })
  number: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({ name: 'manufacturing_date', type: 'date', nullable: true })
  manufacturingDate?: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;

  @OneToMany(() => BatchStock, (stock) => stock.batch)
  stocks: BatchStock[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

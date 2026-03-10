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

export enum SerialNumberStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  DAMAGED = 'damaged',
}

@Entity('serial_numbers')
@Index(['tenantId', 'number'], { unique: true })
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'status'])
export class SerialNumber {
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

  @Column({ name: 'warehouse_id', nullable: true })
  warehouseId?: string;

  @Column({
    type: 'enum',
    enum: SerialNumberStatus,
    default: SerialNumberStatus.AVAILABLE,
  })
  status: SerialNumberStatus;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate?: Date;

  @Column({ name: 'warranty_expiry', type: 'date', nullable: true })
  warrantyExpiry?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

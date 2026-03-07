import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

/**
 * OrderItem entity for order line items
 */
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  productId: string;

  @Column()
  productName: string;

  @Column()
  productSku: string;

  @Column({ nullable: true })
  productImage: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'jsonb', nullable: true })
  selectedVariant: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper: Calculate line total
  get lineTotal(): number {
    return this.price * this.quantity;
  }
}

import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Invoice } from '../../accounting/entities/invoice.entity';
import { Payment } from '../../payment/entities/payment.entity';

@Entity('orders')
@Index(['tenantId', 'orderNumber'], { unique: true })
@Index(['tenantId', 'customerId']) // Customer orders lookup
@Index(['tenantId', 'status']) // Status filtering
@Index(['tenantId', 'createdAt']) // Date range queries
export class Order extends BaseEntity {
  @Column({ name: 'order_number' })
  orderNumber: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  items?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations for test compatibility
  @OneToMany(() => Invoice, (invoice) => invoice.id, { nullable: true })
  invoices?: Invoice[];

  @OneToMany(() => Payment, (payment) => payment.orderId, { nullable: true })
  payments?: Payment[];

  // OrderItems stored as JSONB in items column, but exposed as array for tests
  get orderItems(): unknown[] {
    return (this.items as unknown as unknown[]) || [];
  }

  set orderItems(value: unknown[]) {
    this.items = value as unknown as Record<string, unknown>;
  }
}

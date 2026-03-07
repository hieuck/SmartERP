import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('payments')
@Index(['tenantId', 'orderId'])
@Index(['tenantId', 'status'])
export class Payment extends BaseEntity {
  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ default: 'pending' })
  status: string; // pending, processing, completed, failed, refunded

  @Column({ type: 'timestamp', name: 'payment_date', nullable: true })
  paymentDate?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_id' })
  transactionId?: string;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}

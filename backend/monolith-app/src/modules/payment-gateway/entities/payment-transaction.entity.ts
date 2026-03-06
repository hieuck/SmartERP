import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ length: 50 })
  gateway: string; // 'vnpay', 'momo', 'stripe', 'paypal'

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'VND' })
  currency: string;

  @Column({ length: 20 })
  status: string; // 'pending', 'processing', 'success', 'failed', 'refunded', 'cancelled'

  @Column({ length: 255, nullable: true, name: 'transaction_id' })
  transactionId: string; // Gateway transaction ID

  @Column({ type: 'text', nullable: true, name: 'payment_url' })
  paymentUrl: string; // Payment URL for redirect

  @Column({ length: 50, nullable: true, name: 'payment_method' })
  paymentMethod: string; // 'card', 'qr', 'bank_transfer', 'ewallet'

  @Column({ type: 'jsonb', nullable: true, name: 'customer_info' })
  customerInfo: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'gateway_response' })
  gatewayResponse: Record<string, unknown>;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

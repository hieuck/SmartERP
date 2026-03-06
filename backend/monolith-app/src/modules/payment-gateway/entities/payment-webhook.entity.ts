import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('payment_webhooks')
export class PaymentWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ length: 50 })
  gateway: string; // 'vnpay', 'momo', 'stripe', 'paypal'

  @Column({ length: 50, name: 'event_type' })
  eventType: string; // 'payment.success', 'payment.failed', 'payment.refunded'

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>; // Full webhook payload

  @Column({ length: 255, nullable: true })
  signature: string; // Webhook signature for verification

  @Column({ default: false })
  processed: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

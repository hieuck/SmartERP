import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('customers')
@Index(['tenantId', 'email'], { unique: true })
@Index(['tenantId', 'status']) // Status filtering
@Index(['tenantId', 'name']) // Name search
@Index(['tenantId', 'phone']) // Phone search
export class Customer extends BaseEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  city?: string;

  @Column({ type: 'text', nullable: true })
  state?: string;

  @Column({ type: 'text', nullable: true })
  country?: string;

  @Column({ type: 'text', nullable: true, name: 'postal_code' })
  postalCode?: string;

  @Column({ type: 'text', nullable: true, name: 'tax_id' })
  taxId?: string;

  @Column({ type: 'text', nullable: true })
  website?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'credit_limit' })
  creditLimit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'current_balance' })
  currentBalance: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}

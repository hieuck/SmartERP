import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('suppliers')
@Index(['tenantId', 'email'], { unique: true })
export class Supplier extends BaseEntity {
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

  @Column({ name: 'postal_code', type: 'text', nullable: true })
  postalCode?: string;

  @Column({ name: 'tax_id', type: 'text', nullable: true })
  taxId?: string;

  @Column({ type: 'text', nullable: true })
  website?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'payment_terms', type: 'decimal', precision: 15, scale: 2, default: 0 })
  paymentTerms: number;

  @Column({ name: 'current_balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}

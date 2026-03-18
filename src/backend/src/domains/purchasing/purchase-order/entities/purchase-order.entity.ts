import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';

@Entity('purchase_orders')
@Index(['tenantId', 'poNumber'], { unique: true })
@Index(['tenantId', 'supplierId'])
@Index(['tenantId', 'status'])
export class PurchaseOrder extends BaseEntity {
  @Column({ name: 'po_number' })
  poNumber: string;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier;

  @Column({ type: 'date', nullable: true, name: 'order_date' })
  orderDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'expected_delivery_date' })
  expectedDeliveryDate?: Date;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'shipping_fee' })
  shippingFee: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'text', nullable: true, name: 'delivery_address' })
  deliveryAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'payment_terms' })
  paymentTerms?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', default: '[]' })
  items: Record<string, unknown>[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}

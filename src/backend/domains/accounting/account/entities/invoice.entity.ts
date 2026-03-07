import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum InvoiceType {
  SALES = 'sales',
  PURCHASE = 'purchase',
}

@Entity('invoices')
@Index(['tenantId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'invoiceDate'])
export class Invoice extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'invoice_number' })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: InvoiceType,
  })
  type: InvoiceType;

  @Column({ type: 'uuid', name: 'customer_id', nullable: true })
  customerId?: string;

  @Column({ type: 'uuid', name: 'supplier_id', nullable: true })
  supplierId?: string;

  @Column({ type: 'date', name: 'invoice_date' })
  invoiceDate: Date;

  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'subtotal' })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'tax_amount', default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'paid_amount', default: 0 })
  paidAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string; // draft, sent, paid, overdue, cancelled

  @Column({ type: 'jsonb', nullable: true })
  items: Record<string, unknown>; // Array of invoice items

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

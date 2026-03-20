import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { ShippingStatus } from '../enums/shipping-status.enum';

import { OrderItem } from './order-item.entity';
import { User } from '@/common/security/permission.service';

/**
 * Order entity for eCommerce orders
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string; // ORD-YYYY-NNNN

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'cart_id', nullable: true })
  cartId: string; // Reference to original cart

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    name: 'shipping_status',
    type: 'enum',
    enum: ShippingStatus,
    default: ShippingStatus.PENDING,
  })
  shippingStatus: ShippingStatus;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  // Coupon
  @Column({ name: 'coupon_code', nullable: true })
  couponCode: string;

  // Customer info
  @Column({ name: 'customer_email' })
  customerEmail: string;

  @Column({ name: 'customer_phone', nullable: true })
  customerPhone: string;

  // Addresses (JSON for flexibility)
  @Column({ name: 'shipping_address', type: 'jsonb' })
  shippingAddress: unknown;

  @Column({ name: 'billing_address', type: 'jsonb' })
  billingAddress: unknown;

  // Payment info
  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string; // stripe, paypal, vnpay, momo, cod

  @Column({ name: 'payment_transaction_id', nullable: true })
  paymentTransactionId: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  // Shipping info
  @Column({ name: 'shipping_method', nullable: true })
  shippingMethod: string;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  // Notes
  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes: string;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string;

  // Cancellation
  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Auto-generate order number
  @BeforeInsert()
  generateOrderNumber() {
    if (!this.orderNumber) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      this.orderNumber = `ORD-${year}-${random}`;
    }
  }

  // Calculate totals from items
  @BeforeInsert()
  @BeforeUpdate()
  calculateTotals() {
    if (!this.items || this.items.length === 0) {
      this.subtotal = 0;
      this.total = 0;
      return;
    }

    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    // Calculate total
    this.total = this.subtotal + this.tax + this.shipping - this.discount;

    // Ensure total is not negative
    if (this.total < 0) {
      this.total = 0;
    }
  }

  // Validation
  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (!this.customerEmail || this.customerEmail.trim().length === 0) {
      throw new Error('Customer email is required');
    }

    if (!this.shippingAddress) {
      throw new Error('Shipping address is required');
    }

    if (!this.billingAddress) {
      throw new Error('Billing address is required');
    }

    if (this.tax < 0) {
      throw new Error('Tax must be non-negative');
    }

    if (this.shipping < 0) {
      throw new Error('Shipping must be non-negative');
    }

    if (this.discount < 0) {
      throw new Error('Discount must be non-negative');
    }
  }

  // Helper: Get total item count
  get itemCount(): number {
    if (!this.items) return 0;
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Helper: Check if order is paid
  get isPaid(): boolean {
    return this.paymentStatus === PaymentStatus.PAID;
  }

  // Helper: Check if order can be cancelled
  get canBeCancelled(): boolean {
    return this.status === OrderStatus.PENDING || this.status === OrderStatus.CONFIRMED;
  }

  // Helper: Check if order is completed
  get isCompleted(): boolean {
    return (
      this.status === OrderStatus.DELIVERED ||
      this.status === OrderStatus.CANCELLED ||
      this.status === OrderStatus.REFUNDED
    );
  }
}

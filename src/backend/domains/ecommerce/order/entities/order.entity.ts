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
import { User as UserEntity } from '../../../../core/user/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { User } from '@/common/security/permission.service';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum ShippingStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
}

/**
 * Order entity for eCommerce orders
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string; // ORD-YYYY-NNNN

  @Column({ nullable: true })
  customerId: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ nullable: true })
  cartId: string; // Reference to original cart

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
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

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  // Coupon
  @Column({ nullable: true })
  couponCode: string;

  // Customer info
  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  // Addresses (JSON for flexibility)
  @Column({ type: 'jsonb' })
  shippingAddress: any;

  @Column({ type: 'jsonb' })
  billingAddress: any;

  // Payment info
  @Column({ nullable: true })
  paymentMethod: string; // stripe, paypal, vnpay, momo, cod

  @Column({ nullable: true })
  paymentTransactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  // Shipping info
  @Column({ nullable: true })
  shippingMethod: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  // Notes
  @Column({ type: 'text', nullable: true })
  customerNotes: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  // Cancellation
  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
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
    this.subtotal = this.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

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
    return (
      this.status === OrderStatus.PENDING ||
      this.status === OrderStatus.CONFIRMED
    );
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

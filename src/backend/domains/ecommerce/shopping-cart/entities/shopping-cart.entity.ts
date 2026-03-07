import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../../../core/user/entities/user.entity';
import { CartItem } from './cart-item.entity';

export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  CONVERTED = 'converted', // Converted to order
  EXPIRED = 'expired',
}

/**
 * ShoppingCart entity for eCommerce cart management
 */
@Entity('shopping_carts')
export class ShoppingCart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionId: string; // For guest users

  @Column({ nullable: true })
  userId: string; // For logged-in users

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.ACTIVE })
  status: CartStatus;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItem[];

  // Totals (computed from items)
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

  // Coupon/Discount
  @Column({ nullable: true })
  couponCode: string;

  // Shipping address (JSON for flexibility)
  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: any;

  // Billing address (JSON for flexibility)
  @Column({ type: 'jsonb', nullable: true })
  billingAddress: any;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Expiry (for abandoned cart recovery)
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  convertedAt: Date; // When converted to order

  @Column({ nullable: true })
  orderId: string; // Reference to created order

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

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

    // Calculate total (subtotal + tax + shipping - discount)
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
    if (!this.sessionId || this.sessionId.trim().length === 0) {
      throw new Error('Session ID is required');
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

  // Helper: Check if cart is empty
  get isEmpty(): boolean {
    return !this.items || this.items.length === 0;
  }

  // Helper: Check if cart is expired
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }
}

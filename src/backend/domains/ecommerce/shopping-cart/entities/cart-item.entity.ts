import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ShoppingCart } from './shopping-cart.entity';
import { ProductCatalog } from '../../product-catalog/entities/product-catalog.entity';

/**
 * CartItem entity for items in shopping cart
 */
@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ShoppingCart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: ShoppingCart;

  @Column()
  cartId: string;

  @ManyToOne(() => ProductCatalog)
  @JoinColumn({ name: 'productId' })
  product: ProductCatalog;

  @Column()
  productId: string;

  // Product snapshot (in case product changes/deleted)
  @Column()
  productName: string;

  @Column()
  productSku: string;

  @Column({ nullable: true })
  productImage: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Price at time of adding to cart

  @Column({ default: 1 })
  quantity: number;

  // Variant selection (JSON for flexibility)
  @Column({ type: 'jsonb', nullable: true })
  selectedVariant: any; // { size: 'M', color: 'Red' }

  // Custom options/notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  tenantId: string;

  // Validation
  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (this.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (this.price < 0) {
      throw new Error('Price must be non-negative');
    }

    if (!this.productName || this.productName.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (!this.productSku || this.productSku.trim().length === 0) {
      throw new Error('Product SKU is required');
    }
  }

  // Helper: Get line total
  get lineTotal(): number {
    return this.quantity * this.price;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart, CartStatus } from './entities/shopping-cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductCatalog } from '../product-catalog/entities/product-catalog.entity';
import { User } from '../../../core/user/entities/user.entity';

@Injectable()
export class ShoppingCartService {
  constructor(
    @InjectRepository(ShoppingCart)
    private readonly cartRepository: Repository<ShoppingCart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductCatalog)
    private readonly productRepository: Repository<ProductCatalog>,
  ) {}

  async getOrCreateCart(sessionId: string, tenantId: string, userId?: string): Promise<ShoppingCart> {
    let cart = await this.cartRepository.findOne({
      where: { sessionId, tenantId, status: CartStatus.ACTIVE },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        sessionId,
        userId,
        tenantId,
        status: CartStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      cart = await this.cartRepository.save(cart);
    }
    return cart;
  }

  async findOne(id: string, tenantId: string): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findOne({
      where: { id, tenantId },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart with ID ${id} not found`);
    }
    return cart;
  }

  async findBySession(sessionId: string, tenantId: string): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findOne({
      where: { sessionId, tenantId, status: CartStatus.ACTIVE },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart with session ${sessionId} not found`);
    }
    return cart;
  }

  async addItem(
    sessionId: string,
    productId: string,
    quantity: number,
    tenantId: string,
    userId?: string,
    selectedVariant?: any,
  ): Promise<ShoppingCart> {
    const cart = await this.getOrCreateCart(sessionId, tenantId, userId);
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    if (!product.isPublished) {
      throw new BadRequestException('Product is not available');
    }
    if (product.trackInventory && product.stockQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const existingItem = cart.items?.find(
      (item) => item.productId === productId &&
        JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant),
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImage: product.featuredImage,
        price: product.price,
        quantity,
        selectedVariant,
        tenantId,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.findOne(cart.id, tenantId);
  }

  async updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
    tenantId: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    if (quantity <= 0) {
      await this.cartItemRepository.remove(item);
    } else {
      const product = await this.productRepository.findOne({
        where: { id: item.productId, tenantId },
      });

      if (product?.trackInventory && product.stockQuantity < quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      item.quantity = quantity;
      await this.cartItemRepository.save(item);
    }

    return this.findOne(cartId, tenantId);
  }

  async removeItem(
    cartId: string,
    itemId: string,
    tenantId: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    await this.cartItemRepository.remove(item);
    return this.findOne(cartId, tenantId);
  }

  async clearCart(cartId: string, tenantId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }
    return this.findOne(cartId, tenantId);
  }

  async applyCoupon(
    cartId: string,
    couponCode: string,
    tenantId: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    cart.couponCode = couponCode;
    await this.cartRepository.save(cart);
    return this.findOne(cartId, tenantId);
  }

  async removeCoupon(cartId: string, tenantId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    cart.couponCode = null;
    cart.discount = 0;
    await this.cartRepository.save(cart);
    return this.findOne(cartId, tenantId);
  }

  async updateShippingAddress(
    cartId: string,
    address: any,
    tenantId: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    cart.shippingAddress = address;
    await this.cartRepository.save(cart);
    return this.findOne(cartId, tenantId);
  }

  async updateBillingAddress(
    cartId: string,
    address: any,
    tenantId: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    cart.billingAddress = address;
    await this.cartRepository.save(cart);
    return this.findOne(cartId, tenantId);
  }

  async convertToOrder(
    cartId: string,
    orderId: string,
    tenantId: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    cart.status = CartStatus.CONVERTED;
    cart.orderId = orderId;
    cart.convertedAt = new Date();
    await this.cartRepository.save(cart);
    return cart;
  }

  async markAsAbandoned(cartId: string, tenantId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(cartId, tenantId);
    cart.status = CartStatus.ABANDONED;
    await this.cartRepository.save(cart);
    return cart;
  }

  async findAbandonedCarts(tenantId: string): Promise<ShoppingCart[]> {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.cartRepository
      .createQueryBuilder('cart')
      .where('cart.tenantId = :tenantId', { tenantId })
      .andWhere('cart.status = :status', { status: CartStatus.ACTIVE })
      .andWhere('cart.updatedAt < :cutoffDate', { cutoffDate })
      .andWhere('cart.items IS NOT NULL')
      .leftJoinAndSelect('cart.items', 'items')
      .getMany();
  }
}

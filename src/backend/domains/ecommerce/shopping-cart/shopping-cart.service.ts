import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart, CartStatus } from './entities/shopping-cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductCatalog } from '../product-catalog/entities/product-catalog.entity';
import { User } from '@/common/security/permission.service';

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

  async getOrCreateCart(user: User, sessionId: string): Promise<ShoppingCart> {
    let cart = await this.cartRepository.findOne({
      where: { sessionId, tenantId: user.tenantId, status: CartStatus.ACTIVE },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        sessionId,
        userId: user.id,
        tenantId: user.tenantId,
        status: CartStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      cart = await this.cartRepository.save(cart);
    }
    return cart;
  }

  async findOne(user: User, id: string): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart with ID ${id} not found`);
    }
    return cart;
  }

  async findBySession(user: User, sessionId: string): Promise<ShoppingCart> {
    const cart = await this.cartRepository.findOne({
      where: { sessionId, tenantId: user.tenantId, status: CartStatus.ACTIVE },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart with session ${sessionId} not found`);
    }
    return cart;
  }

  async addItem(
    user: User,
    sessionId: string,
    dto: { productId: string; quantity: number; selectedVariant?: any },
  ): Promise<ShoppingCart> {
    const cart = await this.getOrCreateCart(user, sessionId);
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, tenantId: user.tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }
    if (!product.isPublished) {
      throw new BadRequestException('Product is not available');
    }
    if (product.trackInventory && product.stockQuantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const existingItem = cart.items?.find(
      (item) => item.productId === dto.productId &&
        JSON.stringify(item.selectedVariant) === JSON.stringify(dto.selectedVariant),
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImage: product.featuredImage,
        price: product.price,
        quantity: dto.quantity,
        selectedVariant: dto.selectedVariant,
        tenantId: user.tenantId,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.findOne(user, cart.id);
  }

  async updateItemQuantity(
    user: User,
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    if (quantity <= 0) {
      await this.cartItemRepository.remove(item);
    } else {
      const product = await this.productRepository.findOne({
        where: { id: item.productId, tenantId: user.tenantId },
      });

      if (product?.trackInventory && product.stockQuantity < quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      item.quantity = quantity;
      await this.cartItemRepository.save(item);
    }

    return this.findOne(user, cartId);
  }

  async removeItem(
    user: User,
    cartId: string,
    itemId: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    await this.cartItemRepository.remove(item);
    return this.findOne(user, cartId);
  }

  async clearCart(user: User, cartId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }
    return this.findOne(user, cartId);
  }

  async applyCoupon(
    user: User,
    cartId: string,
    couponCode: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.couponCode = couponCode;
    await this.cartRepository.save(cart);
    return this.findOne(user, cartId);
  }

  async removeCoupon(user: User, cartId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.couponCode = null;
    cart.discount = 0;
    await this.cartRepository.save(cart);
    return this.findOne(user, cartId);
  }

  async updateShippingAddress(
    user: User,
    cartId: string,
    address: any,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.shippingAddress = address;
    await this.cartRepository.save(cart);
    return this.findOne(user, cartId);
  }

  async updateBillingAddress(
    user: User,
    cartId: string,
    address: any,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.billingAddress = address;
    await this.cartRepository.save(cart);
    return this.findOne(user, cartId);
  }

  async convertToOrder(
    user: User,
    cartId: string,
    orderId: string,
  ): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.status = CartStatus.CONVERTED;
    cart.orderId = orderId;
    cart.convertedAt = new Date();
    await this.cartRepository.save(cart);
    return cart;
  }

  async markAsAbandoned(user: User, cartId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.status = CartStatus.ABANDONED;
    await this.cartRepository.save(cart);
    return cart;
  }

  async findAbandonedCarts(user: User): Promise<ShoppingCart[]> {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.cartRepository
      .createQueryBuilder('cart')
      .where('cart.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('cart.status = :status', { status: CartStatus.ACTIVE })
      .andWhere('cart.updatedAt < :cutoffDate', { cutoffDate })
      .andWhere('cart.items IS NOT NULL')
      .leftJoinAndSelect('cart.items', 'items')
      .getMany();
  }
}

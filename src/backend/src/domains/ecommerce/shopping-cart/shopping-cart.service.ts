import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCatalog } from '../product-catalog/entities/product-catalog.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartStatus, ShoppingCart } from './entities/shopping-cart.entity';

@Injectable()
export class ShoppingCartService {
  private readonly secureCartRepo: SecureRepository<ShoppingCart>;
  private readonly secureCartItemRepo: SecureRepository<CartItem>;
  private readonly secureProductRepo: SecureRepository<ProductCatalog>;

  constructor(
    @InjectRepository(ShoppingCart)
    private readonly cartRepository: Repository<ShoppingCart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductCatalog)
    private readonly productRepository: Repository<ProductCatalog>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureCartRepo = new SecureRepository(
      this.cartRepository,
      this.permissionService,
      'ShoppingCart',
    );
    this.secureCartItemRepo = new SecureRepository(
      this.cartItemRepository,
      this.permissionService,
      'CartItem',
    );
    this.secureProductRepo = new SecureRepository(
      this.productRepository,
      this.permissionService,
      'ProductCatalog',
    );
  }

  async getOrCreateCart(user: User, sessionId: string): Promise<ShoppingCart> {
    let cart = await this.secureCartRepo.findOne(user, {
      where: { sessionId, status: CartStatus.ACTIVE },
      relations: ['items'],
    });

    if (!cart) {
      const newCart = {
        sessionId,
        userId: user.id,
        tenantId: user.tenantId,
        status: CartStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: user.id,
      };
      cart = await this.secureCartRepo.save(user, newCart);
    }
    return cart;
  }

  async findOne(user: User, id: string): Promise<ShoppingCart> {
    const cart = await this.secureCartRepo.findOne(user, {
      where: { id },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart with ID ${id} not found`);
    }
    return cart;
  }

  async findBySession(user: User, sessionId: string): Promise<ShoppingCart> {
    const cart = await this.secureCartRepo.findOne(user, {
      where: { sessionId, status: CartStatus.ACTIVE },
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
    const product = await this.secureProductRepo.findOne(user, {
      where: { id: dto.productId },
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
      (item) =>
        item.productId === dto.productId &&
        JSON.stringify(item.selectedVariant) === JSON.stringify(dto.selectedVariant),
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      await this.secureCartItemRepo.save(user, existingItem);
    } else {
      const newCartItem = {
        cartId: cart.id,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImage: product.featuredImage,
        price: product.price,
        quantity: dto.quantity,
        selectedVariant: dto.selectedVariant,
        tenantId: user.tenantId,
        createdBy: user.id,
      };
      await this.secureCartItemRepo.save(user, newCartItem);
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
      await this.secureCartItemRepo.remove(user, item);
    } else {
      const product = await this.secureProductRepo.findOne(user, {
        where: { id: item.productId },
      });

      if (product?.trackInventory && product.stockQuantity < quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      item.quantity = quantity;
      await this.secureCartItemRepo.save(user, item);
    }

    return this.findOne(user, cartId);
  }

  async removeItem(user: User, cartId: string, itemId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    await this.secureCartItemRepo.remove(user, item);
    return this.findOne(user, cartId);
  }

  async clearCart(user: User, cartId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    if (cart.items && cart.items.length > 0) {
      for (const item of cart.items) {
        await this.secureCartItemRepo.remove(user, item);
      }
    }
    return this.findOne(user, cartId);
  }

  async applyCoupon(user: User, cartId: string, couponCode: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.couponCode = couponCode;
    await this.secureCartRepo.save(user, cart);
    return this.findOne(user, cartId);
  }

  async removeCoupon(user: User, cartId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.couponCode = null;
    cart.discount = 0;
    await this.secureCartRepo.save(user, cart);
    return this.findOne(user, cartId);
  }

  async updateShippingAddress(user: User, cartId: string, address: any): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.shippingAddress = address;
    await this.secureCartRepo.save(user, cart);
    return this.findOne(user, cartId);
  }

  async updateBillingAddress(user: User, cartId: string, address: any): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.billingAddress = address;
    await this.secureCartRepo.save(user, cart);
    return this.findOne(user, cartId);
  }

  async convertToOrder(user: User, cartId: string, orderId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.status = CartStatus.CONVERTED;
    cart.orderId = orderId;
    cart.convertedAt = new Date();
    await this.secureCartRepo.save(user, cart);
    return cart;
  }

  async markAsAbandoned(user: User, cartId: string): Promise<ShoppingCart> {
    const cart = await this.findOne(user, cartId);
    cart.status = CartStatus.ABANDONED;
    await this.secureCartRepo.save(user, cart);
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

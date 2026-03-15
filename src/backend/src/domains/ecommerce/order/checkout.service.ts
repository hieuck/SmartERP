import { PermissionService, User } from '@common/security/permission.service';
import { SecureRepository } from '@common/security/secure-repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart } from '@domains/ecommerce/shopping-cart/entities/shopping-cart.entity';
import { Address } from '@domains/ecommerce/shopping-cart/interfaces/address.interface';
import { CheckoutDto } from './dto/checkout.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../enums/ecommerce.enum';
import { CartStatus } from '@domains/ecommerce/shopping-cart/enums/cart-status.enum';

/**
 * CheckoutService handles checkout flow and order creation from cart
 */
@Injectable()
export class CheckoutService {
  private readonly secureOrderRepo: SecureRepository<Order>;
  private readonly secureOrderItemRepo: SecureRepository<OrderItem>;
  private readonly secureCartRepo: SecureRepository<ShoppingCart>;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(ShoppingCart)
    private readonly cartRepository: Repository<ShoppingCart>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureOrderRepo = new SecureRepository(
      this.orderRepository,
      this.permissionService,
      'Order',
    );
    this.secureOrderItemRepo = new SecureRepository(
      this.orderItemRepository,
      this.permissionService,
      'OrderItem',
    );
    this.secureCartRepo = new SecureRepository(
      this.cartRepository,
      this.permissionService,
      'ShoppingCart',
    );
  }

  /**
   * Convert AddressDto to Address format
   */
  private convertToAddress(addressDto: unknown): Address {
    return {
      fullName: addressDto.fullName,
      phone: addressDto.phone,
      address:
        addressDto.addressLine1 + (addressDto.addressLine2 ? `, ${addressDto.addressLine2}` : ''),
      city: addressDto.city,
      district: addressDto.state || '',
      ward: '',
      postalCode: addressDto.postalCode,
      country: addressDto.country,
    };
  }

  /**
   * Initiate checkout process
   */
  async initiateCheckout(
    dto: CheckoutDto,
    user: User,
  ): Promise<{ cart: ShoppingCart; tax: number; shipping: number; total: number }> {
    // Get cart
    const cart = await this.secureCartRepo.findOne(user, {
      where: { id: dto.cartId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${dto.cartId} not found`);
    }

    // Validate cart
    await this.validateCart(cart);

    // Convert address
    const shippingAddress = this.convertToAddress(dto.shippingAddress);

    // Calculate tax
    const tax = await this.calculateTax(cart, shippingAddress);

    // Calculate shipping
    const shipping = await this.calculateShipping(cart, shippingAddress, dto.shippingMethod);

    // Calculate total
    const total = cart.subtotal + tax + shipping - (cart.discount || 0);

    return { cart, tax, shipping, total };
  }

  /**
   * Create order from cart
   */
  async createOrderFromCart(dto: CheckoutDto, user: User): Promise<Order> {
    // Initiate checkout to get calculations
    const { cart, tax, shipping, total } = await this.initiateCheckout(dto, user);

    // Convert addresses
    const shippingAddress = this.convertToAddress(dto.shippingAddress);
    const billingAddress = dto.billingAddress
      ? this.convertToAddress(dto.billingAddress)
      : shippingAddress;

    // Create order
    const newOrder = this.orderRepository.create({
      customerId: user.id,
      cartId: cart.id,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      shippingStatus: ShippingStatus.PENDING,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      shippingAddress,
      billingAddress,
      shippingMethod: dto.shippingMethod,
      paymentMethod: dto.paymentMethod,
      couponCode: cart.couponCode,
      subtotal: cart.subtotal,
      tax,
      shipping,
      discount: cart.discount || 0,
      total,
      customerNotes: dto.customerNotes,
      tenantId: user.tenantId,
    });

    // Create order items from cart items
    newOrder.items = cart.items.map((cartItem) =>
      this.orderItemRepository.create({
        productId: cartItem.productId,
        productName: cartItem.productName,
        productSku: cartItem.productSku,
        productImage: cartItem.productImage,
        price: cartItem.price,
        quantity: cartItem.quantity,
        selectedVariant: cartItem.selectedVariant,
        notes: cartItem.notes,
        tenantId: user.tenantId,
      }),
    );

    // Save order (cascade will save items)
    const savedOrder = await this.secureOrderRepo.save(user, newOrder);

    // Mark cart as converted
    cart.status = CartStatus.CONVERTED;
    cart.orderId = savedOrder.id;
    cart.convertedAt = new Date();
    await this.secureCartRepo.save(user, cart);

    return savedOrder;
  }

  /**
   * Validate cart before checkout
   */
  async validateCart(cart: ShoppingCart): Promise<void> {
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Check if cart is expired
    if (cart.expiresAt && cart.expiresAt < new Date()) {
      throw new BadRequestException('Cart has expired');
    }

    // Validate each item
    for (const item of cart.items) {
      // Check if product still exists and is available
      if (item.product) {
        if (!item.product.isPublished) {
          throw new BadRequestException(`Product ${item.productName} is no longer available`);
        }

        // Check stock
        if (item.product.trackInventory && item.product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${item.productName}. Available: ${item.product.stockQuantity}`,
          );
        }
      }
    }
  }

  /**
   * Calculate tax based on cart and shipping address
   * TODO: Implement actual tax calculation logic based on business rules
   */
  async calculateTax(cart: ShoppingCart, _shippingAddress: Address): Promise<number> {
    // Simple tax calculation: 10% of subtotal
    // In production, this should use actual tax rules based on location
    const taxRate = 0.1; // 10%
    return cart.subtotal * taxRate;
  }

  /**
   * Calculate shipping cost based on cart, address, and method
   * TODO: Implement actual shipping calculation logic
   */
  async calculateShipping(
    cart: ShoppingCart,
    _shippingAddress: Address,
    shippingMethod?: string,
  ): Promise<number> {
    // Simple shipping calculation
    // In production, this should integrate with shipping providers
    const shippingRates = {
      standard: 20000, // 20k VND
      express: 50000, // 50k VND
      overnight: 100000, // 100k VND
    };

    const method = shippingMethod || 'standard';
    return shippingRates[method] || shippingRates.standard;
  }
}

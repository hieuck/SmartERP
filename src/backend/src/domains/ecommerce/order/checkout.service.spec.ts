import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ShoppingCart } from '@domains/ecommerce/shopping-cart/entities/shopping-cart.entity';
import { PermissionService, User } from '@common/security/permission.service';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../enums/ecommerce.enum';
import { CartStatus } from '@domains/ecommerce/shopping-cart/enums/cart-status.enum';
import { CheckoutDto } from './dto/checkout.dto';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let cartRepository: jest.Mocked<Repository<ShoppingCart>>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['customer'],
  };

  const mockAddress = {
    fullName: 'John Doe',
    phone: '+84901234567',
    addressLine1: '123 Main St',
    city: 'Ho Chi Minh City',
    postalCode: '700000',
    country: 'Vietnam',
  };

  const mockCheckoutDto: CheckoutDto = {
    cartId: 'cart-123',
    customerEmail: 'customer@example.com',
    customerPhone: '+84901234567',
    shippingAddress: mockAddress,
    shippingMethod: 'standard',
    paymentMethod: 'stripe',
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    sku: 'TEST-001',
    price: 100000,
    isPublished: true,
    trackInventory: true,
    stockQuantity: 10,
  };

  const mockCartItem = {
    id: 'item-123',
    cartId: 'cart-123',
    productId: 'product-123',
    productName: 'Test Product',
    productSku: 'TEST-001',
    productImage: 'image.jpg',
    price: 100000,
    quantity: 2,
    product: mockProduct,
    selectedVariant: null,
    notes: null,
  };

  const mockCart = {
    id: 'cart-123',
    sessionId: 'session-123',
    userId: 'user-123',
    status: CartStatus.ACTIVE,
    items: [mockCartItem as any],
    subtotal: 200000,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 200000,
    couponCode: null,
    shippingAddress: null,
    billingAddress: null,
    notes: null,
    expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
    convertedAt: null,
    orderId: null,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    calculateTotals: jest.fn(),
    validate: jest.fn(),
    get itemCount() { return this.items.reduce((sum, item) => sum + item.quantity, 0); },
    get isEmpty() { return !this.items || this.items.length === 0; },
    get isExpired() { return this.expiresAt && new Date() > this.expiresAt; },
  } as unknown as ShoppingCart;

  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'ORD-2024-0001',
    customerId: 'user-123',
    cartId: 'cart-123',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    shippingStatus: ShippingStatus.PENDING,
    items: [],
    subtotal: 200000,
    tax: 20000,
    shipping: 20000,
    discount: 0,
    total: 240000,
    couponCode: null,
    customerEmail: 'customer@example.com',
    customerPhone: '+84901234567',
    shippingAddress: {
      fullName: 'John Doe',
      phone: '+84901234567',
      address: '123 Main St',
      city: 'Ho Chi Minh City',
      district: '',
      ward: '',
      postalCode: '700000',
      country: 'Vietnam',
    },
    billingAddress: {
      fullName: 'John Doe',
      phone: '+84901234567',
      address: '123 Main St',
      city: 'Ho Chi Minh City',
      district: '',
      ward: '',
      postalCode: '700000',
      country: 'Vietnam',
    },
    paymentMethod: 'stripe',
    paymentTransactionId: null,
    paidAt: null,
    shippingMethod: 'standard',
    trackingNumber: null,
    shippedAt: null,
    deliveredAt: null,
    customerNotes: null,
    internalNotes: null,
    cancelledBy: null,
    cancellationReason: null,
    cancelledAt: null,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Order;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShoppingCart),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
          },
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    cartRepository = module.get(getRepositoryToken(ShoppingCart));
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateCheckout', () => {
    it('should initiate checkout successfully', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.initiateCheckout(mockCheckoutDto, mockUser);

      expect(cartRepository.findOne).toHaveBeenCalled();
      expect(result).toHaveProperty('cart');
      expect(result).toHaveProperty('tax');
      expect(result).toHaveProperty('shipping');
      expect(result).toHaveProperty('total');
      expect(result.cart).toEqual(mockCart);
      expect(result.tax).toBe(20000); // 10% of 200000
      expect(result.shipping).toBe(20000); // standard shipping
      expect(result.total).toBe(240000); // 200000 + 20000 + 20000
    });

    it('should throw NotFoundException when cart not found', async () => {
      cartRepository.findOne.mockResolvedValue(null);

      await expect(
        service.initiateCheckout(mockCheckoutDto, mockUser),
      ).rejects.toThrow(NotFoundException);

      expect(cartRepository.findOne).toHaveBeenCalled();
    });

    it('should throw BadRequestException when cart is empty', async () => {
      const emptyCart = {
        ...mockCart,
        items: [],
        get isEmpty() { return true; },
      } as unknown as ShoppingCart;
      cartRepository.findOne.mockResolvedValue(emptyCart);

      await expect(
        service.initiateCheckout(mockCheckoutDto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when cart is expired', async () => {
      const expiredCart = {
        ...mockCart,
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
        get isExpired() { return true; },
      } as unknown as ShoppingCart;
      cartRepository.findOne.mockResolvedValue(expiredCart);

      await expect(
        service.initiateCheckout(mockCheckoutDto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate express shipping cost correctly', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      const expressDto = { ...mockCheckoutDto, shippingMethod: 'express' };

      const result = await service.initiateCheckout(expressDto, mockUser);

      expect(result.shipping).toBe(50000); // express shipping
    });

    it('should calculate overnight shipping cost correctly', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      const overnightDto = { ...mockCheckoutDto, shippingMethod: 'overnight' };

      const result = await service.initiateCheckout(overnightDto, mockUser);

      expect(result.shipping).toBe(100000); // overnight shipping
    });
  });

  describe('createOrderFromCart', () => {
    it('should create order from cart successfully', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      orderRepository.create.mockReturnValue(mockOrder);
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockResolvedValue(mockOrder);
      cartRepository.save.mockResolvedValue(mockCart);

      const result = await service.createOrderFromCart(mockCheckoutDto, mockUser);

      expect(cartRepository.findOne).toHaveBeenCalled();
      expect(orderRepository.create).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(cartRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should mark cart as converted after order creation', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      orderRepository.create.mockReturnValue(mockOrder);
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockResolvedValue(mockOrder);
      cartRepository.save.mockResolvedValue(mockCart);

      await service.createOrderFromCart(mockCheckoutDto, mockUser);

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CartStatus.CONVERTED,
          orderId: mockOrder.id,
          convertedAt: expect.any(Date),
        }),
      );
    });

    it('should use shipping address as billing address when billing address not provided', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      orderRepository.create.mockReturnValue(mockOrder);
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockResolvedValue(mockOrder);
      cartRepository.save.mockResolvedValue(mockCart);

      await service.createOrderFromCart(mockCheckoutDto, mockUser);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: expect.any(Object),
          billingAddress: expect.any(Object),
        }),
      );
    });

    it('should create order items from cart items', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      orderRepository.create.mockReturnValue(mockOrder);
      orderItemRepository.create.mockImplementation((data) => data as any);
      orderRepository.save.mockResolvedValue(mockOrder);
      cartRepository.save.mockResolvedValue(mockCart);

      await service.createOrderFromCart(mockCheckoutDto, mockUser);

      expect(orderItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: mockCartItem.productId,
          productName: mockCartItem.productName,
          productSku: mockCartItem.productSku,
          price: mockCartItem.price,
          quantity: mockCartItem.quantity,
        }),
      );
    });
  });

  describe('validateCart', () => {
    it('should validate cart successfully', async () => {
      await expect(service.validateCart(mockCart)).resolves.not.toThrow();
    });

    it('should throw BadRequestException when cart is empty', async () => {
      const emptyCart = {
        ...mockCart,
        items: [],
        get isEmpty() { return true; },
      } as unknown as ShoppingCart;

      await expect(service.validateCart(emptyCart)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when cart is expired', async () => {
      const expiredCart = {
        ...mockCart,
        expiresAt: new Date(Date.now() - 86400000),
        get isExpired() { return true; },
      } as unknown as ShoppingCart;

      await expect(service.validateCart(expiredCart)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when product is not published', async () => {
      const unpublishedCart = {
        ...mockCart,
        items: [
          {
            ...mockCartItem,
            product: { ...mockProduct, isPublished: false },
          },
        ],
        calculateTotals: jest.fn(),
        validate: jest.fn(),
        get itemCount() { return 2; },
        get isEmpty() { return false; },
        get isExpired() { return false; },
      } as unknown as ShoppingCart;

      await expect(service.validateCart(unpublishedCart)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const insufficientStockCart = {
        ...mockCart,
        items: [
          {
            ...mockCartItem,
            quantity: 20,
            product: { ...mockProduct, stockQuantity: 5 },
          },
        ],
        calculateTotals: jest.fn(),
        validate: jest.fn(),
        get itemCount() { return 20; },
        get isEmpty() { return false; },
        get isExpired() { return false; },
      } as unknown as ShoppingCart;

      await expect(
        service.validateCart(insufficientStockCart),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not check stock when product does not track inventory', async () => {
      const noTrackCart = {
        ...mockCart,
        items: [
          {
            ...mockCartItem,
            quantity: 100,
            product: { ...mockProduct, trackInventory: false },
          },
        ],
        calculateTotals: jest.fn(),
        validate: jest.fn(),
        get itemCount() { return 100; },
        get isEmpty() { return false; },
        get isExpired() { return false; },
      } as unknown as ShoppingCart;

      await expect(service.validateCart(noTrackCart)).resolves.not.toThrow();
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax as 10% of subtotal', async () => {
      const tax = await service.calculateTax(mockCart, mockCart.shippingAddress);

      expect(tax).toBe(20000); // 10% of 200000
    });

    it('should calculate tax correctly for different subtotals', async () => {
      const cart = {
        ...mockCart,
        subtotal: 500000,
      } as unknown as ShoppingCart;
      const tax = await service.calculateTax(cart, mockCart.shippingAddress);

      expect(tax).toBe(50000); // 10% of 500000
    });
  });

  describe('calculateShipping', () => {
    it('should calculate standard shipping cost', async () => {
      const shipping = await service.calculateShipping(
        mockCart,
        mockCart.shippingAddress,
        'standard',
      );

      expect(shipping).toBe(20000);
    });

    it('should calculate express shipping cost', async () => {
      const shipping = await service.calculateShipping(
        mockCart,
        mockCart.shippingAddress,
        'express',
      );

      expect(shipping).toBe(50000);
    });

    it('should calculate overnight shipping cost', async () => {
      const shipping = await service.calculateShipping(
        mockCart,
        mockCart.shippingAddress,
        'overnight',
      );

      expect(shipping).toBe(100000);
    });

    it('should default to standard shipping when method not specified', async () => {
      const shipping = await service.calculateShipping(
        mockCart,
        mockCart.shippingAddress,
      );

      expect(shipping).toBe(20000);
    });

    it('should default to standard shipping for unknown method', async () => {
      const shipping = await service.calculateShipping(
        mockCart,
        mockCart.shippingAddress,
        'unknown',
      );

      expect(shipping).toBe(20000);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ShoppingCartService } from './shopping-cart.service';
import { ShoppingCart } from './entities/shopping-cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductCatalog } from '@domains/ecommerce/product-catalog/entities/product-catalog.entity';
import { PermissionService, User } from '@common/security/permission.service';
import { CartStatus } from './enums/cart-status.enum';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Address } from './interfaces/address.interface';

describe('ShoppingCartService', () => {
  let _permissionService: jest.Mocked<PermissionService>;
  let service: ShoppingCartService;
  let cartRepository: jest.Mocked<Repository<ShoppingCart>>;
  let cartItemRepository: jest.Mocked<Repository<CartItem>>;
  let productRepository: jest.Mocked<Repository<ProductCatalog>>;
  let __permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['customer'],
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    sku: 'TEST-001',
    price: 100000,
    featuredImage: 'image.jpg',
    isPublished: true,
    trackInventory: true,
    stockQuantity: 10,
    tenantId: 'tenant-123',
  } as ProductCatalog;

  const mockCartItem = {
    id: 'item-123',
    cartId: 'cart-123',
    productId: 'product-123',
    productName: 'Test Product',
    productSku: 'TEST-001',
    productImage: 'image.jpg',
    price: 100000,
    quantity: 2,
    selectedVariant: null,
    notes: null,
    product: mockProduct,
    cart: null,
    tenantId: 'tenant-123',
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    validate: jest.fn(),
    get lineTotal() {
      return this.price * this.quantity;
    },
  } as unknown as CartItem;

  const mockCart = {
    id: 'cart-123',
    sessionId: 'session-123',
    userId: 'user-123',
    status: CartStatus.ACTIVE,
    items: [mockCartItem],
    subtotal: 200000,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 200000,
    couponCode: null,
    shippingAddress: null,
    billingAddress: null,
    notes: null,
    expiresAt: new Date(Date.now() + 86400000),
    convertedAt: null,
    orderId: null,
    tenantId: 'tenant-123',
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    calculateTotals: jest.fn(),
    validate: jest.fn(),
    get itemCount() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    get isEmpty() {
      return !this.items || this.items.length === 0;
    },
    get isExpired() {
      return this.expiresAt && new Date() > this.expiresAt;
    },
  } as unknown as ShoppingCart;

  const mockAddress: Address = {
    fullName: 'John Doe',
    phone: '+84901234567',
    address: '123 Main St',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    ward: 'Ward 1',
    postalCode: '700000',
    country: 'Vietnam',
  };

  const createMockQueryBuilder = () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn() as jest.Mock,
    };
    return qb as unknown as SelectQueryBuilder<ShoppingCart>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingCartService,
        {
          provide: getRepositoryToken(ShoppingCart),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: {
            save: jest.fn(),
            remove: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductCatalog),
          useValue: {
            findOne: jest.fn(),
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

    service = module.get<ShoppingCartService>(ShoppingCartService);
    cartRepository = module.get(getRepositoryToken(ShoppingCart));
    cartItemRepository = module.get(getRepositoryToken(CartItem));
    productRepository = module.get(getRepositoryToken(ProductCatalog));
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart if found', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(mockUser, 'session-123');

      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: 'session-123', status: CartStatus.ACTIVE },
        relations: ['items'],
      });
      expect(result).toEqual(mockCart);
    });

    it('should create new cart if not found', async () => {
      cartRepository.findOne.mockResolvedValue(null);
      cartRepository.save.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(mockUser, 'session-123');

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          userId: mockUser.id,
          tenantId: mockUser.tenantId,
          status: CartStatus.ACTIVE,
        }),
      );
      expect(result).toEqual(mockCart);
    });

    it('should set expiry date 30 days from now', async () => {
      cartRepository.findOne.mockResolvedValue(null);
      cartRepository.save.mockResolvedValue(mockCart);

      await service.getOrCreateCart(mockUser, 'session-123');

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return cart by id', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.findOne(mockUser, 'cart-123');

      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cart-123' },
        relations: ['items', 'items.product'],
      });
      expect(result).toEqual(mockCart);
    });

    it('should throw NotFoundException when cart not found', async () => {
      cartRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySession', () => {
    it('should return cart by session id', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.findBySession(mockUser, 'session-123');

      expect(cartRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: 'session-123', status: CartStatus.ACTIVE },
        relations: ['items', 'items.product'],
      });
      expect(result).toEqual(mockCart);
    });

    it('should throw NotFoundException when cart not found', async () => {
      cartRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySession(mockUser, 'invalid-session')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addItem', () => {
    const addToCartDto: AddToCartDto = {
      productId: 'product-123',
      quantity: 2,
      selectedVariant: null,
    };

    it('should add new item to cart', async () => {
      const emptyCart = { ...mockCart, items: [] } as unknown as ShoppingCart;
      cartRepository.findOne.mockResolvedValueOnce(emptyCart).mockResolvedValueOnce(mockCart);
      productRepository.findOne.mockResolvedValue(mockProduct);
      cartItemRepository.save.mockResolvedValue(mockCartItem);

      const result = await service.addItem(mockUser, 'session-123', addToCartDto);

      expect(productRepository.findOne).toHaveBeenCalled();
      expect(cartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cartId: emptyCart.id,
          productId: mockProduct.id,
          quantity: 2,
        }),
      );
      expect(result).toEqual(mockCart);
    });

    it('should update quantity if item already exists', async () => {
      cartRepository.findOne.mockResolvedValueOnce(mockCart).mockResolvedValueOnce(mockCart);
      productRepository.findOne.mockResolvedValue(mockProduct);
      cartItemRepository.save.mockResolvedValue(mockCartItem);

      await service.addItem(mockUser, 'session-123', addToCartDto);

      expect(cartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 4, // 2 existing + 2 new
        }),
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.addItem(mockUser, 'session-123', addToCartDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when product not published', async () => {
      const unpublishedProduct = { ...mockProduct, isPublished: false };
      cartRepository.findOne.mockResolvedValue(mockCart);
      productRepository.findOne.mockResolvedValue(unpublishedProduct as ProductCatalog);

      await expect(service.addItem(mockUser, 'session-123', addToCartDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const lowStockProduct = { ...mockProduct, stockQuantity: 1 };
      cartRepository.findOne.mockResolvedValue(mockCart);
      productRepository.findOne.mockResolvedValue(lowStockProduct as ProductCatalog);

      await expect(service.addItem(mockUser, 'session-123', addToCartDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      productRepository.findOne.mockResolvedValue(mockProduct);
      cartItemRepository.save.mockResolvedValue(mockCartItem);
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);

      const result = await service.updateItemQuantity(mockUser, 'cart-123', 'item-123', 5);

      expect(cartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 5,
        }),
      );
      expect(result).toEqual(mockCart);
    });

    it('should remove item when quantity is 0', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartItemRepository.remove.mockResolvedValue(mockCartItem);
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);

      await service.updateItemQuantity(mockUser, 'cart-123', 'item-123', 0);

      expect(cartItemRepository.remove).toHaveBeenCalledWith(mockCartItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      const emptyCart = { ...mockCart, items: [] } as unknown as ShoppingCart;
      cartRepository.findOne.mockResolvedValue(emptyCart);

      await expect(
        service.updateItemQuantity(mockUser, 'cart-123', 'invalid-item', 5),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const lowStockProduct = { ...mockProduct, stockQuantity: 3 };
      cartRepository.findOne.mockResolvedValue(mockCart);
      productRepository.findOne.mockResolvedValue(lowStockProduct as ProductCatalog);

      await expect(service.updateItemQuantity(mockUser, 'cart-123', 'item-123', 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartItemRepository.remove.mockResolvedValue(mockCartItem);
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);

      const result = await service.removeItem(mockUser, 'cart-123', 'item-123');

      expect(cartItemRepository.remove).toHaveBeenCalledWith(mockCartItem);
      expect(result).toEqual(mockCart);
    });

    it('should throw NotFoundException when item not found', async () => {
      const emptyCart = { ...mockCart, items: [] } as unknown as ShoppingCart;
      cartRepository.findOne.mockResolvedValue(emptyCart);

      await expect(service.removeItem(mockUser, 'cart-123', 'invalid-item')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartItemRepository.remove.mockResolvedValue(mockCartItem);
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);

      const result = await service.clearCart(mockUser, 'cart-123');

      expect(cartItemRepository.remove).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCart);
    });

    it('should handle empty cart', async () => {
      const emptyCart = { ...mockCart, items: [] } as unknown as ShoppingCart;
      cartRepository.findOne.mockResolvedValue(emptyCart);

      const result = await service.clearCart(mockUser, 'cart-123');

      expect(cartItemRepository.remove).not.toHaveBeenCalled();
      expect(result).toEqual(emptyCart);
    });
  });

  describe('applyCoupon', () => {
    it('should apply coupon to cart', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartRepository.save.mockResolvedValue(mockCart);

      const result = await service.applyCoupon(mockUser, 'cart-123', 'SAVE10');

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          couponCode: 'SAVE10',
        }),
      );
      expect(result).toEqual(mockCart);
    });
  });

  describe('removeCoupon', () => {
    it('should remove coupon from cart', async () => {
      const cartWithCoupon = {
        ...mockCart,
        couponCode: 'SAVE10',
        discount: 10000,
      } as unknown as ShoppingCart;
      const cartWithoutCoupon = {
        ...mockCart,
        couponCode: null,
        discount: 0,
      } as unknown as ShoppingCart;
      // findOne called twice: once in removeCoupon, once at the end to return updated cart
      cartRepository.findOne.mockResolvedValue(cartWithCoupon);
      cartRepository.save.mockResolvedValue(cartWithoutCoupon);

      const result = await service.removeCoupon(mockUser, 'cart-123');

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          couponCode: null,
          discount: 0,
        }),
      );
      expect(result.couponCode).toBeNull();
      expect(result.discount).toBe(0);
    });
  });

  describe('updateShippingAddress', () => {
    it('should update shipping address', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartRepository.save.mockResolvedValue(mockCart);

      const result = await service.updateShippingAddress(mockUser, 'cart-123', mockAddress);

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: mockAddress,
        }),
      );
      expect(result).toEqual(mockCart);
    });
  });

  describe('updateBillingAddress', () => {
    it('should update billing address', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      cartRepository.save.mockResolvedValue(mockCart);

      const result = await service.updateBillingAddress(mockUser, 'cart-123', mockAddress);

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          billingAddress: mockAddress,
        }),
      );
      expect(result).toEqual(mockCart);
    });
  });

  describe('convertToOrder', () => {
    it('should convert cart to order', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      const convertedCart = {
        ...mockCart,
        status: CartStatus.CONVERTED,
        orderId: 'order-123',
        convertedAt: expect.any(Date),
      } as unknown as ShoppingCart;
      cartRepository.save.mockResolvedValue(convertedCart);

      const result = await service.convertToOrder(mockUser, 'cart-123', 'order-123');

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CartStatus.CONVERTED,
          orderId: 'order-123',
          convertedAt: expect.any(Date),
        }),
      );
      expect(result.status).toBe(CartStatus.CONVERTED);
    });
  });

  describe('markAsAbandoned', () => {
    it('should mark cart as abandoned', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart);
      const abandonedCart = {
        ...mockCart,
        status: CartStatus.ABANDONED,
      } as unknown as ShoppingCart;
      cartRepository.save.mockResolvedValue(abandonedCart);

      const result = await service.markAsAbandoned(mockUser, 'cart-123');

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CartStatus.ABANDONED,
        }),
      );
      expect(result.status).toBe(CartStatus.ABANDONED);
    });
  });

  describe('findAbandonedCarts', () => {
    it('should return abandoned carts older than 24 hours', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockCart]);
      cartRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAbandonedCarts(mockUser);

      expect(qb.where).toHaveBeenCalledWith('cart.tenantId = :tenantId', {
        tenantId: mockUser.tenantId,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('cart.status = :status', {
        status: CartStatus.ACTIVE,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('cart.updatedAt < :cutoffDate', {
        cutoffDate: expect.any(Date),
      });
      expect(result).toEqual([mockCart]);
    });
  });
});

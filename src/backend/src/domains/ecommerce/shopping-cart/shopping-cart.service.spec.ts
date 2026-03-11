import { createMockUser } from '@/common/test/test-helpers';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCatalog, ProductStatus } from '../product-catalog/entities/product-catalog.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartStatus, ShoppingCart } from './entities/shopping-cart.entity';
import { ShoppingCartService } from './shopping-cart.service';

describe('ShoppingCartService', () => {
  let service: ShoppingCartService;
  let cartRepository: Repository<ShoppingCart>;
  let cartItemRepository: Repository<CartItem>;
  let productRepository: Repository<ProductCatalog>;

  const mockCartRepository = {
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCartItemRepository = {
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    findOne: jest.fn(),
  };

  const mockPermissionService = {
    canRead: jest.fn().mockResolvedValue(true),
    canWrite: jest.fn().mockResolvedValue(true),
    canDelete: jest.fn().mockResolvedValue(true),
    buildSecureQuery: jest.fn((user, query) => query),
  };

  const mockUser = { ...createMockUser(), tenantId: 'tenant-123' };

  const mockProduct = {
    id: 'prod-123',
    sku: 'PROD-001',
    name: 'Test Product',
    price: 100000,
    stockQuantity: 50,
    status: ProductStatus.ACTIVE,
    featuredImage: 'image.jpg',
    isPublished: true,
    trackInventory: true,
    tenantId: 'tenant-123',
  };

  const mockCart = {
    id: 'cart-123',
    sessionId: 'session-123',
    userId: null,
    status: CartStatus.ACTIVE,
    items: [],
    subtotal: 0,
    total: 0,
    tenantId: 'tenant-123',
  };

  const mockCartItem = {
    id: 'item-123',
    cartId: 'cart-123',
    productId: 'prod-123',
    productName: 'Test Product',
    productSku: 'PROD-001',
    price: 100000,
    quantity: 2,
    tenantId: 'tenant-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingCartService,
        {
          provide: getRepositoryToken(ShoppingCart),
          useValue: mockCartRepository,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: mockCartItemRepository,
        },
        {
          provide: getRepositoryToken(ProductCatalog),
          useValue: mockProductRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<ShoppingCartService>(ShoppingCartService);
    cartRepository = module.get<Repository<ShoppingCart>>(getRepositoryToken(ShoppingCart));
    cartItemRepository = module.get<Repository<CartItem>>(getRepositoryToken(CartItem));
    productRepository = module.get<Repository<ProductCatalog>>(getRepositoryToken(ProductCatalog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(mockUser, 'session-123');

      expect(mockCartRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: 'session-123', tenantId: 'tenant-123', status: CartStatus.ACTIVE },
        relations: ['items'],
      });
      expect(result).toEqual(mockCart);
    });

    it('should create new cart if not exists', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockReturnValue(mockCart);
      mockCartRepository.save.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(mockUser, 'session-123');

      expect(mockCartRepository.create).toHaveBeenCalled();
      expect(mockCartRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCart);
    });
  });

  describe('addItem', () => {
    it('should add item to cart', async () => {
      const dto = {
        productId: 'prod-123',
        quantity: 2,
      };

      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem],
      };

      mockCartRepository.findOne
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(cartWithItems);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockCartItemRepository.create.mockReturnValue(mockCartItem);
      mockCartItemRepository.save.mockResolvedValue(mockCartItem);

      const result = await service.addItem(mockUser, 'session-123', dto);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'prod-123', tenantId: 'tenant-123' },
      });
      expect(mockCartItemRepository.save).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('should throw BadRequestException if product out of stock', async () => {
      const dto = {
        productId: 'prod-123',
        quantity: 100,
      };

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.addItem(mockUser, 'session-123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should merge quantity if item already exists', async () => {
      const dto = {
        productId: 'prod-123',
        quantity: 2,
      };

      const existingItem = { ...mockCartItem, quantity: 1 };
      const cartWithExistingItem = {
        ...mockCart,
        items: [existingItem],
      };
      const updatedItem = { ...mockCartItem, quantity: 3 };

      mockCartRepository.findOne.mockResolvedValue(cartWithExistingItem);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockCartItemRepository.save.mockResolvedValue(updatedItem);

      await service.addItem(mockUser, 'session-123', dto);

      expect(mockCartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 3 }),
      );
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem],
      };

      const updatedItem = { ...mockCartItem, quantity: 5 };

      mockCartRepository.findOne
        .mockResolvedValueOnce(cartWithItems)
        .mockResolvedValueOnce(cartWithItems);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockCartItemRepository.save.mockResolvedValue(updatedItem);

      const result = await service.updateItemQuantity(mockUser, 'cart-123', 'item-123', 5);

      expect(mockCartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
      expect(result).toEqual(cartWithItems);
    });

    it('should throw NotFoundException if item not found', async () => {
      const cartWithoutItem = {
        ...mockCart,
        items: [],
      };

      mockCartRepository.findOne.mockResolvedValue(cartWithoutItem);

      await expect(service.updateItemQuantity(mockUser, 'cart-123', 'item-999', 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem],
      };

      const cartWithoutItems = {
        ...mockCart,
        items: [],
      };

      mockCartRepository.findOne
        .mockResolvedValueOnce(cartWithItems)
        .mockResolvedValueOnce(cartWithoutItems);
      mockCartItemRepository.remove.mockResolvedValue(mockCartItem);

      const result = await service.removeItem(mockUser, 'cart-123', 'item-123');

      expect(mockCartItemRepository.remove).toHaveBeenCalledWith(mockCartItem);
      expect(result).toEqual(cartWithoutItems);
    });

    it('should throw NotFoundException if item not found', async () => {
      const cartWithoutItem = {
        ...mockCart,
        items: [],
      };

      mockCartRepository.findOne.mockResolvedValue(cartWithoutItem);

      await expect(service.removeItem(mockUser, 'cart-123', 'item-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem],
      };

      const emptyCart = {
        ...mockCart,
        items: [],
      };

      mockCartRepository.findOne
        .mockResolvedValueOnce(cartWithItems)
        .mockResolvedValueOnce(emptyCart);
      mockCartItemRepository.remove.mockResolvedValue([mockCartItem]);

      const result = await service.clearCart(mockUser, 'cart-123');

      expect(mockCartItemRepository.remove).toHaveBeenCalled();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('applyCoupon', () => {
    it('should apply coupon to cart', async () => {
      const cartWithCoupon = {
        ...mockCart,
        couponCode: 'SUMMER2026',
        discount: 10000,
      };

      mockCartRepository.findOne
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(cartWithCoupon);
      mockCartRepository.save.mockResolvedValue(cartWithCoupon);

      const result = await service.applyCoupon(mockUser, 'cart-123', 'SUMMER2026');

      expect(result.couponCode).toBe('SUMMER2026');
    });
  });

  describe('removeCoupon', () => {
    it('should remove coupon from cart', async () => {
      const cartWithCoupon = {
        ...mockCart,
        couponCode: 'SUMMER2026',
        discount: 10000,
      };

      const cartWithoutCoupon = {
        ...mockCart,
        couponCode: null,
        discount: 0,
      };

      mockCartRepository.findOne
        .mockResolvedValueOnce(cartWithCoupon)
        .mockResolvedValueOnce(cartWithoutCoupon);
      mockCartRepository.save.mockResolvedValue(cartWithoutCoupon);

      const result = await service.removeCoupon(mockUser, 'cart-123');

      expect(result.couponCode).toBeNull();
      expect(result.discount).toBe(0);
    });
  });

  describe('updateShippingAddress', () => {
    it('should update shipping address', async () => {
      const address = {
        fullName: 'John Doe',
        phone: '0123456789',
        address: '123 Main St',
      };

      const cartWithAddress = {
        ...mockCart,
        shippingAddress: address,
      };

      mockCartRepository.findOne
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(cartWithAddress);
      mockCartRepository.save.mockResolvedValue(cartWithAddress);

      const result = await service.updateShippingAddress(mockUser, 'cart-123', address);

      expect(result.shippingAddress).toEqual(address);
    });
  });

  describe('updateBillingAddress', () => {
    it('should update billing address', async () => {
      const address = {
        fullName: 'John Doe',
        phone: '0123456789',
        address: '123 Main St',
      };

      const cartWithAddress = {
        ...mockCart,
        billingAddress: address,
      };

      mockCartRepository.findOne
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(cartWithAddress);
      mockCartRepository.save.mockResolvedValue(cartWithAddress);

      const result = await service.updateBillingAddress(mockUser, 'cart-123', address);

      expect(result.billingAddress).toEqual(address);
    });
  });

  describe('convertToOrder', () => {
    it('should convert cart to order', async () => {
      const convertedCart = {
        ...mockCart,
        status: CartStatus.CONVERTED,
        orderId: 'order-123',
        convertedAt: new Date(),
      };

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartRepository.save.mockResolvedValue(convertedCart);

      const result = await service.convertToOrder(mockUser, 'cart-123', 'order-123');

      expect(result.status).toBe(CartStatus.CONVERTED);
      expect(result.orderId).toBe('order-123');
      expect(result.convertedAt).toBeDefined();
    });
  });

  describe('markAsAbandoned', () => {
    it('should mark cart as abandoned', async () => {
      const abandonedCart = {
        ...mockCart,
        status: CartStatus.ABANDONED,
      };

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartRepository.save.mockResolvedValue(abandonedCart);

      const result = await service.markAsAbandoned(mockUser, 'cart-123');

      expect(result.status).toBe(CartStatus.ABANDONED);
    });
  });

  describe('findAbandonedCarts', () => {
    it('should return abandoned carts', async () => {
      const abandonedCarts = [{ ...mockCart, status: CartStatus.ACTIVE }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(abandonedCarts),
      };

      mockCartRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAbandonedCarts(mockUser);

      expect(result).toEqual(abandonedCarts);
      expect(mockCartRepository.createQueryBuilder).toHaveBeenCalledWith('cart');
    });
  });
});

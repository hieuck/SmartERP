import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ShoppingCartService } from './shopping-cart.service';
import { ShoppingCart, CartStatus } from './entities/shopping-cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductCatalogService } from '../product-catalog/product-catalog.service';
import { ProductStatus } from '../product-catalog/entities/product-catalog.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('ShoppingCartService', () => {
  let service: ShoppingCartService;
  let cartRepository: Repository<ShoppingCart>;
  let cartItemRepository: Repository<CartItem>;
  let productService: ProductCatalogService;

  const mockCartRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockCartItemRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockProductService = {
    findOne: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockProduct = {
    id: 'prod-123',
    sku: 'PROD-001',
    name: 'Test Product',
    price: 100000,
    stockQuantity: 50,
    status: ProductStatus.ACTIVE,
    featuredImage: 'image.jpg',
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
          provide: ProductCatalogService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    service = module.get<ShoppingCartService>(ShoppingCartService);
    cartRepository = module.get<Repository<ShoppingCart>>(
      getRepositoryToken(ShoppingCart),
    );
    cartItemRepository = module.get<Repository<CartItem>>(
      getRepositoryToken(CartItem),
    );
    productService = module.get<ProductCatalogService>(ProductCatalogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(
        'session-123',
        mockUser,
      );

      expect(mockCartRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: 'session-123', tenantId: 'tenant-123' },
        relations: ['items'],
      });
      expect(result).toEqual(mockCart);
    });

    it('should create new cart if not exists', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockReturnValue(mockCart);
      mockCartRepository.save.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(
        'session-123',
        mockUser,
      );

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

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockProductService.findOne.mockResolvedValue(mockProduct);
      mockCartItemRepository.findOne.mockResolvedValue(null);
      mockCartItemRepository.save.mockResolvedValue(mockCartItem);
      mockCartRepository.save.mockResolvedValue(cartWithItems);

      const result = await service.addItem(
        'session-123',
        dto,
        mockUser,
      );

      expect(mockProductService.findOne).toHaveBeenCalledWith(
        'prod-123',
        'tenant-123',
      );
      expect(mockCartItemRepository.save).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('should throw BadRequestException if product out of stock', async () => {
      const dto = {
        productId: 'prod-123',
        quantity: 100,
      };

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockProductService.findOne.mockResolvedValue(mockProduct);

      await expect(
        service.addItem('session-123', dto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should merge quantity if item already exists', async () => {
      const dto = {
        productId: 'prod-123',
        quantity: 2,
      };

      const existingItem = { ...mockCartItem, quantity: 1 };
      const updatedItem = { ...mockCartItem, quantity: 3 };

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockProductService.findOne.mockResolvedValue(mockProduct);
      mockCartItemRepository.findOne.mockResolvedValue(existingItem);
      mockCartItemRepository.save.mockResolvedValue(updatedItem);
      mockCartRepository.save.mockResolvedValue(mockCart);

      await service.addItem('session-123', dto, mockUser);

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

      mockCartRepository.findOne.mockResolvedValue(cartWithItems);
      mockCartItemRepository.findOne.mockResolvedValue(mockCartItem);
      mockCartItemRepository.save.mockResolvedValue(updatedItem);
      mockCartRepository.save.mockResolvedValue(cartWithItems);

      const result = await service.updateItemQuantity(
        'session-123',
        'item-123',
        5,
        mockUser,
      );

      expect(mockCartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
      expect(result).toEqual(cartWithItems);
    });

    it('should throw NotFoundException if item not found', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateItemQuantity(
          'session-123',
          'item-999',
          5,
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem],
      };

      mockCartRepository.findOne.mockResolvedValue(cartWithItems);
      mockCartItemRepository.findOne.mockResolvedValue(mockCartItem);
      mockCartItemRepository.remove.mockResolvedValue(mockCartItem);
      mockCartRepository.save.mockResolvedValue(mockCart);

      const result = await service.removeItem(
        'session-123',
        'item-123',
        mockUser,
      );

      expect(mockCartItemRepository.remove).toHaveBeenCalledWith(mockCartItem);
      expect(result).toEqual(mockCart);
    });

    it('should throw NotFoundException if item not found', async () => {
      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeItem('session-123', 'item-999', mockUser),
      ).rejects.toThrow(NotFoundException);
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

      mockCartRepository.findOne.mockResolvedValue(cartWithItems);
      mockCartItemRepository.remove.mockResolvedValue([mockCartItem]);
      mockCartRepository.save.mockResolvedValue(emptyCart);

      const result = await service.clearCart('session-123', mockUser);

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

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartRepository.save.mockResolvedValue(cartWithCoupon);

      const result = await service.applyCoupon(
        'session-123',
        'SUMMER2026',
        mockUser,
      );

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

      mockCartRepository.findOne.mockResolvedValue(cartWithCoupon);
      mockCartRepository.save.mockResolvedValue(cartWithoutCoupon);

      const result = await service.removeCoupon('session-123', mockUser);

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

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartRepository.save.mockResolvedValue(cartWithAddress);

      const result = await service.updateShippingAddress(
        'session-123',
        address,
        mockUser,
      );

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

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockCartRepository.save.mockResolvedValue(cartWithAddress);

      const result = await service.updateBillingAddress(
        'session-123',
        address,
        mockUser,
      );

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

      const result = await service.convertToOrder(
        'session-123',
        'order-123',
        mockUser,
      );

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

      const result = await service.markAsAbandoned('session-123', mockUser);

      expect(result.status).toBe(CartStatus.ABANDONED);
    });
  });

  describe('findAbandonedCarts', () => {
    it('should return abandoned carts', async () => {
      const abandonedCarts = [
        { ...mockCart, status: CartStatus.ABANDONED },
      ];

      mockCartRepository.find.mockResolvedValue(abandonedCarts);

      const result = await service.findAbandonedCarts(mockUser);

      expect(result).toEqual(abandonedCarts);
      expect(mockCartRepository.find).toHaveBeenCalledWith({
        where: { status: CartStatus.ABANDONED, tenantId: 'tenant-123' },
        relations: ['items'],
      });
    });
  });
});

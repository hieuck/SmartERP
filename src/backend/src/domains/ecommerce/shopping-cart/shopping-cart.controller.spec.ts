/**
 * ShoppingCartController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. GET /ecommerce/cart - Get or create cart
 * 2. POST /ecommerce/cart/items - Add item to cart
 * 3. PATCH /ecommerce/cart/items/:itemId - Update cart item quantity
 * 4. DELETE /ecommerce/cart/items/:itemId - Remove item from cart
 * 5. DELETE /ecommerce/cart - Clear cart
 * 6. POST /ecommerce/cart/coupon - Apply coupon
 * 7. DELETE /ecommerce/cart/coupon - Remove coupon
 * 8. PATCH /ecommerce/cart/shipping-address - Update shipping address
 * 9. PATCH /ecommerce/cart/billing-address - Update billing address
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ShoppingCartController } from './shopping-cart.controller';
import { ShoppingCartService } from './shopping-cart.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CartStatus } from './enums/cart-status.enum';

describe('ShoppingCartController (Integration)', () => {
  let app: INestApplication;
  let cartService: jest.Mocked<ShoppingCartService>;

  const mockUser = {
    id: 'user-123',
    email: 'customer@example.com',
    tenantId: 'tenant-123',
    role: 'customer',
  };

  const mockCart = {
    id: 'cart-123',
    sessionId: 'session-123',
    userId: 'user-123',
    tenantId: 'tenant-123',
    status: CartStatus.ACTIVE,
    subtotal: 500000,
    discount: 0,
    couponCode: null,
    items: [
      {
        id: 'item-1',
        cartId: 'cart-123',
        productId: 'prod-1',
        productName: 'T-Shirt',
        productSku: 'TS-001',
        productImage: 'image.jpg',
        price: 250000,
        quantity: 2,
        selectedVariant: { size: 'M', color: 'Blue' },
      },
    ],
    shippingAddress: null,
    billingAddress: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  const mockAddToCartDto = {
    productId: 'prod-1',
    quantity: 2,
    selectedVariant: { size: 'M', color: 'Blue' },
  };

  const mockAddress = {
    fullName: 'John Doe',
    phone: '+84901234567',
    address: '123 Main St',
    city: 'Ho Chi Minh',
    district: 'District 1',
    ward: 'Ward 1',
    postalCode: '700000',
    country: 'Vietnam',
  };

  beforeAll(async () => {
    const mockCartService = {
      getOrCreateCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      applyCoupon: jest.fn(),
      removeCoupon: jest.fn(),
      updateShippingAddress: jest.fn(),
      updateBillingAddress: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader !== 'Bearer invalid-token') {
          request.user = mockUser;
          request.sessionID = 'session-123';
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingCartController],
      providers: [
        {
          provide: ShoppingCartService,
          useValue: mockCartService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    cartService = moduleFixture.get(ShoppingCartService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /ecommerce/cart', () => {
    it('should get or create cart successfully', async () => {
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/cart')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockCart);
      expect(cartService.getOrCreateCart).toHaveBeenCalledWith(mockUser, 'session-123');
    });

    it('should create new cart if not exists', async () => {
      const newCart = { ...mockCart, items: [] };
      cartService.getOrCreateCart.mockResolvedValue(newCart as any);

      const response = await request(app.getHttpServer())
        .get('/ecommerce/cart')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.items).toEqual([]);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/ecommerce/cart')
        .expect(401);
    });
  });

  describe('POST /ecommerce/cart/items', () => {
    it('should add item to cart successfully', async () => {
      const updatedCart = { ...mockCart };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.addItem.mockResolvedValue(updatedCart as any);

      const response = await request(app.getHttpServer())
        .post('/ecommerce/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send(mockAddToCartDto)
        .expect(201);

      expect(response.body).toEqual(updatedCart);
      expect(cartService.addItem).toHaveBeenCalledWith(
        mockUser,
        'session-123',
        mockAddToCartDto,
      );
    });

    it('should return 404 when product not found', async () => {
      cartService.addItem.mockRejectedValue(
        new HttpException('Product with ID prod-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/ecommerce/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...mockAddToCartDto, productId: 'prod-999' })
        .expect(404);
    });

    it('should return 400 when product is not available', async () => {
      cartService.addItem.mockRejectedValue(
        new HttpException('Product is not available', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/ecommerce/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send(mockAddToCartDto)
        .expect(400);
    });

    it('should return 400 when insufficient stock', async () => {
      cartService.addItem.mockRejectedValue(
        new HttpException('Insufficient stock', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/ecommerce/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...mockAddToCartDto, quantity: 1000 })
        .expect(400);
    });

    it('should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/ecommerce/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/ecommerce/cart/items')
        .send(mockAddToCartDto)
        .expect(401);
    });
  });

  describe('PATCH /ecommerce/cart/items/:itemId', () => {
    it('should update item quantity successfully', async () => {
      const updatedCart = {
        ...mockCart,
        items: [{ ...mockCart.items[0], quantity: 3 }],
      };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.updateItemQuantity.mockResolvedValue(updatedCart as any);

      const response = await request(app.getHttpServer())
        .patch('/ecommerce/cart/items/item-1')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body.items[0].quantity).toBe(3);
      expect(cartService.updateItemQuantity).toHaveBeenCalledWith(
        mockUser,
        'cart-123',
        'item-1',
        3,
      );
    });

    it('should remove item when quantity is 0', async () => {
      const updatedCart = { ...mockCart, items: [] };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.updateItemQuantity.mockResolvedValue(updatedCart as any);

      const response = await request(app.getHttpServer())
        .patch('/ecommerce/cart/items/item-1')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 0 })
        .expect(200);

      expect(response.body.items).toEqual([]);
    });

    it('should return 404 when item not found', async () => {
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.updateItemQuantity.mockRejectedValue(
        new HttpException('Cart item with ID item-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/ecommerce/cart/items/item-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 3 })
        .expect(404);
    });

    it('should return 400 when insufficient stock', async () => {
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.updateItemQuantity.mockRejectedValue(
        new HttpException('Insufficient stock', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/ecommerce/cart/items/item-1')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 1000 })
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/cart/items/item-1')
        .send({ quantity: 3 })
        .expect(401);
    });
  });

  describe('DELETE /ecommerce/cart/items/:itemId', () => {
    it('should remove item from cart successfully', async () => {
      const updatedCart = { ...mockCart, items: [] };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.removeItem.mockResolvedValue(updatedCart as any);

      const response = await request(app.getHttpServer())
        .delete('/ecommerce/cart/items/item-1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(cartService.removeItem).toHaveBeenCalledWith(mockUser, 'cart-123', 'item-1');
    });

    it('should return 404 when item not found', async () => {
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.removeItem.mockRejectedValue(
        new HttpException('Cart item with ID item-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/ecommerce/cart/items/item-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete('/ecommerce/cart/items/item-1')
        .expect(401);
    });
  });

  describe('DELETE /ecommerce/cart', () => {
    it('should clear cart successfully', async () => {
      const emptyCart = { ...mockCart, items: [] };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.clearCart.mockResolvedValue(emptyCart as any);

      const response = await request(app.getHttpServer())
        .delete('/ecommerce/cart')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(cartService.clearCart).toHaveBeenCalledWith(mockUser, 'cart-123');
    });

    it('should handle empty cart', async () => {
      const emptyCart = { ...mockCart, items: [] };
      cartService.getOrCreateCart.mockResolvedValue(emptyCart as any);
      cartService.clearCart.mockResolvedValue(emptyCart as any);

      const response = await request(app.getHttpServer())
        .delete('/ecommerce/cart')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.items).toEqual([]);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete('/ecommerce/cart')
        .expect(401);
    });
  });

  describe('POST /ecommerce/cart/coupon', () => {
    it('should apply coupon successfully', async () => {
      const cartWithCoupon = {
        ...mockCart,
        couponCode: 'SUMMER2024',
        discount: 50000,
      };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.applyCoupon.mockResolvedValue(cartWithCoupon as any);

      const response = await request(app.getHttpServer())
        .post('/ecommerce/cart/coupon')
        .set('Authorization', 'Bearer valid-token')
        .send({ couponCode: 'SUMMER2024' })
        .expect(200);

      expect(response.body.couponCode).toBe('SUMMER2024');
      expect(response.body.discount).toBe(50000);
      expect(cartService.applyCoupon).toHaveBeenCalledWith(
        mockUser,
        'cart-123',
        'SUMMER2024',
      );
    });

    it('should return 400 when coupon is invalid', async () => {
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.applyCoupon.mockRejectedValue(
        new HttpException('Invalid coupon code', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/ecommerce/cart/coupon')
        .set('Authorization', 'Bearer valid-token')
        .send({ couponCode: 'INVALID' })
        .expect(400);
    });

    it('should return 400 with missing coupon code', async () => {
      await request(app.getHttpServer())
        .post('/ecommerce/cart/coupon')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/ecommerce/cart/coupon')
        .send({ couponCode: 'SUMMER2024' })
        .expect(401);
    });
  });

  describe('DELETE /ecommerce/cart/coupon', () => {
    it('should remove coupon successfully', async () => {
      const cartWithoutCoupon = {
        ...mockCart,
        couponCode: null,
        discount: 0,
      };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.removeCoupon.mockResolvedValue(cartWithoutCoupon as any);

      const response = await request(app.getHttpServer())
        .delete('/ecommerce/cart/coupon')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.couponCode).toBeNull();
      expect(response.body.discount).toBe(0);
      expect(cartService.removeCoupon).toHaveBeenCalledWith(mockUser, 'cart-123');
    });

    it('should handle cart without coupon', async () => {
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.removeCoupon.mockResolvedValue(mockCart as any);

      const response = await request(app.getHttpServer())
        .delete('/ecommerce/cart/coupon')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.couponCode).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete('/ecommerce/cart/coupon')
        .expect(401);
    });
  });

  describe('PATCH /ecommerce/cart/shipping-address', () => {
    it('should update shipping address successfully', async () => {
      const cartWithAddress = {
        ...mockCart,
        shippingAddress: mockAddress,
      };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.updateShippingAddress.mockResolvedValue(cartWithAddress as any);

      const response = await request(app.getHttpServer())
        .patch('/ecommerce/cart/shipping-address')
        .set('Authorization', 'Bearer valid-token')
        .send({ address: mockAddress })
        .expect(200);

      expect(response.body.shippingAddress).toEqual(mockAddress);
      expect(cartService.updateShippingAddress).toHaveBeenCalledWith(
        mockUser,
        'cart-123',
        mockAddress,
      );
    });

    it('should return 400 with invalid address', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/cart/shipping-address')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/cart/shipping-address')
        .send({ address: mockAddress })
        .expect(401);
    });
  });

  describe('PATCH /ecommerce/cart/billing-address', () => {
    it('should update billing address successfully', async () => {
      const cartWithAddress = {
        ...mockCart,
        billingAddress: mockAddress,
      };
      cartService.getOrCreateCart.mockResolvedValue(mockCart as any);
      cartService.updateBillingAddress.mockResolvedValue(cartWithAddress as any);

      const response = await request(app.getHttpServer())
        .patch('/ecommerce/cart/billing-address')
        .set('Authorization', 'Bearer valid-token')
        .send({ address: mockAddress })
        .expect(200);

      expect(response.body.billingAddress).toEqual(mockAddress);
      expect(cartService.updateBillingAddress).toHaveBeenCalledWith(
        mockUser,
        'cart-123',
        mockAddress,
      );
    });

    it('should return 400 with invalid address', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/cart/billing-address')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/ecommerce/cart/billing-address')
        .send({ address: mockAddress })
        .expect(401);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ShoppingCart } from '../shopping-cart/entities/shopping-cart.entity';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let cartRepository: Repository<ShoppingCart>;

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOrderItemRepository = {
    create: jest.fn(),
  };

  const mockCartRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(ShoppingCart),
          useValue: mockCartRepository,
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    cartRepository = module.get(getRepositoryToken(ShoppingCart));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateCheckout', () => {
    it('should initiate checkout successfully', async () => {
      const mockCart = {
        id: 'cart-1',
        subtotal: 100,
        discount: 10,
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            price: 50,
            quantity: 2,
            product: { isPublished: true, trackInventory: true, stockQuantity: 10 },
          },
        ],
      };

      const dto = {
        cartId: 'cart-1',
        customerEmail: 'test@example.com',
        shippingAddress: { city: 'HCMC' },
      };

      mockCartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.initiateCheckout(dto, 'tenant1');

      expect(result.cart).toEqual(mockCart);
      expect(result.tax).toBeGreaterThan(0);
      expect(result.shipping).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if cart not found', async () => {
      const dto = {
        cartId: 'invalid-cart',
        customerEmail: 'test@example.com',
        shippingAddress: { city: 'HCMC' },
      };

      mockCartRepository.findOne.mockResolvedValue(null);

      await expect(service.initiateCheckout(dto, 'tenant1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if cart is empty', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [],
      };

      const dto = {
        cartId: 'cart-1',
        customerEmail: 'test@example.com',
        shippingAddress: { city: 'HCMC' },
      };

      mockCartRepository.findOne.mockResolvedValue(mockCart);

      await expect(service.initiateCheckout(dto, 'tenant1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createOrderFromCart', () => {
    it('should create order from cart successfully', async () => {
      const mockCart = {
        id: 'cart-1',
        subtotal: 100,
        discount: 10,
        couponCode: 'SUMMER',
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            productSku: 'SKU-001',
            price: 50,
            quantity: 2,
            product: { isPublished: true, trackInventory: true, stockQuantity: 10 },
          },
        ],
      };

      const dto = {
        cartId: 'cart-1',
        customerEmail: 'test@example.com',
        shippingAddress: { city: 'HCMC' },
        billingAddress: { city: 'HCMC' },
      };

      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-2026-0001',
        ...dto,
      };

      mockCartRepository.findOne.mockResolvedValue(mockCart);
      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderItemRepository.create.mockImplementation((data) => data);
      mockOrderRepository.save.mockResolvedValue(mockOrder);
      mockCartRepository.save.mockResolvedValue(mockCart);

      const result = await service.createOrderFromCart(dto, 'tenant1');

      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockCartRepository.save).toHaveBeenCalled();
    });
  });

  describe('validateCart', () => {
    it('should validate cart successfully', async () => {
      const mockCart = {
        items: [
          {
            productName: 'Product 1',
            quantity: 2,
            product: { isPublished: true, trackInventory: true, stockQuantity: 10 },
          },
        ],
        expiresAt: new Date(Date.now() + 1000000),
      };

      await expect(service.validateCart(mockCart as any)).resolves.not.toThrow();
    });

    it('should throw BadRequestException if product unavailable', async () => {
      const mockCart = {
        items: [
          {
            productName: 'Product 1',
            quantity: 2,
            product: { isPublished: false },
          },
        ],
        expiresAt: new Date(Date.now() + 1000000),
      };

      await expect(service.validateCart(mockCart as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const mockCart = {
        items: [
          {
            productName: 'Product 1',
            quantity: 20,
            product: { isPublished: true, trackInventory: true, stockQuantity: 5 },
          },
        ],
        expiresAt: new Date(Date.now() + 1000000),
      };

      await expect(service.validateCart(mockCart as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', async () => {
      const mockCart = { subtotal: 100 };
      const result = await service.calculateTax(mockCart as any, {});
      expect(result).toBe(10);
    });
  });

  describe('calculateShipping', () => {
    it('should calculate standard shipping', async () => {
      const mockCart = { subtotal: 100 };
      const result = await service.calculateShipping(mockCart as any, {}, 'standard');
      expect(result).toBe(20000);
    });

    it('should calculate express shipping', async () => {
      const mockCart = { subtotal: 100 };
      const result = await service.calculateShipping(mockCart as any, {}, 'express');
      expect(result).toBe(50000);
    });
  });
});

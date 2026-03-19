import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import { Shipment } from './entities/shipment.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GHNService } from './providers/ghn/ghn.service';
import { GHTKService } from './providers/ghtk/ghtk.service';
import { ViettelPostService } from './providers/viettelpost/viettelpost.service';
import { VNPostService } from './providers/vnpost/vnpost.service';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { BadRequestException } from '@nestjs/common';

describe('ShippingService', () => {
  let permissionService: jest.Mocked<PermissionService>;
  let service: ShippingService;
  let shipmentRepo: jest.Mocked<Repository<Shipment>>;
  let ghnService: jest.Mocked<GHNService>;
  let ghtkService: jest.Mocked<GHTKService>;
  let viettelPostService: jest.Mocked<ViettelPostService>;
  let vnPostService: jest.Mocked<VNPostService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    email: 'test@example.com',
    roles: ['admin'],
  } as User;

  const mockShipment: Partial<Shipment> = {
    id: 'shipment-123',
    tenantId: 'tenant-123',
    orderId: 'order-123',
    provider: 'ghn',
    trackingNumber: 'GHN123456',
    providerOrderCode: 'GHN123456',
    status: 'picked_up',
    shippingFee: 25000,
    codAmount: 100000,
    senderInfo: {
      name: 'Sender',
      phone: '0901111111',
      address: 'Sender Address',
      ward: '20308',
      district: '1442',
      province: '202',
    },
    receiverInfo: {
      name: 'Receiver',
      phone: '0902222222',
      address: 'Receiver Address',
      ward: '20309',
      district: '1443',
      province: '202',
    },
    packageInfo: {
      weight: 1000,
      length: 20,
      width: 15,
      height: 10,
      items: [{ name: 'Product A', quantity: 1, price: 100000 }],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockShipmentRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    };

    const mockGHNService = {
      createOrder: jest.fn(),
      calculateFee: jest.fn(),
      trackShipment: jest.fn(),
      cancelOrder: jest.fn(),
    };

    const mockGHTKService = {
      createOrder: jest.fn(),
      calculateFee: jest.fn(),
      trackShipment: jest.fn(),
      cancelOrder: jest.fn(),
    };

    const mockViettelPostService = {
      createOrder: jest.fn(),
      calculateFee: jest.fn(),
      trackShipment: jest.fn(),
      cancelOrder: jest.fn(),
    };

    const mockVNPostService = {
      createOrder: jest.fn(),
      calculateFee: jest.fn(),
      trackShipment: jest.fn(),
      cancelOrder: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getOrSet: jest.fn(),
    };

    const mockPermissionService = {
      checkPermission: jest.fn().mockResolvedValue(true),
      filterByPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepo,
        },
        {
          provide: GHNService,
          useValue: mockGHNService,
        },
        {
          provide: GHTKService,
          useValue: mockGHTKService,
        },
        {
          provide: ViettelPostService,
          useValue: mockViettelPostService,
        },
        {
          provide: VNPostService,
          useValue: mockVNPostService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
    shipmentRepo = module.get(getRepositoryToken(Shipment));
    ghnService = module.get(GHNService);
    ghtkService = module.get(GHTKService);
    viettelPostService = module.get(ViettelPostService);
    vnPostService = module.get(VNPostService);
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
    void permissionService;
  });

  describe('createShipment', () => {
    it('should create shipment with GHN provider', async () => {
      const dto = {
        orderId: 'order-123',
        provider: 'ghn' as const,
        senderInfo: mockShipment.senderInfo,
        receiverInfo: mockShipment.receiverInfo,
        packageInfo: mockShipment.packageInfo,
        codAmount: 100000,
      };

      ghnService.createOrder.mockResolvedValue({
        trackingNumber: 'GHN123456',
        orderCode: 'GHN123456',
        shippingFee: 25000,
        expectedDeliveryTime: new Date(),
      });

      // Mock SecureRepository save
      const _saveSpy = jest
        .spyOn(service['secureShipmentRepo'], 'save')
        .mockResolvedValue(mockShipment as Shipment);

      const result = await service.createShipment(mockUser, dto);

      expect(result).toBeDefined();
      expect(ghnService.createOrder).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should create shipment with GHTK provider', async () => {
      const dto = {
        orderId: 'order-456',
        provider: 'ghtk' as const,
        senderInfo: mockShipment.senderInfo,
        receiverInfo: mockShipment.receiverInfo,
        packageInfo: mockShipment.packageInfo,
        codAmount: 200000,
      };

      ghtkService.createOrder.mockResolvedValue({
        labelId: 'GHTK123456',
        trackingNumber: 'GHTK123456',
        shippingFee: 30000,
        estimatedDeliveryTime: new Date(),
      });

      const _saveSpy = jest.spyOn(service['secureShipmentRepo'], 'save').mockResolvedValue({
        ...mockShipment,
        provider: 'ghtk',
      } as Shipment);

      const result = await service.createShipment(mockUser, dto);

      expect(result).toBeDefined();
      expect(ghtkService.createOrder).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should create shipment with ViettelPost provider', async () => {
      const dto = {
        orderId: 'order-789',
        provider: 'viettelpost' as const,
        senderInfo: mockShipment.senderInfo,
        receiverInfo: mockShipment.receiverInfo,
        packageInfo: mockShipment.packageInfo,
        codAmount: 150000,
      };

      viettelPostService.createOrder.mockResolvedValue({
        orderNumber: 'VTP123456',
        moneyTotal: 28000,
        exchangeWeight: 1500,
      });

      const _saveSpy = jest.spyOn(service['secureShipmentRepo'], 'save').mockResolvedValue({
        ...mockShipment,
        provider: 'viettelpost',
      } as Shipment);

      const result = await service.createShipment(mockUser, dto);

      expect(result).toBeDefined();
      expect(viettelPostService.createOrder).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should create shipment with VNPost provider', async () => {
      const dto = {
        orderId: 'order-999',
        provider: 'vnpost' as const,
        senderInfo: mockShipment.senderInfo,
        receiverInfo: mockShipment.receiverInfo,
        packageInfo: mockShipment.packageInfo,
        codAmount: 120000,
      };

      vnPostService.createOrder.mockResolvedValue({
        trackingNumber: 'VNP123456',
        orderCode: 'VNP123456',
        shippingFee: 22000,
        expectedDeliveryTime: new Date(),
      });

      const _saveSpy = jest.spyOn(service['secureShipmentRepo'], 'save').mockResolvedValue({
        ...mockShipment,
        provider: 'vnpost',
      } as Shipment);

      const result = await service.createShipment(mockUser, dto);

      expect(result).toBeDefined();
      expect(vnPostService.createOrder).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should throw error for unsupported provider', async () => {
      const dto = {
        orderId: 'order-123',
        provider: 'unsupported' as any,
        senderInfo: mockShipment.senderInfo,
        receiverInfo: mockShipment.receiverInfo,
        packageInfo: mockShipment.packageInfo,
      };

      const _saveSpy = jest.spyOn(service['secureShipmentRepo'], 'save').mockResolvedValue({
        ...mockShipment,
        status: 'pending',
      } as Shipment);

      await expect(service.createShipment(mockUser, dto)).rejects.toThrow(BadRequestException);
      expect(_saveSpy).toHaveBeenCalled();
    });

    it('should handle provider error and update shipment status', async () => {
      const dto = {
        orderId: 'order-123',
        provider: 'ghn' as const,
        senderInfo: mockShipment.senderInfo,
        receiverInfo: mockShipment.receiverInfo,
        packageInfo: mockShipment.packageInfo,
      };

      ghnService.createOrder.mockResolvedValue({
        error: 'Provider error',
      });

      const _saveSpy = jest.spyOn(service['secureShipmentRepo'], 'save').mockResolvedValue({
        ...mockShipment,
        status: 'failed',
      } as Shipment);

      await expect(service.createShipment(mockUser, dto)).rejects.toThrow();
      expect(_saveSpy).toHaveBeenCalledTimes(1); // Only once for failed status in catch block
    });

    it('should create shipment with note', async () => {
      const dto = {
        orderId: 'order-123',
        provider: 'ghn' as const,
        senderInfo: mockShipment.senderInfo,
        receiverInfo: mockShipment.receiverInfo,
        packageInfo: mockShipment.packageInfo,
        note: 'Handle with care',
      };

      ghnService.createOrder.mockResolvedValue({
        trackingNumber: 'GHN123456',
        orderCode: 'GHN123456',
        shippingFee: 25000,
        expectedDeliveryTime: new Date(),
      });

      jest.spyOn(service['secureShipmentRepo'], 'save').mockResolvedValue(mockShipment as Shipment);

      const result = await service.createShipment(mockUser, dto);

      expect(result).toBeDefined();
      expect(ghnService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'Handle with care',
        }),
      );
    });
  });

  describe('calculateFee', () => {
    it('should calculate fee with GHN provider', async () => {
      const dto = {
        provider: 'ghn' as const,
        fromDistrict: '1442',
        fromProvince: '202',
        toDistrict: '1443',
        toProvince: '202',
        weight: 1000,
      };

      ghnService.calculateFee.mockResolvedValue({
        total: 25000,
        serviceFee: 20000,
        insuranceFee: 5000,
      });

      const result = await service.calculateFee(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.provider).toBe('ghn');
      expect(result.total).toBe(25000);
      expect(result.serviceFee).toBe(20000);
      expect(result.insuranceFee).toBe(5000);
      expect(ghnService.calculateFee).toHaveBeenCalled();
    });

    it('should calculate fee with GHTK provider', async () => {
      const dto = {
        provider: 'ghtk' as const,
        fromDistrict: '1442',
        fromProvince: '202',
        toDistrict: '1443',
        toProvince: '202',
        weight: 2000,
      };

      ghtkService.calculateFee.mockResolvedValue({
        fee: 30000,
        insuranceFee: 5000,
      });

      const result = await service.calculateFee(mockUser, dto);

      expect(result.provider).toBe('ghtk');
      expect(result.total).toBe(30000);
      expect(result.serviceFee).toBe(30000);
      expect(result.insuranceFee).toBe(5000);
    });

    it('should calculate fee with ViettelPost provider', async () => {
      const dto = {
        provider: 'viettelpost' as const,
        fromDistrict: '1442',
        fromProvince: '202',
        toDistrict: '1443',
        toProvince: '202',
        weight: 1500,
      };

      viettelPostService.calculateFee.mockResolvedValue({
        moneyTotal: 28000,
        moneyTotalFee: 28000,
        moneyFee: 23000,
        moneyVas: 5000,
      });

      const result = await service.calculateFee(mockUser, dto);

      expect(result.provider).toBe('viettelpost');
      expect(result.total).toBe(28000);
      expect(result.serviceFee).toBe(23000);
      expect(result.insuranceFee).toBe(5000);
    });

    it('should calculate fee with VNPost provider', async () => {
      const dto = {
        provider: 'vnpost' as const,
        fromDistrict: '1442',
        fromProvince: '202',
        toDistrict: '1443',
        toProvince: '202',
        weight: 1200,
      };

      vnPostService.calculateFee.mockResolvedValue({
        total: 22000,
        serviceFee: 18000,
        insuranceFee: 4000,
      });

      const result = await service.calculateFee(mockUser, dto);

      expect(result.provider).toBe('vnpost');
      expect(result.total).toBe(22000);
    });

    it('should throw error for unsupported provider', async () => {
      const dto = {
        provider: 'unsupported' as any,
        fromDistrict: '1442',
        fromProvince: '202',
        toDistrict: '1443',
        toProvince: '202',
        weight: 1000,
      };

      await expect(service.calculateFee(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should handle provider error', async () => {
      const dto = {
        provider: 'ghn' as const,
        fromDistrict: '1442',
        fromProvince: '202',
        toDistrict: '1443',
        toProvince: '202',
        weight: 1000,
      };

      ghnService.calculateFee.mockResolvedValue({
        error: 'Provider error',
      });

      await expect(service.calculateFee(mockUser, dto)).rejects.toThrow();
    });
  });

  describe('trackShipment', () => {
    it('should track shipment with GHN provider', async () => {
      const dto = {
        trackingNumber: 'GHN123456',
        provider: 'ghn',
      };

      const findOneSpy = jest
        .spyOn(service['secureShipmentRepo'], 'findOne')
        .mockResolvedValue(mockShipment as Shipment);

      ghnService.trackShipment.mockResolvedValue({
        status: 'delivering',
        statusText: 'Đang giao hàng',
        currentLocation: 'Bưu cục Quận 1',
        expectedDeliveryTime: new Date(),
        history: [],
      });

      const _saveSpy = jest
        .spyOn(service['secureShipmentRepo'], 'save')
        .mockResolvedValue(mockShipment as Shipment);

      const result = await service.trackShipment(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.shipment).toBeDefined();
      expect(result.tracking).toBeDefined();
      expect(findOneSpy).toHaveBeenCalled();
      expect(ghnService.trackShipment).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw error if shipment not found', async () => {
      const dto = {
        trackingNumber: 'NOTFOUND',
        provider: 'ghn',
      };

      jest.spyOn(service['secureShipmentRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.trackShipment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should update shipment status to delivered', async () => {
      const dto = {
        trackingNumber: 'GHN123456',
        provider: 'ghn',
      };

      jest
        .spyOn(service['secureShipmentRepo'], 'findOne')
        .mockResolvedValue(mockShipment as Shipment);

      ghnService.trackShipment.mockResolvedValue({
        status: 'delivered',
        statusText: 'Đã giao hàng',
      });

      const _saveSpy = jest.spyOn(service['secureShipmentRepo'], 'save').mockResolvedValue({
        ...mockShipment,
        status: 'delivered',
        deliveredAt: new Date(),
      } as Shipment);

      await service.trackShipment(mockUser, dto);

      expect(_saveSpy).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          status: 'delivered',
          deliveredAt: expect.any(Date),
        }),
      );
    });

    it('should handle provider error', async () => {
      const dto = {
        trackingNumber: 'GHN123456',
        provider: 'ghn',
      };

      jest
        .spyOn(service['secureShipmentRepo'], 'findOne')
        .mockResolvedValue(mockShipment as Shipment);

      ghnService.trackShipment.mockResolvedValue({
        error: 'Provider error',
      });

      await expect(service.trackShipment(mockUser, dto)).rejects.toThrow();
    });
  });

  describe('cancelShipment', () => {
    it('should cancel shipment successfully', async () => {
      const dto = {
        shipmentId: 'shipment-123',
      };

      // Mock shipment with status that can be cancelled (not 'delivered' or 'cancelled')
      const cancellableShipment = {
        ...mockShipment,
        status: 'in_transit', // Use a status that can be cancelled
      };

      jest
        .spyOn(service['secureShipmentRepo'], 'findOne')
        .mockResolvedValue(cancellableShipment as Shipment);

      ghnService.cancelOrder.mockResolvedValue({
        success: true,
        message: 'Order cancelled',
      });

      const _saveSpy = jest.spyOn(service['secureShipmentRepo'], 'save').mockResolvedValue({
        ...cancellableShipment,
        status: 'cancelled',
      } as Shipment);

      const result = await service.cancelShipment(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.status).toBe('cancelled');
      expect(ghnService.cancelOrder).toHaveBeenCalled();
      expect(_saveSpy).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw error if shipment not found', async () => {
      const dto = {
        shipmentId: 'notfound',
      };

      jest.spyOn(service['secureShipmentRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.cancelShipment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if shipment already delivered', async () => {
      const dto = {
        shipmentId: 'shipment-123',
      };

      jest.spyOn(service['secureShipmentRepo'], 'findOne').mockResolvedValue({
        ...mockShipment,
        status: 'delivered',
      } as Shipment);

      await expect(service.cancelShipment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if shipment already cancelled', async () => {
      const dto = {
        shipmentId: 'shipment-123',
      };

      jest.spyOn(service['secureShipmentRepo'], 'findOne').mockResolvedValue({
        ...mockShipment,
        status: 'cancelled',
      } as Shipment);

      await expect(service.cancelShipment(mockUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('should handle provider error', async () => {
      const dto = {
        shipmentId: 'shipment-123',
      };

      jest
        .spyOn(service['secureShipmentRepo'], 'findOne')
        .mockResolvedValue(mockShipment as Shipment);

      ghnService.cancelOrder.mockResolvedValue({
        success: false,
        message: 'Cannot cancel',
      });

      await expect(service.cancelShipment(mockUser, dto)).rejects.toThrow();
    });
  });

  describe('getShipment', () => {
    it('should get shipment from cache', async () => {
      cacheService.getOrSet.mockResolvedValue(mockShipment as Shipment);

      const result = await service.getShipment(mockUser, 'shipment-123');

      expect(result).toBeDefined();
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should get shipment from database if not in cache', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });

      jest
        .spyOn(service['secureShipmentRepo'], 'findOne')
        .mockResolvedValue(mockShipment as Shipment);

      const result = await service.getShipment(mockUser, 'shipment-123');

      expect(result).toBeDefined();
    });

    it('should throw error if shipment not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });

      jest.spyOn(service['secureShipmentRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.getShipment(mockUser, 'notfound')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listShipments', () => {
    it('should list all shipments', async () => {
      const mockShipments = [mockShipment, { ...mockShipment, id: 'shipment-456' }];

      jest
        .spyOn(service['secureShipmentRepo'], 'find')
        .mockResolvedValue(mockShipments as Shipment[]);
      shipmentRepo.count.mockResolvedValue(2);

      const result = await service.listShipments(mockUser);

      expect(result).toBeDefined();
      expect(result.shipments).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter shipments by orderId', async () => {
      jest
        .spyOn(service['secureShipmentRepo'], 'find')
        .mockResolvedValue([mockShipment] as Shipment[]);
      shipmentRepo.count.mockResolvedValue(1);

      const result = await service.listShipments(mockUser, { orderId: 'order-123' });

      expect(result.shipments).toHaveLength(1);
    });

    it('should filter shipments by provider', async () => {
      jest
        .spyOn(service['secureShipmentRepo'], 'find')
        .mockResolvedValue([mockShipment] as Shipment[]);
      shipmentRepo.count.mockResolvedValue(1);

      const result = await service.listShipments(mockUser, { provider: 'ghn' });

      expect(result.shipments).toHaveLength(1);
    });

    it('should filter shipments by status', async () => {
      jest
        .spyOn(service['secureShipmentRepo'], 'find')
        .mockResolvedValue([mockShipment] as Shipment[]);
      shipmentRepo.count.mockResolvedValue(1);

      const result = await service.listShipments(mockUser, { status: 'picked_up' });

      expect(result.shipments).toHaveLength(1);
    });

    it('should paginate results', async () => {
      jest
        .spyOn(service['secureShipmentRepo'], 'find')
        .mockResolvedValue([mockShipment] as Shipment[]);
      shipmentRepo.count.mockResolvedValue(100);

      const result = await service.listShipments(mockUser, { limit: 10, offset: 20 });

      expect(result.total).toBe(100);
    });
  });
});

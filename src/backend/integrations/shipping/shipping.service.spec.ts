import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingService } from './shipping.service';
import { Shipment } from './entities/shipment.entity';
import { GHNService } from './providers/ghn/ghn.service';
import { GHTKService } from './providers/ghtk/ghtk.service';
import { ViettelPostService } from './providers/viettelpost/viettelpost.service';
import { VNPostService } from './providers/vnpost/vnpost.service';
import { CacheService } from '@/common/cache/cache.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';

describe('ShippingService', () => {
  let service: ShippingService;
  let shipmentRepo: Repository<Shipment>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  };

  const mockShipmentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
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

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
    shipmentRepo = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createShipment', () => {
    it('should create GHN shipment successfully', async () => {
      const tenantId = 'tenant1';
      const dto: CreateShipmentDto = {
        orderId: 'order123',
        provider: 'ghn',
        senderInfo: {
          name: 'Sender',
          phone: '0123456789',
          address: '123 Street',
          province: 'HCM',
          district: '1',
          ward: 'Ward 1',
        },
        receiverInfo: {
          name: 'Receiver',
          phone: '0987654321',
          address: '456 Street',
          province: 'HN',
          district: '2',
          ward: 'Ward 2',
        },
        packageInfo: {
          weight: 1000,
          length: 10,
          width: 10,
          height: 10,
          items: [{ name: 'Product', quantity: 1, price: 100000 }],
        },
        codAmount: 100000,
        serviceType: '2',
        requiredNote: 'KHONGCHOXEMHANG',
      };

      const mockShipment = {
        id: 'shipment123',
        tenantId,
        ...dto,
        status: 'pending',
      };

      const mockGHNResult = {
        trackingNumber: 'GHN123456',
        orderCode: 'GHN_ORDER123',
        shippingFee: 25000,
        expectedDeliveryTime: new Date(),
      };

      mockShipmentRepo.create.mockReturnValue(mockShipment);
      mockShipmentRepo.save.mockResolvedValue(mockShipment);
      mockGHNService.createOrder.mockResolvedValue(mockGHNResult);

      const result = await service.createShipment(tenantId, dto);

      expect(result).toBeDefined();
      expect(mockShipmentRepo.create).toHaveBeenCalled();
      expect(mockGHNService.createOrder).toHaveBeenCalled();
      expect(mockShipmentRepo.save).toHaveBeenCalled();
    });

    it('should handle shipment creation error', async () => {
      const tenantId = 'tenant1';
      const dto: CreateShipmentDto = {
        orderId: 'order123',
        provider: 'ghn',
        senderInfo: {
          name: 'Sender',
          phone: '0123456789',
          address: '123 Street',
          province: 'HCM',
          district: '1',
          ward: 'Ward 1',
        },
        receiverInfo: {
          name: 'Receiver',
          phone: '0987654321',
          address: '456 Street',
          province: 'HN',
          district: '2',
          ward: 'Ward 2',
        },
        packageInfo: {
          weight: 1000,
          items: [{ name: 'Product', quantity: 1, price: 100000 }],
        },
      };

      const mockShipment = {
        id: 'shipment123',
        tenantId,
        ...dto,
        status: 'pending',
      };

      mockShipmentRepo.create.mockReturnValue(mockShipment);
      mockGHNService.createOrder.mockResolvedValue({ error: 'Invalid address' });

      await expect(service.createShipment(tenantId, dto)).rejects.toThrow();
    });
  });

  describe('calculateFee', () => {
    it('should calculate GHN shipping fee', async () => {
      const dto = {
        provider: 'ghn',
        fromDistrict: '1',
        toDistrict: '2',
        toProvince: 'HN',
        weight: 1000,
        serviceType: '2',
      };

      mockGHNService.calculateFee.mockResolvedValue({
        total: 25000,
        serviceFee: 20000,
        insuranceFee: 5000,
      });

      const result = await service.calculateFee('tenant1', dto as any);

      expect(result.provider).toBe('ghn');
      expect(result.total).toBe(25000);
      expect(mockGHNService.calculateFee).toHaveBeenCalled();
    });

    it('should throw error for unsupported provider', async () => {
      const dto = {
        provider: 'invalid',
        fromDistrict: '1',
        toDistrict: '2',
        weight: 1000,
      };

      await expect(service.calculateFee('tenant1', dto as any)).rejects.toThrow('Unsupported provider');
    });
  });

  describe('getShipment', () => {
    it('should get shipment from cache', async () => {
      const mockShipment = {
        id: 'shipment123',
        tenantId: 'tenant1',
        trackingNumber: 'TRACK123',
      };

      mockCacheService.getOrSet.mockResolvedValue(mockShipment);

      const result = await service.getShipment('tenant1', 'shipment123');

      expect(result).toEqual(mockShipment);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw error if shipment not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockShipmentRepo.findOne.mockResolvedValue(null);

      await expect(service.getShipment('tenant1', 'invalid')).rejects.toThrow('Shipment not found');
    });
  });

  describe('listShipments', () => {
    it('should list shipments with filters', async () => {
      const mockShipments = [
        { id: '1', orderId: 'order1' },
        { id: '2', orderId: 'order1' },
      ];

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockShipments);

      const result = await service.listShipments('tenant1', { orderId: 'order1' });

      expect(result.shipments).toEqual(mockShipments);
      expect(result.total).toBe(2);
      expect(mockShipmentRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('trackShipment', () => {
    it('should track GHN shipment and update status', async () => {
      const dto = {
        trackingNumber: 'TRACK123',
        provider: 'ghn',
      };

      const mockShipment = {
        id: 'shipment123',
        tenantId: 'tenant1',
        trackingNumber: 'TRACK123',
        providerOrderCode: 'GHN_ORDER123',
        provider: 'ghn',
        status: 'pending',
        save: jest.fn(),
      };

      const mockTrackingResult = {
        status: 'delivered',
        currentLocation: 'HCM',
        estimatedDelivery: new Date(),
      };

      mockShipmentRepo.findOne.mockResolvedValue(mockShipment);
      mockGHNService.trackShipment.mockResolvedValue(mockTrackingResult);
      mockShipmentRepo.save.mockResolvedValue(mockShipment);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.trackShipment('tenant1', dto as any);

      expect(result.shipment).toBeDefined();
      expect(result.tracking).toEqual(mockTrackingResult);
      expect(mockGHNService.trackShipment).toHaveBeenCalledWith('GHN_ORDER123');
      expect(mockShipmentRepo.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw error if shipment not found', async () => {
      const dto = {
        trackingNumber: 'INVALID',
        provider: 'ghn',
      };

      mockShipmentRepo.findOne.mockResolvedValue(null);

      await expect(service.trackShipment('tenant1', dto as any)).rejects.toThrow('Shipment not found');
    });

    it('should throw error for unsupported provider', async () => {
      const dto = {
        trackingNumber: 'TRACK123',
        provider: 'invalid',
      };

      const mockShipment = {
        id: 'shipment123',
        trackingNumber: 'TRACK123',
      };

      mockShipmentRepo.findOne.mockResolvedValue(mockShipment);

      await expect(service.trackShipment('tenant1', dto as any)).rejects.toThrow('Unsupported provider');
    });
  });

  describe('cancelShipment', () => {
    it('should cancel GHN shipment successfully', async () => {
      const dto = {
        shipmentId: 'shipment123',
      };

      const mockShipment = {
        id: 'shipment123',
        tenantId: 'tenant1',
        provider: 'ghn',
        providerOrderCode: 'GHN_ORDER123',
        trackingNumber: 'TRACK123',
        status: 'pending',
      };

      mockShipmentRepo.findOne.mockResolvedValue(mockShipment);
      mockGHNService.cancelOrder.mockResolvedValue({ success: true });
      mockShipmentRepo.save.mockResolvedValue({ ...mockShipment, status: 'cancelled' });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.cancelShipment('tenant1', dto as any);

      expect(result.status).toBe('cancelled');
      expect(mockGHNService.cancelOrder).toHaveBeenCalledWith(['GHN_ORDER123']);
      expect(mockShipmentRepo.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw error if shipment not found', async () => {
      const dto = {
        shipmentId: 'invalid',
      };

      mockShipmentRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelShipment('tenant1', dto as any)).rejects.toThrow('Shipment not found');
    });

    it('should throw error if shipment already delivered', async () => {
      const dto = {
        shipmentId: 'shipment123',
      };

      const mockShipment = {
        id: 'shipment123',
        status: 'delivered',
      };

      mockShipmentRepo.findOne.mockResolvedValue(mockShipment);

      await expect(service.cancelShipment('tenant1', dto as any)).rejects.toThrow('Cannot cancel this shipment');
    });

    it('should throw error if shipment already cancelled', async () => {
      const dto = {
        shipmentId: 'shipment123',
      };

      const mockShipment = {
        id: 'shipment123',
        status: 'cancelled',
      };

      mockShipmentRepo.findOne.mockResolvedValue(mockShipment);

      await expect(service.cancelShipment('tenant1', dto as any)).rejects.toThrow('Cannot cancel this shipment');
    });
  });
});

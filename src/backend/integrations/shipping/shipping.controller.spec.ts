import { Test, TestingModule } from '@nestjs/testing';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { Request } from 'express';
import { createMockUser } from '@/common/test/test-helpers';

describe('ShippingController', () => {
  let controller: ShippingController;
  let service: ShippingService;

  const mockShippingService = {
    createShipment: jest.fn(),
    calculateFee: jest.fn(),
    trackShipment: jest.fn(),
    cancelShipment: jest.fn(),
    getShipment: jest.fn(),
    listShipments: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockTenantId = 'tenant-123';
  const mockRequest = {
    tenantId: mockTenantId,
  } as Request & { tenantId?: string };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
      ],
    }).compile();

    controller = module.get<ShippingController>(ShippingController);
    service = module.get<ShippingService>(ShippingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createShipment', () => {
    it('should create shipment', async () => {
      const dto = {
        orderId: 'order-123',
        provider: 'GHN',
        recipientName: 'John Doe',
        recipientPhone: '0123456789',
        recipientAddress: '123 Street',
      };
      const mockShipment = { id: 'shipment-123', ...dto };
      mockShippingService.createShipment.mockResolvedValue(mockShipment);

      const result = await controller.createShipment(mockRequest, dto as any);

      expect(result).toEqual(mockShipment);
      expect(service.createShipment).toHaveBeenCalledWith(mockTenantId, dto);
    });

    it('should use default tenant if not provided', async () => {
      const dto = { orderId: 'order-123' };
      const requestWithoutTenant = {} as Request & { tenantId?: string };
      mockShippingService.createShipment.mockResolvedValue({});

      await controller.createShipment(requestWithoutTenant, dto as any);

      expect(service.createShipment).toHaveBeenCalledWith('default-tenant', dto);
    });
  });

  describe('calculateFee', () => {
    it('should calculate shipping fee', async () => {
      const dto = {
        provider: 'GHN',
        fromDistrict: 'District 1',
        toDistrict: 'District 2',
        weight: 1000,
      };
      const mockFee = { fee: 25000, estimatedDays: 2 };
      mockShippingService.calculateFee.mockResolvedValue(mockFee);

      const result = await controller.calculateFee(mockRequest, dto as any);

      expect(result).toEqual(mockFee);
      expect(service.calculateFee).toHaveBeenCalledWith(mockTenantId, dto);
    });
  });

  describe('trackShipment', () => {
    it('should track shipment', async () => {
      const dto = { trackingCode: 'TRACK123' };
      const mockTracking = {
        trackingCode: 'TRACK123',
        status: 'in_transit',
        currentLocation: 'Warehouse A',
      };
      mockShippingService.trackShipment.mockResolvedValue(mockTracking);

      const result = await controller.trackShipment(mockRequest, dto as any);

      expect(result).toEqual(mockTracking);
      expect(service.trackShipment).toHaveBeenCalledWith(mockTenantId, dto);
    });
  });

  describe('cancelShipment', () => {
    it('should cancel shipment', async () => {
      const dto = { shipmentId: 'shipment-123', reason: 'Customer request' };
      const mockCancelled = { id: 'shipment-123', status: 'cancelled' };
      mockShippingService.cancelShipment.mockResolvedValue(mockCancelled);

      const result = await controller.cancelShipment(mockRequest, dto as any);

      expect(result).toEqual(mockCancelled);
      expect(service.cancelShipment).toHaveBeenCalledWith(mockTenantId, dto);
    });
  });

  describe('getShipment', () => {
    it('should return shipment by id', async () => {
      const shipmentId = 'shipment-123';
      const mockShipment = {
        id: shipmentId,
        orderId: 'order-123',
        status: 'delivered',
      };
      mockShippingService.getShipment.mockResolvedValue(mockShipment);

      const result = await controller.getShipment(mockRequest, shipmentId);

      expect(result).toEqual(mockShipment);
      expect(service.getShipment).toHaveBeenCalledWith(mockTenantId, shipmentId);
    });
  });

  describe('listShipments', () => {
    it('should return list of shipments', async () => {
      const mockShipments = [
        { id: 'shipment-1', orderId: 'order-1' },
        { id: 'shipment-2', orderId: 'order-2' },
      ];
      mockShippingService.listShipments.mockResolvedValue(mockShipments);

      const result = await controller.listShipments(mockRequest);

      expect(result).toEqual(mockShipments);
      expect(service.listShipments).toHaveBeenCalledWith(mockTenantId, {
        orderId: undefined,
        provider: undefined,
        status: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should filter shipments by query parameters', async () => {
      const orderId = 'order-123';
      const provider = 'GHN';
      const status = 'delivered';
      const limit = 10;
      const offset = 0;
      const mockShipments = [{ id: 'shipment-1', orderId, provider, status }];
      mockShippingService.listShipments.mockResolvedValue(mockShipments);

      const result = await controller.listShipments(
        mockRequest,
        orderId,
        provider,
        status,
        limit,
        offset,
      );

      expect(result).toEqual(mockShipments);
      expect(service.listShipments).toHaveBeenCalledWith(mockTenantId, {
        orderId,
        provider,
        status,
        limit,
        offset,
      });
    });
  });
});

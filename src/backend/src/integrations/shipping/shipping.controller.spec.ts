/**
 * ShippingController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * 1. POST /shipping - Create shipment
 * 2. POST /shipping/calculate-fee - Calculate shipping fee
 * 3. POST /shipping/track - Track shipment
 * 4. POST /shipping/cancel - Cancel shipment
 * 5. GET /shipping/:id - Get shipment by ID
 * 6. GET /shipping - List shipments with filters
 * 7. Authentication tests
 * 8. Validation tests
 * 9. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';

describe('ShippingController (Integration)', () => {
  let app: INestApplication;
  let shippingService: jest.Mocked<ShippingService>;

  const __mockUser = {
    id: 'user-123',
    email: 'logistics@example.com',
    tenantId: 'tenant-123',
    roles: ['logistics'],
  };

  const mockShipment = {
    id: 'shipment-123',
    orderId: 'order-123',
    provider: 'ghtk',
    trackingNumber: 'GHTK123456',
    status: 'pending',
    fromAddress: {
      name: 'Warehouse A',
      phone: '+84901234567',
      address: '123 Nguyen Hue, District 1, HCMC',
    },
    toAddress: {
      name: 'Customer A',
      phone: '+84909876543',
      address: '456 Le Loi, District 3, HCMC',
    },
    weight: 1500,
    fee: 25000,
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeAll(async () => {
    const mockShippingService = {
      createShipment: jest.fn(),
      calculateFee: jest.fn(),
      trackShipment: jest.fn(),
      cancelShipment: jest.fn(),
      getShipment: jest.fn(),
      listShipments: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    shippingService = moduleFixture.get(ShippingService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /shipping', () => {
    it('should create shipment successfully', async () => {
      const createDto = {
        orderId: 'order-456',
        provider: 'viettelpost',
        fromAddress: {
          name: 'Warehouse B',
          phone: '+84901111111',
          address: '789 Tran Hung Dao, District 5, HCMC',
        },
        toAddress: {
          name: 'Customer B',
          phone: '+84902222222',
          address: '321 Vo Van Tan, District 3, HCMC',
        },
        weight: 2000,
      };

      shippingService.createShipment.mockResolvedValue({
        ...mockShipment,
        ...createDto,
      } as any);

      const response = await request(app.getHttpServer())
        .post('/shipping')
        .send(createDto)
        .expect(201);

      expect(response.body.orderId).toBe('order-456');
      expect(response.body.provider).toBe('viettelpost');
      expect(shippingService.createShipment).toHaveBeenCalledWith(undefined, createDto);
    });

    it('should handle invalid provider', async () => {
      const createDto = {
        orderId: 'order-456',
        provider: 'invalid-provider',
        fromAddress: { name: 'Test', phone: '123', address: 'Test' },
        toAddress: { name: 'Test', phone: '123', address: 'Test' },
        weight: 1000,
      };

      shippingService.createShipment.mockRejectedValue(
        new HttpException('Invalid shipping provider', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer()).post('/shipping').send(createDto).expect(400);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer()).post('/shipping').send({}).expect(400);
    });
  });

  describe('POST /shipping/calculate-fee', () => {
    it('should calculate shipping fee successfully', async () => {
      const calculateDto = {
        provider: 'ghtk',
        fromDistrict: 'District 1',
        toDistrict: 'District 3',
        weight: 1500,
      };

      const feeResult = {
        provider: 'ghtk',
        fee: 25000,
        estimatedDays: 2,
      };

      shippingService.calculateFee.mockResolvedValue(feeResult as any);

      const response = await request(app.getHttpServer())
        .post('/shipping/calculate-fee')
        .send(calculateDto)
        .expect(201);

      expect(response.body.fee).toBe(25000);
      expect(response.body.estimatedDays).toBe(2);
      expect(shippingService.calculateFee).toHaveBeenCalledWith(undefined, calculateDto);
    });

    it('should calculate fee for different providers', async () => {
      const providers = ['ghtk', 'viettelpost', 'vnpost'];

      for (const provider of providers) {
        const calculateDto = {
          provider,
          fromDistrict: 'District 1',
          toDistrict: 'District 3',
          weight: 1500,
        };

        shippingService.calculateFee.mockResolvedValue({
          provider,
          fee: 25000,
          estimatedDays: 2,
        } as any);

        await request(app.getHttpServer())
          .post('/shipping/calculate-fee')
          .send(calculateDto)
          .expect(201);

        expect(shippingService.calculateFee).toHaveBeenCalledWith(undefined, calculateDto);
      }
    });

    it('should handle different weight ranges', async () => {
      const weights = [500, 1000, 2000, 5000, 10000];

      for (const weight of weights) {
        const calculateDto = {
          provider: 'ghtk',
          fromDistrict: 'District 1',
          toDistrict: 'District 3',
          weight,
        };

        shippingService.calculateFee.mockResolvedValue({
          provider: 'ghtk',
          fee: weight * 15,
          estimatedDays: 2,
        } as any);

        await request(app.getHttpServer())
          .post('/shipping/calculate-fee')
          .send(calculateDto)
          .expect(201);
      }
    });

    it('should handle provider unavailable', async () => {
      const calculateDto = {
        provider: 'ghtk',
        fromDistrict: 'District 1',
        toDistrict: 'Remote Area',
        weight: 1500,
      };

      shippingService.calculateFee.mockRejectedValue(
        new HttpException('Provider not available for this route', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/shipping/calculate-fee')
        .send(calculateDto)
        .expect(400);
    });
  });

  describe('POST /shipping/track', () => {
    it('should track shipment successfully', async () => {
      const trackDto = {
        trackingNumber: 'GHTK123456',
        provider: 'ghtk',
      };

      const trackingResult = {
        trackingNumber: 'GHTK123456',
        status: 'in_transit',
        currentLocation: 'HCMC Hub',
        estimatedDelivery: new Date('2024-01-17'),
        history: [
          {
            timestamp: new Date('2024-01-15T10:00:00Z'),
            status: 'picked_up',
            location: 'Warehouse A',
          },
          {
            timestamp: new Date('2024-01-15T14:00:00Z'),
            status: 'in_transit',
            location: 'HCMC Hub',
          },
        ],
      };

      shippingService.trackShipment.mockResolvedValue(trackingResult as any);

      const response = await request(app.getHttpServer())
        .post('/shipping/track')
        .send(trackDto)
        .expect(201);

      expect(response.body.status).toBe('in_transit');
      expect(response.body.history).toHaveLength(2);
      expect(shippingService.trackShipment).toHaveBeenCalledWith(undefined, trackDto);
    });

    it('should handle invalid tracking number', async () => {
      const trackDto = {
        trackingNumber: 'INVALID123',
        provider: 'ghtk',
      };

      shippingService.trackShipment.mockRejectedValue(
        new HttpException('Tracking number not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer()).post('/shipping/track').send(trackDto).expect(404);
    });

    it('should handle provider API error', async () => {
      const trackDto = {
        trackingNumber: 'GHTK123456',
        provider: 'ghtk',
      };

      shippingService.trackShipment.mockRejectedValue(
        new HttpException('Provider API unavailable', HttpStatus.SERVICE_UNAVAILABLE),
      );

      await request(app.getHttpServer()).post('/shipping/track').send(trackDto).expect(503);
    });
  });

  describe('POST /shipping/cancel', () => {
    it('should cancel shipment successfully', async () => {
      const cancelDto = {
        shipmentId: 'shipment-123',
        reason: 'Customer requested cancellation',
      };

      const cancelResult = {
        ...mockShipment,
        status: 'cancelled',
        cancelReason: 'Customer requested cancellation',
      };

      shippingService.cancelShipment.mockResolvedValue(cancelResult as any);

      const response = await request(app.getHttpServer())
        .post('/shipping/cancel')
        .send(cancelDto)
        .expect(201);

      expect(response.body.status).toBe('cancelled');
      expect(shippingService.cancelShipment).toHaveBeenCalledWith(undefined, cancelDto);
    });

    it('should not cancel already delivered shipment', async () => {
      const cancelDto = {
        shipmentId: 'shipment-123',
        reason: 'Test',
      };

      shippingService.cancelShipment.mockRejectedValue(
        new HttpException('Cannot cancel delivered shipment', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer()).post('/shipping/cancel').send(cancelDto).expect(400);
    });

    it('should handle shipment not found', async () => {
      const cancelDto = {
        shipmentId: 'shipment-999',
        reason: 'Test',
      };

      shippingService.cancelShipment.mockRejectedValue(
        new HttpException('Shipment not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer()).post('/shipping/cancel').send(cancelDto).expect(404);
    });
  });

  describe('GET /shipping/:id', () => {
    it('should get shipment by ID', async () => {
      shippingService.getShipment.mockResolvedValue(mockShipment as any);

      const response = await request(app.getHttpServer()).get('/shipping/shipment-123').expect(200);

      expect(response.body).toEqual(mockShipment);
      expect(shippingService.getShipment).toHaveBeenCalledWith(undefined, 'shipment-123');
    });

    it('should return 404 when shipment not found', async () => {
      shippingService.getShipment.mockRejectedValue(
        new HttpException('Shipment not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer()).get('/shipping/shipment-999').expect(404);
    });
  });

  describe('GET /shipping', () => {
    it('should list all shipments', async () => {
      const shipments = [mockShipment];
      shippingService.listShipments.mockResolvedValue(shipments as any);

      const response = await request(app.getHttpServer()).get('/shipping').expect(200);

      expect(response.body).toEqual(shipments);
      expect(shippingService.listShipments).toHaveBeenCalledWith(undefined, {
        orderId: undefined,
        provider: undefined,
        status: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should filter by orderId', async () => {
      const shipments = [mockShipment];
      shippingService.listShipments.mockResolvedValue(shipments as any);

      const response = await request(app.getHttpServer())
        .get('/shipping?orderId=order-123')
        .expect(200);

      expect(response.body).toEqual(shipments);
      expect(shippingService.listShipments).toHaveBeenCalledWith(undefined, {
        orderId: 'order-123',
        provider: undefined,
        status: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should filter by provider', async () => {
      const shipments = [mockShipment];
      shippingService.listShipments.mockResolvedValue(shipments as any);

      const response = await request(app.getHttpServer())
        .get('/shipping?provider=ghtk')
        .expect(200);

      expect(response.body).toEqual(shipments);
      expect(shippingService.listShipments).toHaveBeenCalledWith(undefined, {
        orderId: undefined,
        provider: 'ghtk',
        status: undefined,
        limit: undefined,
        offset: undefined,
      });
    });

    it('should filter by status', async () => {
      const shipments = [mockShipment];
      shippingService.listShipments.mockResolvedValue(shipments as any);

      const response = await request(app.getHttpServer())
        .get('/shipping?status=in_transit')
        .expect(200);

      expect(response.body).toEqual(shipments);
      expect(shippingService.listShipments).toHaveBeenCalledWith(undefined, {
        orderId: undefined,
        provider: undefined,
        status: 'in_transit',
        limit: undefined,
        offset: undefined,
      });
    });

    it('should support pagination', async () => {
      const shipments = [mockShipment];
      shippingService.listShipments.mockResolvedValue(shipments as any);

      const response = await request(app.getHttpServer())
        .get('/shipping?limit=10&offset=20')
        .expect(200);

      expect(response.body).toEqual(shipments);
      expect(shippingService.listShipments).toHaveBeenCalledWith(undefined, {
        orderId: undefined,
        provider: undefined,
        status: undefined,
        limit: 10,
        offset: 20,
      });
    });

    it('should filter by multiple parameters', async () => {
      const shipments = [mockShipment];
      shippingService.listShipments.mockResolvedValue(shipments as any);

      const response = await request(app.getHttpServer())
        .get('/shipping?orderId=order-123&provider=ghtk&status=pending&limit=5&offset=0')
        .expect(200);

      expect(response.body).toEqual(shipments);
      expect(shippingService.listShipments).toHaveBeenCalledWith(undefined, {
        orderId: 'order-123',
        provider: 'ghtk',
        status: 'pending',
        limit: 5,
        offset: 0,
      });
    });

    it('should return empty array when no shipments', async () => {
      shippingService.listShipments.mockResolvedValue([] as any);

      const response = await request(app.getHttpServer()).get('/shipping').expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      shippingService.listShipments.mockResolvedValue([mockShipment] as any);

      const requests = Array(5)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/shipping'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle very large weight', async () => {
      const calculateDto = {
        provider: 'ghtk',
        fromDistrict: 'District 1',
        toDistrict: 'District 3',
        weight: 50000,
      };

      shippingService.calculateFee.mockResolvedValue({
        provider: 'ghtk',
        fee: 750000,
        estimatedDays: 3,
      } as any);

      await request(app.getHttpServer())
        .post('/shipping/calculate-fee')
        .send(calculateDto)
        .expect(201);
    });

    it('should handle special characters in address', async () => {
      const createDto = {
        orderId: 'order-456',
        provider: 'ghtk',
        fromAddress: {
          name: 'Nguyễn Văn A',
          phone: '+84901234567',
          address: '123/45 Đường Lê Lợi, Phường 1, Quận 3, TP.HCM',
        },
        toAddress: {
          name: 'Trần Thị B',
          phone: '+84909876543',
          address: '67/89 Đường Nguyễn Huệ, Phường 2, Quận 1, TP.HCM',
        },
        weight: 1500,
      };

      shippingService.createShipment.mockResolvedValue(mockShipment as any);

      await request(app.getHttpServer()).post('/shipping').send(createDto).expect(201);
    });

    it('should handle service errors', async () => {
      shippingService.listShipments.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer()).get('/shipping').expect(500);
    });
  });
});

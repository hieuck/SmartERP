/**
 * IntegrationController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. GET /integrations - List all integrations
 * 2. GET /integrations/:name - Get integration by name
 * 3. POST /integrations - Configure integration
 * 4. DELETE /integrations/:name - Remove integration
 * 5. POST /integrations/payment/process - Process payment
 * 6. POST /integrations/shipments - Create shipment
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { IntegrationController } from './integration.controller';
import { IntegrationService, IntegrationConfig } from './integration.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

describe('IntegrationController (Integration)', () => {
  let app: INestApplication;
  let integrationService: jest.Mocked<IntegrationService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockIntegration: IntegrationConfig = {
    name: 'vnpay',
    type: 'payment',
    config: {
      tmnCode: 'TMN123',
      secretKey: 'secret123',
    },
  };

  beforeAll(async () => {
    const mockIntegrationService = {
      listIntegrations: jest.fn(),
      getIntegration: jest.fn(),
      configure: jest.fn(),
      removeIntegration: jest.fn(),
      processPayment: jest.fn(),
      createShipment: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationController],
      providers: [
        {
          provide: IntegrationService,
          useValue: mockIntegrationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    integrationService = moduleFixture.get(IntegrationService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /integrations', () => {
    it('should return all integrations', async () => {
      const integrations = [mockIntegration];
      integrationService.listIntegrations.mockResolvedValue(integrations);

      const response = await request(app.getHttpServer())
        .get('/integrations')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(integrations);
      expect(integrationService.listIntegrations).toHaveBeenCalledWith(mockUser);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/integrations')
        .expect(401);
    });

    it('should return empty array when no integrations', async () => {
      integrationService.listIntegrations.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/integrations')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /integrations/:name', () => {
    it('should return integration by name', async () => {
      integrationService.getIntegration.mockResolvedValue(mockIntegration);

      const response = await request(app.getHttpServer())
        .get('/integrations/vnpay')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockIntegration);
      expect(integrationService.getIntegration).toHaveBeenCalledWith(mockUser, 'vnpay');
    });

    it('should return undefined when integration not found', async () => {
      integrationService.getIntegration.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/integrations/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should handle special characters in name', async () => {
      integrationService.getIntegration.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .get('/integrations/test-integration')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('POST /integrations', () => {
    it('should configure integration successfully', async () => {
      integrationService.configure.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/integrations')
        .set('Authorization', 'Bearer valid-token')
        .send(mockIntegration)
        .expect(201);

      expect(integrationService.configure).toHaveBeenCalledWith(mockUser, mockIntegration);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/integrations')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 409 when integration already exists', async () => {
      integrationService.configure.mockRejectedValue(
        new HttpException('Integration already configured', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/integrations')
        .set('Authorization', 'Bearer valid-token')
        .send(mockIntegration)
        .expect(409);
    });

    it('should handle invalid config', async () => {
      integrationService.configure.mockRejectedValue(
        new HttpException('Invalid configuration', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/integrations')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...mockIntegration, config: {} })
        .expect(400);
    });
  });

  describe('DELETE /integrations/:name', () => {
    it('should remove integration successfully', async () => {
      integrationService.removeIntegration.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/integrations/vnpay')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(integrationService.removeIntegration).toHaveBeenCalledWith(mockUser, 'vnpay');
    });

    it('should return 404 when integration not found', async () => {
      integrationService.removeIntegration.mockRejectedValue(
        new HttpException('Integration not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/integrations/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should handle integration in use', async () => {
      integrationService.removeIntegration.mockRejectedValue(
        new HttpException('Integration is in use', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/integrations/vnpay')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('POST /integrations/payment/process', () => {
    it('should process payment successfully', async () => {
      const paymentResult = {
        success: true,
        transactionId: 'txn-123',
        gateway: 'vnpay',
        amount: 100000,
        orderId: 'order-123',
      };

      integrationService.processPayment.mockResolvedValue(paymentResult);

      const response = await request(app.getHttpServer())
        .post('/integrations/payment/process')
        .set('Authorization', 'Bearer valid-token')
        .send({
          gateway: 'vnpay',
          amount: 100000,
          orderId: 'order-123',
        })
        .expect(201);

      expect(response.body).toEqual(paymentResult);
      expect(integrationService.processPayment).toHaveBeenCalledWith(
        mockUser,
        'vnpay',
        100000,
        'order-123',
      );
    });

    it('should return 400 when gateway not configured', async () => {
      integrationService.processPayment.mockRejectedValue(
        new HttpException('Payment gateway not configured', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/integrations/payment/process')
        .set('Authorization', 'Bearer valid-token')
        .send({
          gateway: 'unconfigured',
          amount: 100000,
          orderId: 'order-123',
        })
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/integrations/payment/process')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should handle payment processing failure', async () => {
      integrationService.processPayment.mockRejectedValue(
        new HttpException('Payment processing failed', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .post('/integrations/payment/process')
        .set('Authorization', 'Bearer valid-token')
        .send({
          gateway: 'vnpay',
          amount: 100000,
          orderId: 'order-123',
        })
        .expect(500);
    });
  });

  describe('POST /integrations/shipments', () => {
    it('should create shipment successfully', async () => {
      const shipmentResult = {
        success: true,
        trackingNumber: 'TRACK123',
        provider: 'ghtk',
        shipmentData: { orderId: 'order-123' },
      };

      integrationService.createShipment.mockResolvedValue(shipmentResult);

      const response = await request(app.getHttpServer())
        .post('/integrations/shipments')
        .set('Authorization', 'Bearer valid-token')
        .send({
          provider: 'ghtk',
          shipmentData: { orderId: 'order-123' },
        })
        .expect(201);

      expect(response.body).toEqual(shipmentResult);
      expect(integrationService.createShipment).toHaveBeenCalledWith(
        mockUser,
        'ghtk',
        { orderId: 'order-123' },
      );
    });

    it('should return 400 when provider not configured', async () => {
      integrationService.createShipment.mockRejectedValue(
        new HttpException('Shipping provider not configured', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/integrations/shipments')
        .set('Authorization', 'Bearer valid-token')
        .send({
          provider: 'unconfigured',
          shipmentData: {},
        })
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/integrations/shipments')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should handle shipment creation failure', async () => {
      integrationService.createShipment.mockRejectedValue(
        new HttpException('Shipment creation failed', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .post('/integrations/shipments')
        .set('Authorization', 'Bearer valid-token')
        .send({
          provider: 'ghtk',
          shipmentData: { orderId: 'order-123' },
        })
        .expect(500);
    });

    it('should handle invalid shipment data', async () => {
      integrationService.createShipment.mockRejectedValue(
        new HttpException('Invalid shipment data', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/integrations/shipments')
        .set('Authorization', 'Bearer valid-token')
        .send({
          provider: 'ghtk',
          shipmentData: { invalid: 'data' },
        })
        .expect(400);
    });
  });
});

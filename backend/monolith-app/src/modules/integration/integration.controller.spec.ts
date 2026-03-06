import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

describe('IntegrationController', () => {
  let controller: IntegrationController;
  let service: jest.Mocked<IntegrationService>;

  const mockIntegrationService = {
    listIntegrations: jest.fn(),
    getIntegration: jest.fn(),
    configure: jest.fn(),
    removeIntegration: jest.fn(),
    processPayment: jest.fn(),
    createShipment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationController],
      providers: [
        {
          provide: IntegrationService,
          useValue: mockIntegrationService,
        },
      ],
    }).compile();

    controller = module.get<IntegrationController>(IntegrationController);
    service = module.get(IntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listIntegrations', () => {
    it('should return all integrations', async () => {
      const tenantId = 'tenant-1';
      const mockIntegrations = [
        { name: 'stripe', enabled: true },
        { name: 'paypal', enabled: false },
      ];
      service.listIntegrations.mockResolvedValue(mockIntegrations as any);

      const result = await controller.listIntegrations(tenantId);

      expect(result).toEqual(mockIntegrations);
      expect(service.listIntegrations).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getIntegration', () => {
    it('should return specific integration', async () => {
      const tenantId = 'tenant-1';
      const name = 'stripe';
      const mockIntegration = { name, enabled: true, apiKey: 'sk_test_xxx' };
      service.getIntegration.mockResolvedValue(mockIntegration as any);

      const result = await controller.getIntegration(tenantId, name);

      expect(result).toEqual(mockIntegration);
      expect(service.getIntegration).toHaveBeenCalledWith(tenantId, name);
    });
  });

  describe('configure', () => {
    it('should configure integration', async () => {
      const tenantId = 'tenant-1';
      const integration = { name: 'stripe', enabled: true, apiKey: 'sk_test_xxx' };
      service.configure.mockResolvedValue(undefined);

      await controller.configure(tenantId, integration as any);

      expect(service.configure).toHaveBeenCalledWith(tenantId, integration);
    });
  });

  describe('removeIntegration', () => {
    it('should remove integration', async () => {
      const tenantId = 'tenant-1';
      const name = 'stripe';
      service.removeIntegration.mockResolvedValue(undefined);

      await controller.removeIntegration(tenantId, name);

      expect(service.removeIntegration).toHaveBeenCalledWith(tenantId, name);
    });
  });

  describe('processPayment', () => {
    it('should process payment through gateway', async () => {
      const tenantId = 'tenant-1';
      const gateway = 'stripe';
      const amount = 10000;
      const orderId = 'order-1';
      const mockResult = {
        success: true,
        transactionId: 'txn_123',
        gateway,
        amount,
        orderId,
      };
      service.processPayment.mockResolvedValue(mockResult);

      const result = await controller.processPayment(tenantId, gateway, amount, orderId);

      expect(result).toEqual(mockResult);
      expect(service.processPayment).toHaveBeenCalledWith(tenantId, gateway, amount, orderId);
    });
  });

  describe('createShipment', () => {
    it('should create shipment with provider', async () => {
      const tenantId = 'tenant-1';
      const provider = 'ghn';
      const shipmentData = { from: 'HN', to: 'HCM', weight: 1000 };
      const mockResult = {
        success: true,
        trackingNumber: 'GHN123456',
        provider,
        shipmentData,
      };
      service.createShipment.mockResolvedValue(mockResult);

      const result = await controller.createShipment(tenantId, provider, shipmentData);

      expect(result).toEqual(mockResult);
      expect(service.createShipment).toHaveBeenCalledWith(tenantId, provider, shipmentData);
    });
  });
});

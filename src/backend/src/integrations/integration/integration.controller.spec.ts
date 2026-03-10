import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { createMockUser } from '@/common/test/test-helpers';

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

  const mockUser = createMockUser();

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
      const mockIntegrations = [
        { name: 'stripe', enabled: true },
        { name: 'paypal', enabled: false },
      ];
      service.listIntegrations.mockResolvedValue(mockIntegrations as any);

      const result = await controller.listIntegrations(mockUser);

      expect(result).toEqual(mockIntegrations);
      expect(service.listIntegrations).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getIntegration', () => {
    it('should return specific integration', async () => {
      const name = 'stripe';
      const mockIntegration = { name, enabled: true, apiKey: 'sk_test_xxx' };
      service.getIntegration.mockResolvedValue(mockIntegration as any);

      const result = await controller.getIntegration(mockUser, name);

      expect(result).toEqual(mockIntegration);
      expect(service.getIntegration).toHaveBeenCalledWith(mockUser, name);
    });
  });

  describe('configure', () => {
    it('should configure integration', async () => {
      const integration = { name: 'stripe', enabled: true, apiKey: 'sk_test_xxx' };
      service.configure.mockResolvedValue(undefined);

      await controller.configure(mockUser, integration as any);

      expect(service.configure).toHaveBeenCalledWith(mockUser, integration);
    });
  });

  describe('removeIntegration', () => {
    it('should remove integration', async () => {
      const name = 'stripe';
      service.removeIntegration.mockResolvedValue(undefined);

      await controller.removeIntegration(mockUser, name);

      expect(service.removeIntegration).toHaveBeenCalledWith(mockUser, name);
    });
  });

  describe('processPayment', () => {
    it('should process payment through gateway', async () => {
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

      const result = await controller.processPayment(mockUser, gateway, amount, orderId);

      expect(result).toEqual(mockResult);
      expect(service.processPayment).toHaveBeenCalledWith(mockUser, gateway, amount, orderId);
    });
  });

  describe('createShipment', () => {
    it('should create shipment with provider', async () => {
      const provider = 'ghn';
      const shipmentData = { from: 'HN', to: 'HCM', weight: 1000 };
      const mockResult = {
        success: true,
        trackingNumber: 'GHN123456',
        provider,
        shipmentData,
      };
      service.createShipment.mockResolvedValue(mockResult);

      const result = await controller.createShipment(mockUser, provider, shipmentData);

      expect(result).toEqual(mockResult);
      expect(service.createShipment).toHaveBeenCalledWith(mockUser, provider, shipmentData);
    });
  });
});

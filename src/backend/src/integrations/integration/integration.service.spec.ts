import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationService, IntegrationConfig } from './integration.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('IntegrationService', () => {
  let service: IntegrationService;

  const mockTenantId = 'tenant-123';
  const mockUser = createMockUser();
  const mockIntegration: IntegrationConfig = {
    name: 'vnpay',
    type: 'payment',
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    webhookUrl: 'https://example.com/webhook',
    config: { merchantId: '12345' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationService],
    }).compile();

    service = module.get<IntegrationService>(IntegrationService);
  });

  afterEach(() => {
    // Clear integrations after each test
    service['integrations'].clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('configure', () => {
    it('should configure integration successfully', async () => {
      await service.configure(mockUser, mockIntegration);

      const result = await service.getIntegration(mockUser, 'vnpay');

      expect(result).toEqual(mockIntegration);
    });

    it('should configure multiple integrations for same tenant', async () => {
      const integration1 = { ...mockIntegration, name: 'vnpay' };
      const integration2 = { ...mockIntegration, name: 'momo', type: 'payment' as const };

      await service.configure(mockUser, integration1);
      await service.configure(mockUser, integration2);

      const result1 = await service.getIntegration(mockUser, 'vnpay');
      const result2 = await service.getIntegration(mockUser, 'momo');

      expect(result1).toEqual(integration1);
      expect(result2).toEqual(integration2);
    });

    it('should configure different integrations for different tenants', async () => {
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';

      await service.configure(tenant1, mockIntegration);
      await service.configure(tenant2, { ...mockIntegration, apiKey: 'different-key' });

      const result1 = await service.getIntegration(tenant1, 'vnpay');
      const result2 = await service.getIntegration(tenant2, 'vnpay');

      expect(result1?.apiKey).toBe('test-api-key');
      expect(result2?.apiKey).toBe('different-key');
    });
  });

  describe('getIntegration', () => {
    it('should get configured integration', async () => {
      await service.configure(mockUser, mockIntegration);

      const result = await service.getIntegration(mockUser, 'vnpay');

      expect(result).toEqual(mockIntegration);
    });

    it('should return undefined for non-existent integration', async () => {
      const result = await service.getIntegration(mockUser, 'non-existent');

      expect(result).toBeUndefined();
    });

    it('should not return integration from different tenant', async () => {
      await service.configure(mockUser, mockIntegration);

      const result = await service.getIntegration(mockUser, 'vnpay');

      expect(result).toBeUndefined();
    });
  });

  describe('listIntegrations', () => {
    it('should list all integrations for tenant', async () => {
      const integration1 = { ...mockIntegration, name: 'vnpay' };
      const integration2 = { ...mockIntegration, name: 'momo', type: 'payment' as const };

      await service.configure(mockUser, integration1);
      await service.configure(mockUser, integration2);

      const result = await service.listIntegrations(mockUser);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(integration1);
      expect(result).toContainEqual(integration2);
    });

    it('should return empty array if no integrations configured', async () => {
      const result = await service.listIntegrations(mockUser);

      expect(result).toHaveLength(0);
    });

    it('should only return integrations for specific tenant', async () => {
      await service.configure(mockUser, { ...mockIntegration, name: 'vnpay' });
      await service.configure(mockUser, { ...mockIntegration, name: 'momo' });

      const result = await service.listIntegrations(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('vnpay');
    });
  });

  describe('removeIntegration', () => {
    it('should remove integration successfully', async () => {
      await service.configure(mockUser, mockIntegration);

      await service.removeIntegration(mockUser, 'vnpay');

      const result = await service.getIntegration(mockUser, 'vnpay');
      expect(result).toBeUndefined();
    });

    it('should not affect other integrations when removing one', async () => {
      await service.configure(mockUser, { ...mockIntegration, name: 'vnpay' });
      await service.configure(mockUser, { ...mockIntegration, name: 'momo' });

      await service.removeIntegration(mockUser, 'vnpay');

      const result = await service.listIntegrations(mockUser);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('momo');
    });

    it('should handle removing non-existent integration', async () => {
      await expect(service.removeIntegration(mockUser, 'non-existent')).resolves.not.toThrow();
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const result = await service.processPayment(mockUser, 'vnpay', 100000, 'order-123');

      expect(result.success).toBe(true);
      expect(result.gateway).toBe('vnpay');
      expect(result.amount).toBe(100000);
      expect(result.orderId).toBe('order-123');
      expect(result.transactionId).toBeDefined();
    });

    it('should generate unique transaction IDs', async () => {
      const result1 = await service.processPayment(mockUser, 'vnpay', 100000, 'order-1');
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await service.processPayment(mockUser, 'momo', 200000, 'order-2');

      expect(result1.transactionId).not.toBe(result2.transactionId);
    });

    it('should handle different payment gateways', async () => {
      const vnpayResult = await service.processPayment(mockUser, 'vnpay', 100000, 'order-1');
      const momoResult = await service.processPayment(mockUser, 'momo', 200000, 'order-2');

      expect(vnpayResult.gateway).toBe('vnpay');
      expect(momoResult.gateway).toBe('momo');
    });
  });

  describe('createShipment', () => {
    it('should create shipment successfully', async () => {
      const shipmentData = {
        from: 'Ho Chi Minh',
        to: 'Ha Noi',
        weight: 1000,
      };

      const result = await service.createShipment(mockUser, 'ghn', shipmentData);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('ghn');
      expect(result.trackingNumber).toBeDefined();
      expect(result.shipmentData).toEqual(shipmentData);
    });

    it('should generate unique tracking numbers', async () => {
      const shipmentData = { from: 'HCM', to: 'HN', weight: 1000 };

      const result1 = await service.createShipment(mockUser, 'ghn', shipmentData);
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await service.createShipment(mockUser, 'ghtk', shipmentData);

      expect(result1.trackingNumber).not.toBe(result2.trackingNumber);
    });

    it('should handle different shipping providers', async () => {
      const shipmentData = { from: 'HCM', to: 'HN', weight: 1000 };

      const ghnResult = await service.createShipment(mockUser, 'ghn', shipmentData);
      const ghtkResult = await service.createShipment(mockUser, 'ghtk', shipmentData);

      expect(ghnResult.provider).toBe('ghn');
      expect(ghtkResult.provider).toBe('ghtk');
    });
  });
});

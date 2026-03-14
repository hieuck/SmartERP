import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationService, IntegrationConfig } from './integration.service';
import { User } from '@/common/security/permission.service';

describe('IntegrationService', () => {
  let service: IntegrationService;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockIntegration: IntegrationConfig = {
    name: 'vnpay',
    type: 'payment',
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    webhookUrl: 'https://example.com/webhook',
    config: { environment: 'sandbox' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationService],
    }).compile();

    service = module.get<IntegrationService>(IntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('configure', () => {
    it('should configure integration successfully', async () => {
      await service.configure(mockUser, mockIntegration);

      const result = await service.getIntegration(mockUser, mockIntegration.name);

      expect(result).toBeDefined();
      expect(result?.name).toBe(mockIntegration.name);
      expect(result?.type).toBe(mockIntegration.type);
      expect(result?.apiKey).toBe(mockIntegration.apiKey);
    });

    it('should configure multiple integrations for same tenant', async () => {
      const integration2: IntegrationConfig = {
        name: 'momo',
        type: 'payment',
        apiKey: 'momo-key',
        config: { environment: 'production' },
      };

      await service.configure(mockUser, mockIntegration);
      await service.configure(mockUser, integration2);

      const integrations = await service.listIntegrations(mockUser);

      expect(integrations.length).toBe(2);
      expect(integrations.find((i) => i.name === 'vnpay')).toBeDefined();
      expect(integrations.find((i) => i.name === 'momo')).toBeDefined();
    });

    it('should update existing integration when configured again', async () => {
      await service.configure(mockUser, mockIntegration);

      const updatedConfig: IntegrationConfig = {
        ...mockIntegration,
        apiKey: 'updated-key',
      };

      await service.configure(mockUser, updatedConfig);

      const result = await service.getIntegration(mockUser, mockIntegration.name);

      expect(result?.apiKey).toBe('updated-key');
    });
  });

  describe('getIntegration', () => {
    it('should return integration by name', async () => {
      await service.configure(mockUser, mockIntegration);

      const result = await service.getIntegration(mockUser, mockIntegration.name);

      expect(result).toBeDefined();
      expect(result?.name).toBe(mockIntegration.name);
    });

    it('should return undefined when integration not found', async () => {
      const result = await service.getIntegration(mockUser, 'non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('listIntegrations', () => {
    it('should return all integrations for tenant', async () => {
      await service.configure(mockUser, mockIntegration);

      const result = await service.listIntegrations(mockUser);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no integrations configured', async () => {
      const newUser: User = {
        id: 'user-2',
        tenantId: 'tenant-2',
        roles: ['admin'],
      };

      const result = await service.listIntegrations(newUser);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('removeIntegration', () => {
    it('should remove integration successfully', async () => {
      await service.configure(mockUser, mockIntegration);

      await service.removeIntegration(mockUser, mockIntegration.name);

      const result = await service.getIntegration(mockUser, mockIntegration.name);
      expect(result).toBeUndefined();
    });

    it('should not throw error when removing non-existent integration', async () => {
      await expect(
        service.removeIntegration(mockUser, 'non-existent'),
      ).resolves.not.toThrow();
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const result = await service.processPayment(
        mockUser,
        'vnpay',
        100000,
        'order-123',
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.gateway).toBe('vnpay');
      expect(result.amount).toBe(100000);
      expect(result.orderId).toBe('order-123');
      expect(result.transactionId).toBeDefined();
      expect(result.transactionId).toMatch(/^txn_\d+$/);
    });

    it('should generate unique transaction IDs', async () => {
      const result1 = await service.processPayment(
        mockUser,
        'vnpay',
        50000,
        'order-1',
      );

      // Wait 1ms to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      const result2 = await service.processPayment(
        mockUser,
        'momo',
        75000,
        'order-2',
      );

      expect(result1.transactionId).not.toBe(result2.transactionId);
    });

    it('should handle different payment gateways', async () => {
      const gateways = ['vnpay', 'momo', 'zalopay'];

      for (const gateway of gateways) {
        const result = await service.processPayment(
          mockUser,
          gateway,
          100000,
          `order-${gateway}`,
        );

        expect(result.gateway).toBe(gateway);
        expect(result.success).toBe(true);
      }
    });

    it('should handle zero amount', async () => {
      const result = await service.processPayment(
        mockUser,
        'vnpay',
        0,
        'order-free',
      );

      expect(result.success).toBe(true);
      expect(result.amount).toBe(0);
    });

    it('should handle large amounts', async () => {
      const largeAmount = 999999999;
      const result = await service.processPayment(
        mockUser,
        'vnpay',
        largeAmount,
        'order-large',
      );

      expect(result.success).toBe(true);
      expect(result.amount).toBe(largeAmount);
    });
  });

  describe('createShipment', () => {
    it('should create shipment successfully', async () => {
      const shipmentData = {
        from: 'Hanoi',
        to: 'Ho Chi Minh',
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 10 },
      };

      const result = await service.createShipment(
        mockUser,
        'ghn',
        shipmentData,
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('ghn');
      expect(result.trackingNumber).toBeDefined();
      expect(result.trackingNumber).toMatch(/^TRK\d+$/);
      expect(result.shipmentData).toEqual(shipmentData);
    });

    it('should generate unique tracking numbers', async () => {
      const shipmentData1 = { from: 'Hanoi', to: 'Danang' };
      const shipmentData2 = { from: 'Hanoi', to: 'Can Tho' };

      const result1 = await service.createShipment(
        mockUser,
        'ghn',
        shipmentData1,
      );

      // Wait 1ms to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      const result2 = await service.createShipment(
        mockUser,
        'viettel-post',
        shipmentData2,
      );

      expect(result1.trackingNumber).not.toBe(result2.trackingNumber);
    });

    it('should handle different shipping providers', async () => {
      const providers = ['ghn', 'viettel-post', 'vnpost'];
      const shipmentData = { from: 'Hanoi', to: 'HCMC' };

      for (const provider of providers) {
        const result = await service.createShipment(
          mockUser,
          provider,
          shipmentData,
        );

        expect(result.provider).toBe(provider);
        expect(result.success).toBe(true);
      }
    });

    it('should handle empty shipment data', async () => {
      const result = await service.createShipment(mockUser, 'ghn', {});

      expect(result.success).toBe(true);
      expect(result.shipmentData).toEqual({});
    });

    it('should handle complex shipment data', async () => {
      const complexData = {
        from: { address: '123 Street', city: 'Hanoi', district: 'Hoan Kiem' },
        to: { address: '456 Avenue', city: 'HCMC', district: 'District 1' },
        items: [
          { name: 'Product 1', quantity: 2, weight: 1.5 },
          { name: 'Product 2', quantity: 1, weight: 0.5 },
        ],
        insurance: true,
        cod: 500000,
      };

      const result = await service.createShipment(
        mockUser,
        'ghn',
        complexData,
      );

      expect(result.success).toBe(true);
      expect(result.shipmentData).toEqual(complexData);
    });
  });

  describe('tenant isolation', () => {
    it('should isolate integrations between different tenants', async () => {
      const user1: User = {
        id: 'user-1',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };

      const user2: User = {
        id: 'user-2',
        tenantId: 'tenant-2',
        roles: ['admin'],
      };

      await service.configure(user1, mockIntegration);

      const result1 = await service.getIntegration(user1, mockIntegration.name);
      const result2 = await service.getIntegration(user2, mockIntegration.name);

      expect(result1).toBeDefined();
      expect(result2).toBeUndefined();
    });

    it('should list only integrations for specific tenant', async () => {
      const user1: User = {
        id: 'user-1',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };

      const user2: User = {
        id: 'user-2',
        tenantId: 'tenant-2',
        roles: ['admin'],
      };

      const integration1: IntegrationConfig = {
        name: 'vnpay',
        type: 'payment',
        apiKey: 'key-1',
      };

      const integration2: IntegrationConfig = {
        name: 'momo',
        type: 'payment',
        apiKey: 'key-2',
      };

      await service.configure(user1, integration1);
      await service.configure(user2, integration2);

      const list1 = await service.listIntegrations(user1);
      const list2 = await service.listIntegrations(user2);

      expect(list1.length).toBe(1);
      expect(list1[0].name).toBe('vnpay');
      expect(list2.length).toBe(1);
      expect(list2[0].name).toBe('momo');
    });
  });
});
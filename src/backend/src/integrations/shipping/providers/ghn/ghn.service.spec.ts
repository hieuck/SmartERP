import { Test, TestingModule } from '@nestjs/testing';
import { GHNService } from './ghn.service';

describe('GHNService', () => {
  let service: GHNService;

  beforeEach(async () => {
    process.env.GHN_API_URL = 'https://dev-online-gateway.ghn.vn/shiip/public-api';
    process.env.GHN_TOKEN = 'test_token_123';
    process.env.GHN_SHOP_ID = '12345';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GHNService],
    }).compile();

    service = module.get<GHNService>(GHNService);
  });

  afterEach(() => {
    delete process.env.GHN_API_URL;
    delete process.env.GHN_TOKEN;
    delete process.env.GHN_SHOP_ID;
  });

  describe('createOrder', () => {
    it('should create order with required params', async () => {
      const params = {
        toName: 'Nguyen Van A',
        toPhone: '0901234567',
        toAddress: '123 Nguyen Hue',
        toWardCode: '20308',
        toDistrictId: 1442,
        codAmount: 100000,
        weight: 1000,
        length: 20,
        width: 15,
        height: 10,
        serviceTypeId: 2,
        paymentTypeId: 1,
        requiredNote: 'KHONGCHOXEMHANG',
        items: [
          { name: 'Product A', quantity: 1, price: 100000 },
        ],
      };

      const result = await service.createOrder(params);

      expect(result).toBeDefined();
      expect(result.orderCode).toBeDefined();
      expect(result.trackingNumber).toBeDefined();
      expect(result.expectedDeliveryTime).toBeDefined();
      expect(result.shippingFee).toBeDefined();
      expect(result.orderCode).toContain('GHN');
      expect(result.trackingNumber).toContain('GHN');
      expect(result.shippingFee).toBe(25000);
    });

    it('should create order with note', async () => {
      const params = {
        toName: 'Tran Thi B',
        toPhone: '0912345678',
        toAddress: '456 Le Loi',
        toWardCode: '20309',
        toDistrictId: 1443,
        codAmount: 200000,
        weight: 2000,
        length: 30,
        width: 20,
        height: 15,
        serviceTypeId: 5,
        paymentTypeId: 1,
        requiredNote: 'CHOTHUHANG',
        items: [
          { name: 'Product B', quantity: 2, price: 100000 },
        ],
        note: 'Handle with care',
      };

      const result = await service.createOrder(params);

      expect(result).toBeDefined();
      expect(result.orderCode).toBeDefined();
    });

    it('should create order with multiple items', async () => {
      const params = {
        toName: 'Le Van C',
        toPhone: '0923456789',
        toAddress: '789 Tran Hung Dao',
        toWardCode: '20310',
        toDistrictId: 1444,
        codAmount: 500000,
        weight: 3000,
        length: 40,
        width: 30,
        height: 20,
        serviceTypeId: 2,
        paymentTypeId: 1,
        requiredNote: 'CHOXEMHANGKHONGTHU',
        items: [
          { name: 'Product A', quantity: 2, price: 150000 },
          { name: 'Product B', quantity: 1, price: 200000 },
        ],
      };

      const result = await service.createOrder(params);

      expect(result).toBeDefined();
      expect(result.orderCode).toBeDefined();
    });

    it('should create order with zero COD amount', async () => {
      const params = {
        toName: 'Pham Thi D',
        toPhone: '0934567890',
        toAddress: '321 Hai Ba Trung',
        toWardCode: '20311',
        toDistrictId: 1445,
        codAmount: 0,
        weight: 500,
        length: 10,
        width: 10,
        height: 5,
        serviceTypeId: 2,
        paymentTypeId: 1,
        requiredNote: 'KHONGCHOXEMHANG',
        items: [
          { name: 'Product C', quantity: 1, price: 0 },
        ],
      };

      const result = await service.createOrder(params);

      expect(result).toBeDefined();
    });

    it('should handle different service types', async () => {
      const serviceTypes = [2, 5];

      for (const serviceTypeId of serviceTypes) {
        const params = {
          toName: 'Test User',
          toPhone: '0901111111',
          toAddress: 'Test Address',
          toWardCode: '20308',
          toDistrictId: 1442,
          codAmount: 100000,
          weight: 1000,
          length: 20,
          width: 15,
          height: 10,
          serviceTypeId,
          paymentTypeId: 1,
          requiredNote: 'KHONGCHOXEMHANG',
          items: [{ name: 'Test', quantity: 1, price: 100000 }],
        };

        const result = await service.createOrder(params);

        expect(result).toBeDefined();
        expect(result.orderCode).toBeDefined();
      }
    });

    it('should handle different payment types', async () => {
      const paymentTypes = [1, 2]; // 1: Shop pays, 2: Buyer pays

      for (const paymentTypeId of paymentTypes) {
        const params = {
          toName: 'Test User',
          toPhone: '0901111111',
          toAddress: 'Test Address',
          toWardCode: '20308',
          toDistrictId: 1442,
          codAmount: 100000,
          weight: 1000,
          length: 20,
          width: 15,
          height: 10,
          serviceTypeId: 2,
          paymentTypeId,
          requiredNote: 'KHONGCHOXEMHANG',
          items: [{ name: 'Test', quantity: 1, price: 100000 }],
        };

        const result = await service.createOrder(params);

        expect(result).toBeDefined();
      }
    });

    it('should handle different required notes', async () => {
      const requiredNotes = ['CHOTHUHANG', 'CHOXEMHANGKHONGTHU', 'KHONGCHOXEMHANG'];

      for (const requiredNote of requiredNotes) {
        const params = {
          toName: 'Test User',
          toPhone: '0901111111',
          toAddress: 'Test Address',
          toWardCode: '20308',
          toDistrictId: 1442,
          codAmount: 100000,
          weight: 1000,
          length: 20,
          width: 15,
          height: 10,
          serviceTypeId: 2,
          paymentTypeId: 1,
          requiredNote,
          items: [{ name: 'Test', quantity: 1, price: 100000 }],
        };

        const result = await service.createOrder(params);

        expect(result).toBeDefined();
      }
    });

    it('should handle large packages', async () => {
      const params = {
        toName: 'Test User',
        toPhone: '0901111111',
        toAddress: 'Test Address',
        toWardCode: '20308',
        toDistrictId: 1442,
        codAmount: 1000000,
        weight: 50000, // 50kg
        length: 100,
        width: 80,
        height: 60,
        serviceTypeId: 2,
        paymentTypeId: 1,
        requiredNote: 'KHONGCHOXEMHANG',
        items: [{ name: 'Large Item', quantity: 1, price: 1000000 }],
      };

      const result = await service.createOrder(params);

      expect(result).toBeDefined();
    });
  });

  describe('calculateFee', () => {
    it('should calculate fee with required params', async () => {
      const params = {
        fromDistrictId: 1442,
        toDistrictId: 1443,
        toWardCode: '20308',
        weight: 1000,
        length: 20,
        width: 15,
        height: 10,
        serviceTypeId: 2,
      };

      const result = await service.calculateFee(params);

      expect(result).toBeDefined();
      expect(result.total).toBe(25000);
      expect(result.serviceFee).toBe(20000);
      expect(result.insuranceFee).toBe(5000);
    });

    it('should calculate fee with COD amount', async () => {
      const params = {
        fromDistrictId: 1442,
        toDistrictId: 1443,
        toWardCode: '20308',
        weight: 1000,
        length: 20,
        width: 15,
        height: 10,
        serviceTypeId: 2,
        codAmount: 500000,
      };

      const result = await service.calculateFee(params);

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
    });

    it('should calculate fee for different service types', async () => {
      const serviceTypes = [2, 5];

      for (const serviceTypeId of serviceTypes) {
        const params = {
          fromDistrictId: 1442,
          toDistrictId: 1443,
          toWardCode: '20308',
          weight: 1000,
          length: 20,
          width: 15,
          height: 10,
          serviceTypeId,
        };

        const result = await service.calculateFee(params);

        expect(result).toBeDefined();
        expect(result.total).toBeGreaterThan(0);
      }
    });

    it('should calculate fee for different weights', async () => {
      const weights = [500, 1000, 5000, 10000, 50000];

      for (const weight of weights) {
        const params = {
          fromDistrictId: 1442,
          toDistrictId: 1443,
          toWardCode: '20308',
          weight,
          length: 20,
          width: 15,
          height: 10,
          serviceTypeId: 2,
        };

        const result = await service.calculateFee(params);

        expect(result).toBeDefined();
      }
    });

    it('should calculate fee for different dimensions', async () => {
      const dimensions = [
        { length: 10, width: 10, height: 10 },
        { length: 50, width: 40, height: 30 },
        { length: 100, width: 80, height: 60 },
      ];

      for (const dim of dimensions) {
        const params = {
          fromDistrictId: 1442,
          toDistrictId: 1443,
          toWardCode: '20308',
          weight: 1000,
          ...dim,
          serviceTypeId: 2,
        };

        const result = await service.calculateFee(params);

        expect(result).toBeDefined();
      }
    });
  });

  describe('trackShipment', () => {
    it('should track shipment by order code', async () => {
      const orderCode = 'GHN123456';

      const result = await service.trackShipment(orderCode);

      expect(result).toBeDefined();
      expect(result.status).toBe('delivering');
      expect(result.statusText).toBe('Đang giao hàng');
      expect(result.currentLocation).toBeDefined();
      expect(result.expectedDeliveryTime).toBeDefined();
      expect(result.history).toBeDefined();
      expect(Array.isArray(result.history)).toBe(true);
    });

    it('should return tracking history', async () => {
      const orderCode = 'GHN789012';

      const result = await service.trackShipment(orderCode);

      expect(result.history).toBeDefined();
      expect(result.history.length).toBeGreaterThan(0);
      expect(result.history[0]).toHaveProperty('time');
      expect(result.history[0]).toHaveProperty('status');
      expect(result.history[0]).toHaveProperty('location');
    });

    it('should handle different order codes', async () => {
      const orderCodes = ['GHN111', 'GHN222', 'GHN333'];

      for (const orderCode of orderCodes) {
        const result = await service.trackShipment(orderCode);

        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
      }
    });

    it('should handle empty order code', async () => {
      const orderCode = '';

      const result = await service.trackShipment(orderCode);

      expect(result).toBeDefined();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel single order', async () => {
      const orderCodes = ['GHN123456'];

      const result = await service.cancelOrder(orderCodes);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Order cancelled successfully');
    });

    it('should cancel multiple orders', async () => {
      const orderCodes = ['GHN123456', 'GHN789012', 'GHN345678'];

      const result = await service.cancelOrder(orderCodes);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle empty order codes array', async () => {
      const orderCodes: string[] = [];

      const result = await service.cancelOrder(orderCodes);

      expect(result).toBeDefined();
    });

    it('should handle single order code', async () => {
      const orderCodes = ['GHN999999'];

      const result = await service.cancelOrder(orderCodes);

      expect(result.success).toBe(true);
    });
  });

  describe('getAvailableServices', () => {
    it('should get available services for route', async () => {
      const params = {
        fromDistrictId: 1442,
        toDistrictId: 1443,
      };

      const result = await service.getAvailableServices(params);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('serviceId');
      expect(result[0]).toHaveProperty('serviceName');
    });

    it('should return service details', async () => {
      const params = {
        fromDistrictId: 1442,
        toDistrictId: 1443,
      };

      const result = await service.getAvailableServices(params);

      expect(result[0].serviceId).toBeDefined();
      expect(result[0].serviceName).toBeDefined();
      expect(typeof result[0].serviceId).toBe('number');
      expect(typeof result[0].serviceName).toBe('string');
    });

    it('should handle different district combinations', async () => {
      const combinations = [
        { fromDistrictId: 1442, toDistrictId: 1443 },
        { fromDistrictId: 1443, toDistrictId: 1442 },
        { fromDistrictId: 1444, toDistrictId: 1445 },
      ];

      for (const params of combinations) {
        const result = await service.getAvailableServices(params);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should handle same district', async () => {
      const params = {
        fromDistrictId: 1442,
        toDistrictId: 1442,
      };

      const result = await service.getAvailableServices(params);

      expect(result).toBeDefined();
    });
  });
});

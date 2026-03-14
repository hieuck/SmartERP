import { Test, TestingModule } from '@nestjs/testing';
import { GHTKService, GHTKCreateOrderParams } from './ghtk.service';

describe('GHTKService', () => {
  let service: GHTKService;

  const mockOrderParams: GHTKCreateOrderParams = {
    pickName: 'Sender Name',
    pickAddress: '123 Sender St',
    pickProvince: 'TP. Hồ Chí Minh',
    pickDistrict: 'Quận 1',
    pickWard: 'Phường Bến Nghé',
    pickTel: '0901234567',
    name: 'Receiver Name',
    address: '456 Receiver St',
    province: 'Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Hàng Bạc',
    tel: '0909876543',
    email: 'receiver@example.com',
    value: 500000,
    weight: 1000,
    pickMoney: 500000,
    note: 'Handle with care',
    products: [
      {
        name: 'Product 1',
        weight: 500,
        quantity: 2,
        product_code: 'P001',
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GHTKService],
    }).compile();

    service = module.get<GHTKService>(GHTKService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize GHTK service with config', () => {
      expect(service).toBeDefined();
      expect((service as any).config).toBeDefined();
      expect((service as any).config.apiUrl).toBeDefined();
    });
  });

  describe('createOrder', () => {
    it('should create GHTK order successfully', async () => {
      const result = await service.createOrder(mockOrderParams);

      expect(result.labelId).toBeDefined();
      expect(result.labelId).toContain('GHTK');
      expect(result.trackingNumber).toBeDefined();
      expect(result.estimatedDeliveryTime).toBeInstanceOf(Date);
      expect(result.shippingFee).toBe(22000);
      expect(result.error).toBeUndefined();
    });

    it('should create order without optional fields', async () => {
      const minimalParams = {
        ...mockOrderParams,
        email: undefined,
        pickMoney: undefined,
        note: undefined,
      };

      const result = await service.createOrder(minimalParams);

      expect(result.labelId).toBeDefined();
    });

    it('should create order with COD', async () => {
      const params = { ...mockOrderParams, pickMoney: 1000000 };
      const result = await service.createOrder(params);

      expect(result.labelId).toBeDefined();
    });

    it('should create order without COD', async () => {
      const params = { ...mockOrderParams, pickMoney: 0 };
      const result = await service.createOrder(params);

      expect(result.labelId).toBeDefined();
    });

    it('should create order with multiple products', async () => {
      const params = {
        ...mockOrderParams,
        products: [
          { name: 'Product 1', weight: 500, quantity: 2 },
          { name: 'Product 2', weight: 300, quantity: 1 },
          { name: 'Product 3', weight: 200, quantity: 3 },
        ],
      };

      const result = await service.createOrder(params);

      expect(result.labelId).toBeDefined();
    });
  });

  describe('calculateFee', () => {
    it('should calculate shipping fee successfully', async () => {
      const params = {
        pickProvince: 'TP. Hồ Chí Minh',
        pickDistrict: 'Quận 1',
        province: 'Hà Nội',
        district: 'Quận Hoàn Kiếm',
        weight: 1000,
        value: 500000,
      };

      const result = await service.calculateFee(params);

      expect(result.fee).toBe(22000);
      expect(result.insuranceFee).toBe(3000);
      expect(result.error).toBeUndefined();
    });

    it('should calculate fee with transport type', async () => {
      const params = {
        pickProvince: 'TP. Hồ Chí Minh',
        pickDistrict: 'Quận 1',
        province: 'Hà Nội',
        district: 'Quận Hoàn Kiếm',
        weight: 1000,
        value: 500000,
        transport: 'fly',
      };

      const result = await service.calculateFee(params);

      expect(result.fee).toBeDefined();
    });

    it('should calculate fee for light package', async () => {
      const params = {
        pickProvince: 'TP. Hồ Chí Minh',
        pickDistrict: 'Quận 1',
        province: 'Hà Nội',
        district: 'Quận Hoàn Kiếm',
        weight: 100,
        value: 50000,
      };

      const result = await service.calculateFee(params);

      expect(result.fee).toBeDefined();
    });

    it('should calculate fee for heavy package', async () => {
      const params = {
        pickProvince: 'TP. Hồ Chí Minh',
        pickDistrict: 'Quận 1',
        province: 'Hà Nội',
        district: 'Quận Hoàn Kiếm',
        weight: 50000,
        value: 10000000,
      };

      const result = await service.calculateFee(params);

      expect(result.fee).toBeDefined();
    });
  });

  describe('trackShipment', () => {
    it('should track shipment successfully', async () => {
      const result = await service.trackShipment('GHTK123456');

      expect(result.status).toBe('5');
      expect(result.statusText).toBe('Đang giao hàng');
      expect(result.currentLocation).toBeDefined();
      expect(result.estimatedDeliveryTime).toBeInstanceOf(Date);
      expect(result.history).toBeInstanceOf(Array);
      expect(result.history?.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should track with different label IDs', async () => {
      const result1 = await service.trackShipment('GHTK111');
      const result2 = await service.trackShipment('GHTK222');

      expect(result1.status).toBeDefined();
      expect(result2.status).toBeDefined();
    });

    it('should return history with correct structure', async () => {
      const result = await service.trackShipment('GHTK123456');

      expect(result.history).toBeDefined();
      if (result.history && result.history.length > 0) {
        const firstHistory = result.history[0];
        expect(firstHistory.time).toBeInstanceOf(Date);
        expect(firstHistory.status).toBeDefined();
        expect(firstHistory.location).toBeDefined();
      }
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const result = await service.cancelOrder('GHTK123456');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Order cancelled successfully');
    });

    it('should cancel with different label IDs', async () => {
      const result1 = await service.cancelOrder('GHTK111');
      const result2 = await service.cancelOrder('GHTK222');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should cancel with empty label ID', async () => {
      const result = await service.cancelOrder('');

      expect(result.success).toBe(true);
    });
  });

  describe('getStatusText', () => {
    it('should return correct status text for known statuses', () => {
      const testCases = [
        { status: '-1', expected: 'Hủy đơn hàng' },
        { status: '1', expected: 'Chưa tiếp nhận' },
        { status: '2', expected: 'Đã tiếp nhận' },
        { status: '3', expected: 'Đã lấy hàng/Đã nhập kho' },
        { status: '5', expected: 'Đã giao hàng/Chưa đối soát' },
      ];

      testCases.forEach(({ status, expected }) => {
        const result = (service as any).getStatusText(status);
        expect(result).toBe(expected);
      });
    });

    it('should return status code for unknown status', () => {
      const result = (service as any).getStatusText('999');
      expect(result).toBe('999');
    });

    it('should handle empty status', () => {
      const result = (service as any).getStatusText('');
      expect(result).toBe('');
    });
  });
});

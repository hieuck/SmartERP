import { Test, TestingModule } from '@nestjs/testing';
import { VNPostService, VNPostCreateOrderParams } from './vnpost.service';

describe('VNPostService', () => {
  let service: VNPostService;

  const mockOrderParams: VNPostCreateOrderParams = {
    toName: 'Receiver Name',
    toPhone: '0909876543',
    toAddress: '456 Receiver St',
    toProvince: 'Hà Nội',
    toDistrict: 'Quận Hoàn Kiếm',
    toWard: 'Phường Hàng Bạc',
    codAmount: 500000,
    weight: 1000,
    length: 30,
    width: 20,
    height: 10,
    serviceCode: 'EMS',
    items: [
      { name: 'Product 1', quantity: 2, price: 250000 },
    ],
    note: 'Handle with care',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VNPostService],
    }).compile();

    service = module.get<VNPostService>(VNPostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize VNPost service with config', () => {
      expect(service).toBeDefined();
      expect((service as any).config).toBeDefined();
      expect((service as any).config.apiUrl).toBeDefined();
    });
  });

  describe('createOrder', () => {
    it('should create VNPost order successfully', async () => {
      const result = await service.createOrder(mockOrderParams);

      expect(result.orderCode).toBeDefined();
      expect(result.orderCode).toContain('VNP');
      expect(result.trackingNumber).toBeDefined();
      expect(result.expectedDeliveryTime).toBeInstanceOf(Date);
      expect(result.shippingFee).toBe(22000);
      expect(result.error).toBeUndefined();
    });

    it('should create order without optional note', async () => {
      const params = { ...mockOrderParams, note: undefined };
      const result = await service.createOrder(params);

      expect(result.orderCode).toBeDefined();
    });

    it('should create order with different service codes', async () => {
      const params1 = { ...mockOrderParams, serviceCode: 'EMS' };
      const params2 = { ...mockOrderParams, serviceCode: 'BK' };

      const result1 = await service.createOrder(params1);
      const result2 = await service.createOrder(params2);

      expect(result1.orderCode).toBeDefined();
      expect(result2.orderCode).toBeDefined();
    });

    it('should create order with COD', async () => {
      const params = { ...mockOrderParams, codAmount: 1000000 };
      const result = await service.createOrder(params);

      expect(result.orderCode).toBeDefined();
    });

    it('should create order without COD', async () => {
      const params = { ...mockOrderParams, codAmount: 0 };
      const result = await service.createOrder(params);

      expect(result.orderCode).toBeDefined();
    });

    it('should create order with multiple items', async () => {
      const params = {
        ...mockOrderParams,
        items: [
          { name: 'Item 1', quantity: 2, price: 100000 },
          { name: 'Item 2', quantity: 1, price: 200000 },
        ],
      };

      const result = await service.createOrder(params);

      expect(result.orderCode).toBeDefined();
    });
  });

  describe('calculateFee', () => {
    it('should calculate shipping fee successfully', async () => {
      const params = {
        fromProvince: 'TP. Hồ Chí Minh',
        toProvince: 'Hà Nội',
        weight: 1000,
        length: 30,
        width: 20,
        height: 10,
        serviceCode: 'EMS',
        codAmount: 500000,
      };

      const result = await service.calculateFee(params);

      expect(result.total).toBe(22000);
      expect(result.serviceFee).toBe(18000);
      expect(result.insuranceFee).toBe(4000);
      expect(result.error).toBeUndefined();
    });

    it('should calculate fee without COD', async () => {
      const params = {
        fromProvince: 'TP. Hồ Chí Minh',
        toProvince: 'Hà Nội',
        weight: 1000,
        length: 30,
        width: 20,
        height: 10,
        serviceCode: 'EMS',
      };

      const result = await service.calculateFee(params);

      expect(result.total).toBeDefined();
    });
  });

  describe('trackShipment', () => {
    it('should track shipment successfully', async () => {
      const result = await service.trackShipment('VNP123456');

      expect(result.status).toBe('in_transit');
      expect(result.statusText).toBe('Đang vận chuyển');
      expect(result.currentLocation).toBeDefined();
      expect(result.expectedDeliveryTime).toBeInstanceOf(Date);
      expect(result.history).toBeInstanceOf(Array);
      expect(result.error).toBeUndefined();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const result = await service.cancelOrder('VNP123456');

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
    });
  });

  describe('getAvailableServices', () => {
    it('should return available services', async () => {
      const result = await service.getAvailableServices();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].serviceCode).toBeDefined();
    });
  });

  describe('getStatusText', () => {
    it('should return correct status text', () => {
      expect((service as any).getStatusText('delivered')).toBe('Đã giao hàng');
      expect((service as any).getStatusText('in_transit')).toBe('Đang vận chuyển');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ViettelPostService, ViettelPostCreateOrderParams } from './viettelpost.service';

describe('ViettelPostService', () => {
  let service: ViettelPostService;

  const mockOrderParams: ViettelPostCreateOrderParams = {
    orderNumber: 'ORDER-123',
    senderFullname: 'Sender Name',
    senderAddress: '123 Sender St',
    senderPhone: '0901234567',
    senderEmail: 'sender@example.com',
    senderWard: 1,
    senderDistrict: 1,
    senderProvince: 1,
    receiverFullname: 'Receiver Name',
    receiverAddress: '456 Receiver St',
    receiverPhone: '0909876543',
    receiverEmail: 'receiver@example.com',
    receiverWard: 2,
    receiverDistrict: 2,
    receiverProvince: 2,
    productName: 'Test Product',
    productPrice: 500000,
    productWeight: 1000,
    productQuantity: 1,
    moneyCollection: 500000,
    serviceType: 1,
    nationalType: 3,
    note: 'Handle with care',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ViettelPostService],
    }).compile();

    service = module.get<ViettelPostService>(ViettelPostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize ViettelPost service with config', () => {
      expect(service).toBeDefined();
      expect((service as any).config).toBeDefined();
      expect((service as any).config.apiUrl).toBeDefined();
    });
  });

  describe('login', () => {
    it('should login and get token successfully', async () => {
      const token = await (service as any).login();

      expect(token).toBeDefined();
      expect(token).toBe('mock-viettelpost-token');
      expect((service as any).token).toBe('mock-viettelpost-token');
    });
  });

  describe('createOrder', () => {
    it('should create ViettelPost order successfully', async () => {
      const result = await service.createOrder(mockOrderParams);

      expect(result.orderNumber).toBeDefined();
      expect(result.orderNumber).toContain('VTP');
      expect(result.moneyTotal).toBe(28000);
      expect(result.exchangeWeight).toBe(mockOrderParams.productWeight);
      expect(result.error).toBeUndefined();
    });

    it('should create order without optional fields', async () => {
      const minimalParams = {
        ...mockOrderParams,
        senderEmail: undefined,
        receiverEmail: undefined,
        note: undefined,
      };

      const result = await service.createOrder(minimalParams);

      expect(result.orderNumber).toBeDefined();
    });

    it('should create order with different service types', async () => {
      const params1 = { ...mockOrderParams, serviceType: 1 }; // VCN
      const params2 = { ...mockOrderParams, serviceType: 2 }; // VTK

      const result1 = await service.createOrder(params1);
      const result2 = await service.createOrder(params2);

      expect(result1.orderNumber).toBeDefined();
      expect(result2.orderNumber).toBeDefined();
    });

    it('should create order with different national types', async () => {
      const params1 = { ...mockOrderParams, nationalType: 1 }; // Nội tỉnh
      const params2 = { ...mockOrderParams, nationalType: 2 }; // Nội vùng
      const params3 = { ...mockOrderParams, nationalType: 3 }; // Liên vùng

      const result1 = await service.createOrder(params1);
      const result2 = await service.createOrder(params2);
      const result3 = await service.createOrder(params3);

      expect(result1.orderNumber).toBeDefined();
      expect(result2.orderNumber).toBeDefined();
      expect(result3.orderNumber).toBeDefined();
    });

    it('should create order with COD', async () => {
      const params = { ...mockOrderParams, moneyCollection: 1000000 };
      const result = await service.createOrder(params);

      expect(result.orderNumber).toBeDefined();
    });

    it('should create order without COD', async () => {
      const params = { ...mockOrderParams, moneyCollection: 0 };
      const result = await service.createOrder(params);

      expect(result.orderNumber).toBeDefined();
    });
  });

  describe('calculateFee', () => {
    it('should calculate shipping fee successfully', async () => {
      const params = {
        senderProvince: 1,
        senderDistrict: 1,
        receiverProvince: 2,
        receiverDistrict: 2,
        productWeight: 1000,
        productPrice: 500000,
        moneyCollection: 500000,
        serviceType: 1,
        nationalType: 3,
      };

      const result = await service.calculateFee(params);

      expect(result.moneyTotal).toBe(28000);
      expect(result.moneyTotalFee).toBe(28000);
      expect(result.moneyFee).toBe(25000);
      expect(result.moneyCollection).toBe(3000);
      expect(result.moneyVas).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('should calculate fee for light package', async () => {
      const params = {
        senderProvince: 1,
        senderDistrict: 1,
        receiverProvince: 2,
        receiverDistrict: 2,
        productWeight: 100,
        productPrice: 50000,
        moneyCollection: 0,
        serviceType: 1,
        nationalType: 1,
      };

      const result = await service.calculateFee(params);

      expect(result.moneyTotal).toBeDefined();
    });

    it('should calculate fee for heavy package', async () => {
      const params = {
        senderProvince: 1,
        senderDistrict: 1,
        receiverProvince: 2,
        receiverDistrict: 2,
        productWeight: 50000,
        productPrice: 10000000,
        moneyCollection: 10000000,
        serviceType: 2,
        nationalType: 3,
      };

      const result = await service.calculateFee(params);

      expect(result.moneyTotal).toBeDefined();
    });
  });

  describe('trackShipment', () => {
    it('should track shipment successfully', async () => {
      const result = await service.trackShipment('VTP123456');

      expect(result.status).toBe(505);
      expect(result.statusText).toBe('Đang giao hàng');
      expect(result.currentLocation).toBeDefined();
      expect(result.history).toBeInstanceOf(Array);
      expect(result.history?.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should track with different order numbers', async () => {
      const result1 = await service.trackShipment('VTP111');
      const result2 = await service.trackShipment('VTP222');

      expect(result1.status).toBeDefined();
      expect(result2.status).toBeDefined();
    });

    it('should return history with correct structure', async () => {
      const result = await service.trackShipment('VTP123456');

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
      const result = await service.cancelOrder('VTP123456', 'Customer request');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Order cancelled successfully');
    });

    it('should cancel with different order numbers', async () => {
      const result1 = await service.cancelOrder('VTP111', 'Reason 1');
      const result2 = await service.cancelOrder('VTP222', 'Reason 2');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should cancel with empty note', async () => {
      const result = await service.cancelOrder('VTP123456', '');

      expect(result.success).toBe(true);
    });
  });

  describe('getStatusText', () => {
    it('should return correct status text for known statuses', () => {
      const testCases = [
        { status: 100, expected: 'Đã tiếp nhận' },
        { status: 102, expected: 'Đã lấy hàng' },
        { status: 103, expected: 'Đã nhập kho' },
        { status: 201, expected: 'Đã giao hàng' },
        { status: 505, expected: 'Đang giao hàng' },
      ];

      testCases.forEach(({ status, expected }) => {
        const result = (service as any).getStatusText(status);
        expect(result).toBe(expected);
      });
    });

    it('should return status code for unknown status', () => {
      const result = (service as any).getStatusText(999);
      expect(result).toBe('Status 999');
    });

    it('should handle zero status', () => {
      const result = (service as any).getStatusText(0);
      expect(result).toBe('Status 0');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MomoService, MomoPaymentParams } from './momo.service';
import * as crypto from 'crypto';

describe('MomoService', () => {
  let service: MomoService;
  let mockCreateHmac: jest.SpyInstance;
  let mockUpdate: jest.Mock;
  let mockDigest: jest.Mock;

  beforeEach(async () => {
    // Setup crypto mocks
    mockDigest = jest.fn().mockReturnValue('mocked-signature');
    mockUpdate = jest.fn().mockReturnValue({ digest: mockDigest });
    mockCreateHmac = jest.spyOn(crypto, 'createHmac').mockReturnValue({
      update: mockUpdate,
      digest: mockDigest,
    } as any);

    // Setup environment variables
    process.env.MOMO_PARTNER_CODE = 'TEST_PARTNER';
    process.env.MOMO_ACCESS_KEY = 'TEST_ACCESS_KEY';
    process.env.MOMO_SECRET_KEY = 'TEST_SECRET_KEY';
    process.env.MOMO_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';
    process.env.MOMO_REDIRECT_URL = 'http://localhost:3000/payment/momo/return';
    process.env.MOMO_IPN_URL = 'http://localhost:3000/payment/momo/ipn';

    const module: TestingModule = await Test.createTestingModule({
      providers: [MomoService],
    }).compile();

    service = module.get<MomoService>(MomoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockCreateHmac.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect(service).toBeDefined();
      expect((service as any).config.partnerCode).toBe('TEST_PARTNER');
      expect((service as any).config.accessKey).toBe('TEST_ACCESS_KEY');
      expect((service as any).config.secretKey).toBe('TEST_SECRET_KEY');
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.MOMO_PARTNER_CODE;
      delete process.env.MOMO_ACCESS_KEY;
      delete process.env.MOMO_SECRET_KEY;

      const newService = new MomoService();

      expect((newService as any).config.partnerCode).toBe('');
      expect((newService as any).config.accessKey).toBe('');
      expect((newService as any).config.secretKey).toBe('');
    });
  });

  describe('createPayment', () => {
    const validParams: MomoPaymentParams = {
      orderId: 'ORDER-123',
      amount: 100000,
      orderInfo: 'Payment for order ORDER-123',
    };

    it('should create payment successfully with default requestType', async () => {
      const result = await service.createPayment(validParams);

      expect(result.payUrl).toContain('TEST_PARTNER');
      expect(result.payUrl).toContain('ORDER-123');
      expect(result.qrCodeUrl).toContain('ORDER-123');
      expect(result.deeplink).toContain('ORDER-123');
      expect(result.error).toBeUndefined();
    });

    it('should create payment with custom requestType', async () => {
      const params: MomoPaymentParams = {
        ...validParams,
        requestType: 'payWithATM',
      };

      const result = await service.createPayment(params);

      expect(result.payUrl).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should create payment with extraData', async () => {
      const params: MomoPaymentParams = {
        ...validParams,
        extraData: 'customerId=123',
      };

      const result = await service.createPayment(params);

      expect(result.payUrl).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should generate correct signature', async () => {
      await service.createPayment(validParams);

      expect(mockCreateHmac).toHaveBeenCalledWith('sha256', 'TEST_SECRET_KEY');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDigest).toHaveBeenCalledWith('hex');
    });

    it('should handle payment creation with zero amount', async () => {
      const params: MomoPaymentParams = {
        ...validParams,
        amount: 0,
      };

      const result = await service.createPayment(params);

      expect(result.payUrl).toBeDefined();
    });

    it('should handle payment creation with large amount', async () => {
      const params: MomoPaymentParams = {
        ...validParams,
        amount: 999999999,
      };

      const result = await service.createPayment(params);

      expect(result.payUrl).toBeDefined();
    });

    it('should include all required fields in raw signature', async () => {
      await service.createPayment(validParams);

      const callArg = mockUpdate.mock.calls[0][0];
      expect(callArg).toContain('accessKey=TEST_ACCESS_KEY');
      expect(callArg).toContain('amount=100000');
      expect(callArg).toContain('orderId=ORDER-123');
      expect(callArg).toContain('orderInfo=Payment for order ORDER-123');
      expect(callArg).toContain('partnerCode=TEST_PARTNER');
    });
  });

  describe('verifyIPN', () => {
    const validIPNData = {
      partnerCode: 'TEST_PARTNER',
      orderId: 'ORDER-123',
      requestId: 'REQ-123',
      amount: 100000,
      orderInfo: 'Payment for order',
      orderType: 'momo_wallet',
      transId: 'TRANS-123',
      resultCode: 0,
      message: 'Success',
      payType: 'qr',
      responseTime: '2024-01-01 10:00:00',
      extraData: '',
      signature: 'mocked-signature',
    };

    it('should verify IPN successfully with valid signature', () => {
      const result = service.verifyIPN(validIPNData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment successful');
      expect(result.transactionId).toBe('TRANS-123');
      expect(result.amount).toBe(100000);
    });

    it('should reject IPN with invalid signature', () => {
      const invalidData = {
        ...validIPNData,
        signature: 'invalid-signature',
      };

      const result = service.verifyIPN(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('should handle failed payment with result code 1000', () => {
      const failedData = {
        ...validIPNData,
        resultCode: 1000,
        message: 'Transaction initiated',
      };

      const result = service.verifyIPN(failedData);

      expect(result.success).toBe(false);
      expect(result.transactionId).toBe('TRANS-123');
      expect(result.amount).toBe(100000);
    });

    it('should handle payment with result code 9000', () => {
      const pendingData = {
        ...validIPNData,
        resultCode: 9000,
      };

      const result = service.verifyIPN(pendingData);

      expect(result.success).toBe(false);
    });

    it('should generate correct signature for verification', () => {
      service.verifyIPN(validIPNData);

      expect(mockCreateHmac).toHaveBeenCalledWith('sha256', 'TEST_SECRET_KEY');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDigest).toHaveBeenCalledWith('hex');
    });

    it('should handle IPN with extraData', () => {
      const dataWithExtra = {
        ...validIPNData,
        extraData: 'customerId=123',
      };

      const result = service.verifyIPN(dataWithExtra);

      expect(result.success).toBe(true);
    });

    it('should return appropriate message for unknown result code', () => {
      const unknownCodeData = {
        ...validIPNData,
        resultCode: 99999,
        message: '',
      };

      const result = service.verifyIPN(unknownCodeData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi không xác định');
    });
  });

  describe('queryTransaction', () => {
    it('should query transaction successfully', async () => {
      const result = await service.queryTransaction('ORDER-123', 'REQ-123');

      expect(result).toBeDefined();
      expect(result.orderId).toBe('ORDER-123');
      expect(result.requestId).toBe('REQ-123');
      expect(result.partnerCode).toBe('TEST_PARTNER');
    });

    it('should generate correct signature for query', async () => {
      await service.queryTransaction('ORDER-123', 'REQ-123');

      expect(mockCreateHmac).toHaveBeenCalledWith('sha256', 'TEST_SECRET_KEY');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDigest).toHaveBeenCalledWith('hex');
    });

    it('should include signature in request body', async () => {
      const result = await service.queryTransaction('ORDER-123', 'REQ-123');

      expect(result.signature).toBe('mocked-signature');
    });

    it('should handle query with special characters in orderId', async () => {
      const result = await service.queryTransaction('ORDER-123-ĐẶC-BIỆT', 'REQ-123');

      expect(result.orderId).toBe('ORDER-123-ĐẶC-BIỆT');
    });
  });

  describe('refundTransaction', () => {
    it('should refund transaction successfully', async () => {
      const result = await service.refundTransaction(
        'ORDER-123',
        'TRANS-123',
        50000,
        'Customer request',
      );

      expect(result).toBeDefined();
      expect(result.orderId).toBe('ORDER-123');
      expect(result.transId).toBe('TRANS-123');
      expect(result.amount).toBe(50000);
      expect(result.description).toBe('Customer request');
    });

    it('should generate correct signature for refund', async () => {
      await service.refundTransaction('ORDER-123', 'TRANS-123', 50000, 'Refund reason');

      expect(mockCreateHmac).toHaveBeenCalledWith('sha256', 'TEST_SECRET_KEY');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDigest).toHaveBeenCalledWith('hex');
    });

    it('should include all required fields in refund request', async () => {
      const result = await service.refundTransaction(
        'ORDER-123',
        'TRANS-123',
        50000,
        'Refund reason',
      );

      expect(result.partnerCode).toBe('TEST_PARTNER');
      expect(result.accessKey).toBe('TEST_ACCESS_KEY');
      expect(result.signature).toBe('mocked-signature');
    });

    it('should handle refund with zero amount', async () => {
      const result = await service.refundTransaction('ORDER-123', 'TRANS-123', 0, 'Test');

      expect(result.amount).toBe(0);
    });

    it('should handle refund with full amount', async () => {
      const result = await service.refundTransaction(
        'ORDER-123',
        'TRANS-123',
        100000,
        'Full refund',
      );

      expect(result.amount).toBe(100000);
    });

    it('should generate unique requestId for each refund', async () => {
      const result1 = await service.refundTransaction('ORDER-123', 'TRANS-123', 50000, 'Reason 1');

      // Wait 1ms to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      const result2 = await service.refundTransaction('ORDER-123', 'TRANS-123', 50000, 'Reason 2');

      expect(result1.requestId).not.toBe(result2.requestId);
    });
  });

  describe('getResultMessage', () => {
    it('should return correct message for result code 0', () => {
      const message = (service as any).getResultMessage(0);
      expect(message).toBe('Giao dịch thành công');
    });

    it('should return correct message for result code 1001', () => {
      const message = (service as any).getResultMessage(1001);
      expect(message).toBe('Giao dịch thanh toán thất bại do tài khoản người dùng không đủ tiền');
    });

    it('should return correct message for result code 9999', () => {
      const message = (service as any).getResultMessage(9999);
      expect(message).toBe('Giao dịch thất bại');
    });

    it('should return default message for unknown code', () => {
      const message = (service as any).getResultMessage(88888);
      expect(message).toBe('Lỗi không xác định');
    });
  });
});

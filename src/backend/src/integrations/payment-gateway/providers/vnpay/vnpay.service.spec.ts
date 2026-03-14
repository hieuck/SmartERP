import { Test, TestingModule } from '@nestjs/testing';
import { VNPayService } from './vnpay.service';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

describe('VNPayService', () => {
  let service: VNPayService;

  beforeEach(async () => {
    // Set environment variables for testing
    process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNPAY_TMN_CODE = 'TEST_TMN_CODE';
    process.env.VNPAY_HASH_SECRET = 'TEST_SECRET_KEY';
    process.env.VNPAY_RETURN_URL = 'http://localhost:3000/payment/vnpay/return';
    process.env.VNPAY_API_URL = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

    const module: TestingModule = await Test.createTestingModule({
      providers: [VNPayService],
    }).compile();

    service = module.get<VNPayService>(VNPayService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.VNPAY_URL;
    delete process.env.VNPAY_TMN_CODE;
    delete process.env.VNPAY_HASH_SECRET;
    delete process.env.VNPAY_RETURN_URL;
    delete process.env.VNPAY_API_URL;
  });

  describe('createPaymentUrl', () => {
    it('should create valid payment URL with required params', () => {
      const params = {
        orderId: 'ORDER123',
        amount: 100000,
        orderInfo: 'Payment for order ORDER123',
        ipAddr: '127.0.0.1',
      };

      const paymentUrl = service.createPaymentUrl(params);

      expect(paymentUrl).toBeDefined();
      expect(paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
      expect(paymentUrl).toContain('vnp_TmnCode=TEST_TMN_CODE');
      expect(paymentUrl).toContain('vnp_Amount=10000000'); // 100000 * 100
      expect(paymentUrl).toContain('vnp_TxnRef=ORDER123');
      expect(paymentUrl).toContain('vnp_OrderInfo=Payment%20for%20order%20ORDER123');
      expect(paymentUrl).toContain('vnp_SecureHash=');
    });

    it('should create payment URL with bank code', () => {
      const params = {
        orderId: 'ORDER456',
        amount: 50000,
        orderInfo: 'Test payment',
        ipAddr: '192.168.1.1',
        bankCode: 'NCB',
      };

      const paymentUrl = service.createPaymentUrl(params);

      expect(paymentUrl).toContain('vnp_BankCode=NCB');
    });

    it('should create payment URL with custom locale', () => {
      const params = {
        orderId: 'ORDER789',
        amount: 200000,
        orderInfo: 'Test payment',
        ipAddr: '127.0.0.1',
        locale: 'en',
      };

      const paymentUrl = service.createPaymentUrl(params);

      expect(paymentUrl).toContain('vnp_Locale=en');
    });

    it('should use default locale "vn" when not specified', () => {
      const params = {
        orderId: 'ORDER999',
        amount: 150000,
        orderInfo: 'Test payment',
        ipAddr: '127.0.0.1',
      };

      const paymentUrl = service.createPaymentUrl(params);

      expect(paymentUrl).toContain('vnp_Locale=vn');
    });

    it('should convert amount to smallest currency unit', () => {
      const params = {
        orderId: 'ORDER111',
        amount: 123.45,
        orderInfo: 'Test payment',
        ipAddr: '127.0.0.1',
      };

      const paymentUrl = service.createPaymentUrl(params);

      // 123.45 * 100 = 12345
      expect(paymentUrl).toContain('vnp_Amount=12345');
    });

    it('should include all required VNPay parameters', () => {
      const params = {
        orderId: 'ORDER222',
        amount: 100000,
        orderInfo: 'Test payment',
        ipAddr: '127.0.0.1',
      };

      const paymentUrl = service.createPaymentUrl(params);

      expect(paymentUrl).toContain('vnp_Version=2.1.0');
      expect(paymentUrl).toContain('vnp_Command=pay');
      expect(paymentUrl).toContain('vnp_CurrCode=VND');
      expect(paymentUrl).toContain('vnp_OrderType=other');
      expect(paymentUrl).toContain('vnp_ReturnUrl=');
      expect(paymentUrl).toContain('vnp_IpAddr=');
      expect(paymentUrl).toContain('vnp_CreateDate=');
      expect(paymentUrl).toContain('vnp_ExpireDate=');
    });
  });

  describe('verifyPaymentCallback', () => {
    it('should verify successful payment with valid signature', () => {
      // Create params without signature first
      const paramsWithoutHash: Record<string, unknown> = {
        vnp_Amount: '10000000',
        vnp_BankCode: 'NCB',
        vnp_BankTranNo: 'VNP01234567',
        vnp_CardType: 'ATM',
        vnp_OrderInfo: 'Payment for order ORDER123',
        vnp_PayDate: '20240101120000',
        vnp_ResponseCode: '00',
        vnp_TmnCode: 'TEST_TMN_CODE',
        vnp_TransactionNo: '14123456',
        vnp_TransactionStatus: '00',
        vnp_TxnRef: 'ORDER123',
      };

      // Sort params exactly like the service does
      const sortedKeys = Object.keys(paramsWithoutHash).sort();
      const sortedParams: Record<string, unknown> = {};
      sortedKeys.forEach((key) => {
        sortedParams[key] = paramsWithoutHash[key];
      });

      // Create signature using querystring.stringify like the service
      const signData = querystring.stringify(sortedParams as querystring.ParsedUrlQueryInput);
      const hmac = crypto.createHmac('sha512', 'TEST_SECRET_KEY');
      const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      // Add signature to params
      const vnpParams = { ...paramsWithoutHash, vnp_SecureHash: signature };

      const result = service.verifyPaymentCallback(vnpParams);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment successful');
      expect(result.transactionId).toBe('14123456');
      expect(result.amount).toBe(100000); // 10000000 / 100
      expect(result.orderInfo).toBe('Payment for order ORDER123');
    });

    it('should reject payment with invalid signature', () => {
      const vnpParams: Record<string, unknown> = {
        vnp_Amount: '10000000',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '14123456',
        vnp_OrderInfo: 'Test payment',
        vnp_SecureHash: 'invalid_signature',
      };

      const result = service.verifyPaymentCallback(vnpParams);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('should handle failed payment with response code 24 (cancelled)', () => {
      const paramsWithoutHash: Record<string, unknown> = {
        vnp_Amount: '10000000',
        vnp_ResponseCode: '24',
        vnp_TransactionNo: '14123457',
        vnp_OrderInfo: 'Test payment',
        vnp_TxnRef: 'ORDER456',
      };

      // Sort params exactly like the service does
      const sortedKeys = Object.keys(paramsWithoutHash).sort();
      const sortedParams: Record<string, unknown> = {};
      sortedKeys.forEach((key) => {
        sortedParams[key] = paramsWithoutHash[key];
      });

      const signData = querystring.stringify(sortedParams as querystring.ParsedUrlQueryInput);
      const hmac = crypto.createHmac('sha512', 'TEST_SECRET_KEY');
      const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      const vnpParams = { ...paramsWithoutHash, vnp_SecureHash: signature };

      const result = service.verifyPaymentCallback(vnpParams);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Khách hàng hủy giao dịch');
      expect(result.transactionId).toBe('14123457');
    });

    it('should handle insufficient balance error (code 51)', () => {
      const paramsWithoutHash: Record<string, unknown> = {
        vnp_Amount: '10000000',
        vnp_ResponseCode: '51',
        vnp_TransactionNo: '14123458',
        vnp_OrderInfo: 'Test payment',
      };

      const sortedKeys = Object.keys(paramsWithoutHash).sort();
      const sortedParams: Record<string, unknown> = {};
      sortedKeys.forEach((key) => {
        sortedParams[key] = paramsWithoutHash[key];
      });

      const signData = querystring.stringify(sortedParams as querystring.ParsedUrlQueryInput);
      const hmac = crypto.createHmac('sha512', 'TEST_SECRET_KEY');
      const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      const vnpParams = { ...paramsWithoutHash, vnp_SecureHash: signature };

      const result = service.verifyPaymentCallback(vnpParams);

      expect(result.success).toBe(false);
      expect(result.message).toContain('không đủ số dư');
    });

    it('should handle unknown error code', () => {
      const paramsWithoutHash: Record<string, unknown> = {
        vnp_Amount: '10000000',
        vnp_ResponseCode: '999',
        vnp_TransactionNo: '14123459',
        vnp_OrderInfo: 'Test payment',
      };

      const sortedKeys = Object.keys(paramsWithoutHash).sort();
      const sortedParams: Record<string, unknown> = {};
      sortedKeys.forEach((key) => {
        sortedParams[key] = paramsWithoutHash[key];
      });

      const signData = querystring.stringify(sortedParams as querystring.ParsedUrlQueryInput);
      const hmac = crypto.createHmac('sha512', 'TEST_SECRET_KEY');
      const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      const vnpParams = { ...paramsWithoutHash, vnp_SecureHash: signature };

      const result = service.verifyPaymentCallback(vnpParams);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi không xác định');
    });

    it('should handle all VNPay error codes', () => {
      const errorCodes = ['07', '09', '10', '11', '12', '13', '65', '75', '79', '99'];

      errorCodes.forEach((code) => {
        const vnpParams: Record<string, unknown> = {
          vnp_Amount: '10000000',
          vnp_ResponseCode: code,
          vnp_TransactionNo: `1412345${code}`,
          vnp_OrderInfo: 'Test payment',
        };

        const sortedParams = Object.keys(vnpParams)
          .sort()
          .reduce((acc, key) => {
            acc[key] = vnpParams[key];
            return acc;
          }, {} as Record<string, unknown>);

        const signData = new URLSearchParams(sortedParams as any).toString();
        const hmac = crypto.createHmac('sha512', 'TEST_SECRET_KEY');
        const signature = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        vnpParams['vnp_SecureHash'] = signature;

        const result = service.verifyPaymentCallback(vnpParams);

        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('queryTransaction', () => {
    it('should create query transaction request with valid params', async () => {
      const orderId = 'ORDER123';
      const transactionDate = '20240101120000';

      const result = await service.queryTransaction(orderId, transactionDate);

      expect(result).toBeDefined();
      expect(result.vnp_Command).toBe('querydr');
      expect(result.vnp_TxnRef).toBe(orderId);
      expect(result.vnp_TransactionDate).toBe(transactionDate);
      expect(result.vnp_SecureHash).toBeDefined();
      expect(typeof result.vnp_SecureHash).toBe('string');
    });

    it('should include all required query parameters', async () => {
      const orderId = 'ORDER456';
      const transactionDate = '20240102150000';

      const result = await service.queryTransaction(orderId, transactionDate);

      expect(result.vnp_Version).toBe('2.1.0');
      expect(result.vnp_Command).toBe('querydr');
      expect(result.vnp_TmnCode).toBe('TEST_TMN_CODE');
      expect(result.vnp_OrderInfo).toContain('Query transaction');
      expect(result.vnp_IpAddr).toBe('127.0.0.1');
      expect(result.vnp_RequestId).toBeDefined();
      expect(result.vnp_CreateDate).toBeDefined();
    });
  });

  describe('refundTransaction', () => {
    it('should create refund request with valid params', async () => {
      const orderId = 'ORDER123';
      const amount = 100000;
      const transactionDate = '20240101120000';
      const createBy = 'admin';

      const result = await service.refundTransaction(orderId, amount, transactionDate, createBy);

      expect(result).toBeDefined();
      expect(result.vnp_Command).toBe('refund');
      expect(result.vnp_TxnRef).toBe(orderId);
      expect(result.vnp_Amount).toBe(10000000); // 100000 * 100
      expect(result.vnp_TransactionDate).toBe(transactionDate);
      expect(result.vnp_CreateBy).toBe(createBy);
      expect(result.vnp_SecureHash).toBeDefined();
    });

    it('should set transaction type to full refund', async () => {
      const result = await service.refundTransaction('ORDER789', 50000, '20240103100000', 'system');

      expect(result.vnp_TransactionType).toBe('02');
    });

    it('should include refund order info', async () => {
      const orderId = 'ORDER999';
      const result = await service.refundTransaction(orderId, 75000, '20240104110000', 'admin');

      expect(result.vnp_OrderInfo).toContain(`Refund for order ${orderId}`);
    });

    it('should handle decimal amounts correctly', async () => {
      const result = await service.refundTransaction('ORDER111', 123.45, '20240105120000', 'admin');

      expect(result.vnp_Amount).toBe(12345); // 123.45 * 100, rounded
    });
  });
});

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface MomoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  redirectUrl: string;
  ipnUrl: string;
}

export interface MomoPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  requestType?: string; // 'captureWallet' or 'payWithATM'
  extraData?: string;
}

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);
  private config: MomoConfig;

  constructor() {
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE || '',
      accessKey: process.env.MOMO_ACCESS_KEY || '',
      secretKey: process.env.MOMO_SECRET_KEY || '',
      endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
      redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment/momo/return',
      ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3000/payment/momo/ipn',
    };
  }

  /**
   * Create Momo payment request
   */
  async createPayment(params: MomoPaymentParams): Promise<{
    payUrl?: string;
    qrCodeUrl?: string;
    deeplink?: string;
    error?: string;
  }> {
    const requestId = `${params.orderId}_${Date.now()}`;
    const requestType = params.requestType || 'captureWallet';
    const extraData = params.extraData || '';

    // Create raw signature
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${params.amount}&extraData=${extraData}&ipnUrl=${this.config.ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${this.config.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    // Generate signature
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Create request body and send to MoMo
    // TODO: Use requestData when implementing actual API call
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const requestData = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId: requestId,
      amount: params.amount,
      orderId: params.orderId,
      orderInfo: params.orderInfo,
      redirectUrl: this.config.redirectUrl,
      ipnUrl: this.config.ipnUrl,
      requestType: requestType,
      extraData: extraData,
      lang: 'vi',
      signature: signature,
    };

    try {
      // TODO: Make HTTP POST request to Momo API with requestData
      // const response = await axios.post(this.config.endpoint, requestData);
      this.logger.log(`Creating Momo payment for order ${params.orderId}`);

      // Mock response for now
      return {
        payUrl: `https://test-payment.momo.vn/gw_payment/transactionProcessor?partnerCode=${this.config.partnerCode}&orderId=${params.orderId}`,
        qrCodeUrl: `https://test-payment.momo.vn/qr/${params.orderId}`,
        deeplink: `momo://app?action=pay&orderId=${params.orderId}`,
      };
    } catch (error) {
      this.logger.error(`Momo payment creation failed: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Verify Momo IPN (Instant Payment Notification)
   */
  verifyIPN(data: Record<string, unknown>): {
    success: boolean;
    message: string;
    transactionId?: string;
    amount?: number;
  } {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = data;

    // Type assertions for extracted values
    const amountStr = String(amount);
    const amountNum = Number(amount);
    const resultCodeNum = Number(resultCode);
    const transIdStr = String(transId);
    const messageStr = String(message);

    // Create raw signature for verification
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amountStr}&extraData=${extraData}&message=${messageStr}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCodeNum}&transId=${transIdStr}`;

    // Generate signature
    const expectedSignature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Verify signature
    if (signature !== expectedSignature) {
      this.logger.error('Momo signature verification failed');
      return {
        success: false,
        message: 'Invalid signature',
      };
    }

    // Check result code
    if (resultCodeNum === 0) {
      this.logger.log(`Momo payment successful: ${transIdStr}`);
      return {
        success: true,
        message: 'Payment successful',
        transactionId: transIdStr,
        amount: amountNum,
      };
    } else {
      this.logger.warn(`Momo payment failed with code: ${resultCodeNum}`);
      return {
        success: false,
        message: messageStr || this.getResultMessage(resultCodeNum),
        transactionId: transIdStr,
        amount: amountNum,
      };
    }
  }

  /**
   * Query transaction status
   */
  async queryTransaction(orderId: string, requestId: string): Promise<Record<string, unknown>> {
    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;

    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId: requestId,
      orderId: orderId,
      lang: 'vi',
      signature: signature,
    };

    try {
      // TODO: Make HTTP POST request to Momo query API
      this.logger.log(`Querying Momo transaction: ${orderId}`);
      return requestBody;
    } catch (error) {
      this.logger.error(`Momo query failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund transaction
   */
  async refundTransaction(
    orderId: string,
    transId: string,
    amount: number,
    description: string,
  ): Promise<Record<string, unknown>> {
    const requestId = `${orderId}_refund_${Date.now()}`;

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}&transId=${transId}`;

    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId: requestId,
      orderId: orderId,
      amount: amount,
      transId: transId,
      lang: 'vi',
      description: description,
      signature: signature,
    };

    try {
      // TODO: Make HTTP POST request to Momo refund API
      this.logger.log(`Refunding Momo transaction: ${orderId}`);
      return requestBody;
    } catch (error) {
      this.logger.error(`Momo refund failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get result message from result code
   */
  private getResultMessage(code: number): string {
    const messages: Record<number, string> = {
      0: 'Giao dịch thành công',
      9000: 'Giao dịch được khởi tạo, chờ người dùng xác nhận thanh toán',
      8000: 'Giao dịch đang được xử lý',
      7000: 'Giao dịch đang chờ thanh toán',
      1000: 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán',
      11: 'Truy cập bị từ chối',
      12: 'Phiên bản API không được hỗ trợ cho yêu cầu này',
      13: 'Xác thực doanh nghiệp thất bại',
      20: 'Yêu cầu sai định dạng',
      21: 'Số tiền giao dịch không hợp lệ',
      40: 'RequestId bị trùng',
      41: 'OrderId bị trùng',
      42: 'OrderId không hợp lệ hoặc không được tìm thấy',
      43: 'Yêu cầu bị từ chối vì xung đột trong quá trình xử lý giao dịch',
      1001: 'Giao dịch thanh toán thất bại do tài khoản người dùng không đủ tiền',
      1002: 'Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán',
      1003: 'Giao dịch bị hủy',
      1004: 'Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức thanh toán của người dùng',
      1005: 'Giao dịch thất bại do url hoặc QR code đã hết hạn',
      1006: 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán',
      1007: 'Giao dịch bị từ chối vì tài khoản người dùng đang ở trạng thái tạm khóa',
      2001: 'Giao dịch thất bại do sai thông tin liên kết',
      3001: 'Liên kết thanh toán không tồn tại hoặc đã hết hạn',
      3002: 'Tài khoản liên kết không tồn tại',
      3003: 'Tài khoản đã bị khóa hoặc chưa được kích hoạt',
      4001: 'Giao dịch bị hạn chế theo thể lệ chương trình khuyến mãi',
      4010: 'Đã vượt quá số lần thanh toán trong ngày của chương trình khuyến mãi',
      4011: 'Đã vượt quá số tiền thanh toán trong ngày của chương trình khuyến mãi',
      4100: 'Giao dịch thất bại do người dùng không nhập thành công mã OTP',
      9999: 'Giao dịch thất bại',
    };
    return messages[code] || 'Lỗi không xác định';
  }
}

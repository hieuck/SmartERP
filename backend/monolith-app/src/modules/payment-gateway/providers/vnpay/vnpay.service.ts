import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

export interface VNPayConfig {
  vnpUrl: string;
  vnpTmnCode: string;
  vnpHashSecret: string;
  vnpReturnUrl: string;
  vnpApiUrl?: string;
}

export interface VNPayPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  locale?: string;
  bankCode?: string;
}

@Injectable()
export class VNPayService {
  private readonly logger = new Logger(VNPayService.name);
  private config: VNPayConfig;

  constructor() {
    this.config = {
      vnpUrl: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      vnpTmnCode: process.env.VNPAY_TMN_CODE || '',
      vnpHashSecret: process.env.VNPAY_HASH_SECRET || '',
      vnpReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay/return',
      vnpApiUrl:
        process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    };
  }

  /**
   * Create VNPay payment URL
   */
  createPaymentUrl(params: VNPayPaymentParams): string {
    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60000)); // 15 minutes

    let vnpParams: Record<string, unknown> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.vnpTmnCode,
      vnp_Amount: Math.round(params.amount * 100), // VNPay uses smallest currency unit (VND * 100)
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: params.locale || 'vn',
      vnp_ReturnUrl: this.config.vnpReturnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Add bank code if specified
    if (params.bankCode) {
      vnpParams.vnp_BankCode = params.bankCode;
    }

    // Sort params
    vnpParams = this.sortObject(vnpParams);

    // Create signature
    const signData = querystring.stringify(vnpParams as querystring.ParsedUrlQueryInput);
    const hmac = crypto.createHmac('sha512', this.config.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams['vnp_SecureHash'] = signed;

    // Create payment URL
    const paymentUrl =
      this.config.vnpUrl +
      '?' +
      querystring.stringify(vnpParams as querystring.ParsedUrlQueryInput);

    this.logger.log(`Created VNPay payment URL for order ${params.orderId}`);

    return paymentUrl;
  }

  /**
   * Verify payment callback from VNPay
   */
  verifyPaymentCallback(vnpParams: Record<string, unknown>): {
    success: boolean;
    message: string;
    transactionId?: string;
    amount?: number;
    orderInfo?: string;
  } {
    const secureHash = vnpParams['vnp_SecureHash'] as string;
    const rspCode = vnpParams['vnp_ResponseCode'] as string;
    const transactionId = vnpParams['vnp_TransactionNo'] as string;
    const amount = parseInt(vnpParams['vnp_Amount'] as string) / 100; // Convert back to VND
    const orderInfo = vnpParams['vnp_OrderInfo'] as string;

    // Remove hash params for verification
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sort params
    const sortedParams = this.sortObject(vnpParams);

    // Create signature
    const signData = querystring.stringify(sortedParams as querystring.ParsedUrlQueryInput);
    const hmac = crypto.createHmac('sha512', this.config.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Verify signature
    if (secureHash !== signed) {
      this.logger.error('VNPay signature verification failed');
      return {
        success: false,
        message: 'Invalid signature',
      };
    }

    // Check response code
    if (rspCode === '00') {
      this.logger.log(`VNPay payment successful: ${transactionId}`);
      return {
        success: true,
        message: 'Payment successful',
        transactionId,
        amount,
        orderInfo,
      };
    } else {
      this.logger.warn(`VNPay payment failed with code: ${rspCode}`);
      return {
        success: false,
        message: this.getResponseMessage(rspCode),
        transactionId,
        amount,
        orderInfo,
      };
    }
  }

  /**
   * Query transaction status from VNPay
   */
  async queryTransaction(
    orderId: string,
    transactionDate: string,
  ): Promise<Record<string, unknown>> {
    const date = new Date();
    const requestId = this.formatDate(date);

    let vnpParams: Record<string, unknown> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: this.config.vnpTmnCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Query transaction ${orderId}`,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: requestId,
      vnp_IpAddr: '127.0.0.1',
      vnp_RequestId: requestId,
    };

    // Sort and sign
    vnpParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(vnpParams as querystring.ParsedUrlQueryInput);
    const hmac = crypto.createHmac('sha512', this.config.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams['vnp_SecureHash'] = signed;

    // TODO: Make HTTP request to VNPay API
    this.logger.log(`Querying VNPay transaction: ${orderId}`);

    return vnpParams;
  }

  /**
   * Refund transaction
   */
  async refundTransaction(
    orderId: string,
    amount: number,
    transactionDate: string,
    createBy: string,
  ): Promise<Record<string, unknown>> {
    const date = new Date();
    const requestId = this.formatDate(date);

    let vnpParams: Record<string, unknown> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: this.config.vnpTmnCode,
      vnp_TxnRef: orderId,
      vnp_Amount: Math.round(amount * 100),
      vnp_OrderInfo: `Refund for order ${orderId}`,
      vnp_TransactionType: '02', // Full refund
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: requestId,
      vnp_CreateBy: createBy,
      vnp_IpAddr: '127.0.0.1',
      vnp_RequestId: requestId,
    };

    // Sort and sign
    vnpParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(vnpParams as querystring.ParsedUrlQueryInput);
    const hmac = crypto.createHmac('sha512', this.config.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams['vnp_SecureHash'] = signed;

    // TODO: Make HTTP request to VNPay API
    this.logger.log(`Refunding VNPay transaction: ${orderId}`);

    return vnpParams;
  }

  /**
   * Sort object keys alphabetically
   */
  private sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Format date to VNPay format: yyyyMMddHHmmss
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Get response message from response code
   */
  private getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác',
    };
    return messages[code] || 'Lỗi không xác định';
  }
}

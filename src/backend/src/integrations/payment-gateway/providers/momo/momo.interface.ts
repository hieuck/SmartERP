// Interface definitions cho MoMo payment provider

export interface CreatePaymentResult {
  payUrl?: string;
  qrCodeUrl?: string;
  deeplink?: string;
  error?: string;
}

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

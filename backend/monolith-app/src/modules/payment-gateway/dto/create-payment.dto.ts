export class CreatePaymentDto {
  orderId: string;
  amount: number;
  currency?: string;
  gateway: 'vnpay' | 'momo' | 'stripe' | 'paypal';
  paymentMethod?: string;
  returnUrl?: string;
  cancelUrl?: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  orderInfo?: string;
  ipAddress?: string;
}

export class VerifyPaymentDto {
  transactionId: string;
  gateway: string;
  params: Record<string, unknown>;
}

export class RefundPaymentDto {
  transactionId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

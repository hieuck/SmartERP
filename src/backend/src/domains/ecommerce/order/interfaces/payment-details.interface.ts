/**
 * Payment details interface for gateway-specific data
 * Flexible structure for different payment gateways
 */
export interface PaymentDetails {
  [key: string]: string | number | boolean | object;
}

/**
 * Gateway-specific examples:
 * 
 * Stripe:
 * {
 *   cardNumber: '4242424242424242',
 *   expMonth: 12,
 *   expYear: 2025,
 *   cvc: '123'
 * }
 * 
 * PayPal:
 * {
 *   payerId: 'PAYER123',
 *   paymentId: 'PAY-123456'
 * }
 * 
 * VNPay:
 * {
 *   vnp_TxnRef: 'ORDER123',
 *   vnp_ResponseCode: '00'
 * }
 * 
 * Momo:
 * {
 *   orderId: 'ORDER123',
 *   requestId: 'REQ123',
 *   signature: 'abc123'
 * }
 */

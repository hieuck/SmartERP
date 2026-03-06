import { Controller, Post, Get, Body, Param, Query, Req, Headers } from '@nestjs/common';
import { Request } from 'express';
import { PaymentGatewayService } from './payment-gateway.service';
import { CreatePaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';

@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  /**
   * Create payment
   * POST /payment-gateway
   */
  @Post()
  async createPayment(@Req() req: Request & { tenantId?: string }, @Body() dto: CreatePaymentDto) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.paymentGatewayService.createPayment(tenantId, dto);
  }

  /**
   * Verify payment callback
   * POST /payment-gateway/verify
   */
  @Post('verify')
  async verifyPayment(@Req() req: Request & { tenantId?: string }, @Body() dto: VerifyPaymentDto) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.paymentGatewayService.verifyPayment(tenantId, dto);
  }

  /**
   * VNPay return URL handler
   * GET /payment-gateway/vnpay/return
   */
  @Get('vnpay/return')
  async vnpayReturn(@Query() query: Record<string, unknown>) {
    // This endpoint is called by VNPay after payment
    // You can redirect user to success/failure page based on query params
    return {
      message: 'Payment callback received',
      params: query,
    };
  }

  /**
   * VNPay IPN handler
   * POST /payment-gateway/vnpay/ipn
   */
  @Post('vnpay/ipn')
  async vnpayIPN(
    @Req() req: Request & { tenantId?: string },
    @Body() body: Record<string, unknown>,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    await this.paymentGatewayService.handleWebhook(tenantId, 'vnpay', body);
    return { RspCode: '00', Message: 'success' };
  }

  /**
   * Momo return URL handler
   * GET /payment-gateway/momo/return
   */
  @Get('momo/return')
  async momoReturn(@Query() query: Record<string, unknown>) {
    return {
      message: 'Payment callback received',
      params: query,
    };
  }

  /**
   * Momo IPN handler
   * POST /payment-gateway/momo/ipn
   */
  @Post('momo/ipn')
  async momoIPN(
    @Req() req: Request & { tenantId?: string },
    @Body() body: Record<string, unknown>,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    await this.paymentGatewayService.handleWebhook(tenantId, 'momo', body);
    return { resultCode: 0, message: 'success' };
  }

  /**
   * Stripe webhook handler
   * POST /payment-gateway/stripe/webhook
   */
  @Post('stripe/webhook')
  async stripeWebhook(
    @Req() req: Request & { tenantId?: string },
    @Body() body: Record<string, unknown>,
    @Headers('stripe-signature') signature: string,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    await this.paymentGatewayService.handleWebhook(tenantId, 'stripe', body, signature);
    return { received: true };
  }

  /**
   * Refund payment
   * POST /payment-gateway/refund
   */
  @Post('refund')
  async refundPayment(@Req() req: Request & { tenantId?: string }, @Body() dto: RefundPaymentDto) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.paymentGatewayService.refundPayment(tenantId, dto);
  }

  /**
   * Get transaction
   * GET /payment-gateway/transactions/:id
   */
  @Get('transactions/:id')
  async getTransaction(@Req() req: Request & { tenantId?: string }, @Param('id') id: string) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.paymentGatewayService.getTransaction(tenantId, id);
  }

  /**
   * List transactions
   * GET /payment-gateway/transactions
   */
  @Get('transactions')
  async listTransactions(
    @Req() req: Request & { tenantId?: string },
    @Query('orderId') orderId?: string,
    @Query('gateway') gateway?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.paymentGatewayService.listTransactions(tenantId, {
      orderId,
      gateway,
      status,
      limit,
      offset,
    });
  }
}

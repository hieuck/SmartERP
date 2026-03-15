import { Controller, Post, Get, Body, Param, Query, Req, Headers } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
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
  async createPayment(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentGatewayService.createPayment(user, dto);
  }

  /**
   * Verify payment callback
   * POST /payment-gateway/verify
   */
  @Post('verify')
  async verifyPayment(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentGatewayService.verifyPayment(user, dto);
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
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() body: Record<string, unknown>,
  ) {
    await this.paymentGatewayService.handleWebhook(user, 'vnpay', body);
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
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() body: Record<string, unknown>,
  ) {
    await this.paymentGatewayService.handleWebhook(user, 'momo', body);
    return { resultCode: 0, message: 'success' };
  }

  /**
   * Stripe webhook handler
   * POST /payment-gateway/stripe/webhook
   */
  @Post('stripe/webhook')
  async stripeWebhook(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() body: Record<string, unknown>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.paymentGatewayService.handleWebhook(user, 'stripe', body, signature);
    return { received: true };
  }

  /**
   * Refund payment
   * POST /payment-gateway/refund
   */
  @Post('refund')
  async refundPayment(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentGatewayService.refundPayment(user, dto);
  }

  /**
   * Get transaction
   * GET /payment-gateway/transactions/:id
   */
  @Get('transactions/:id')
  async getTransaction(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Param('id') id: string,
  ) {
    return this.paymentGatewayService.getTransaction(user, id);
  }

  /**
   * List transactions
   * GET /payment-gateway/transactions
   */
  @Get('transactions')
  async listTransactions(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Query('orderId') orderId?: string,
    @Query('gateway') gateway?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentGatewayService.listTransactions(user, {
      orderId,
      gateway,
      status,
      limit,
      offset,
    });
  }
}

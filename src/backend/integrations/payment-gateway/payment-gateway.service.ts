import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentWebhook } from './entities/payment-webhook.entity';
import { VNPayService } from './providers/vnpay/vnpay.service';
import { MomoService } from './providers/momo/momo.service';
import { StripeService } from './providers/stripe/stripe.service';
import { PayPalService } from './providers/paypal/paypal.service';
import { CreatePaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/create-payment.dto';
import { User } from '@/common/security/permission.service';

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private paymentTransactionRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentWebhook)
    private paymentWebhookRepo: Repository<PaymentWebhook>,
    private vnpayService: VNPayService,
    private momoService: MomoService,
    private stripeService: StripeService,
    private paypalService: PayPalService,
  ) {}

  /**
   * Create payment transaction
   */
  async createPayment(user: User, dto: CreatePaymentDto): Promise<PaymentTransaction> {
    // Create transaction record
    const transaction = this.paymentTransactionRepo.create({
      tenantId: user.tenantId,
      orderId: dto.orderId,
      gateway: dto.gateway,
      amount: dto.amount,
      currency: dto.currency || 'VND',
      status: 'pending',
      paymentMethod: dto.paymentMethod,
      customerInfo: dto.customerInfo,
    });

    await this.paymentTransactionRepo.save(transaction);

    // Generate payment URL based on gateway
    let paymentUrl: string;
    let additionalData: Record<string, unknown> = {};

    try {
      switch (dto.gateway) {
        case 'vnpay':
          paymentUrl = this.vnpayService.createPaymentUrl({
            orderId: transaction.id,
            amount: dto.amount,
            orderInfo: dto.orderInfo || `Payment for order ${dto.orderId}`,
            ipAddr: dto.ipAddress || '127.0.0.1',
          });
          break;

        case 'momo': {
          const momoResult = await this.momoService.createPayment({
            orderId: transaction.id,
            amount: dto.amount,
            orderInfo: dto.orderInfo || `Payment for order ${dto.orderId}`,
          });
          paymentUrl = momoResult.payUrl;
          additionalData = {
            qrCodeUrl: momoResult.qrCodeUrl,
            deeplink: momoResult.deeplink,
          };
          break;
        }

        case 'stripe': {
          const stripeResult = await this.stripeService.createPaymentIntent({
            orderId: transaction.id,
            amount: dto.amount,
            currency: dto.currency || 'USD',
            description: dto.orderInfo || `Payment for order ${dto.orderId}`,
            customerEmail: dto.customerInfo?.email,
          });
          paymentUrl = stripeResult.clientSecret;
          additionalData = {
            paymentIntentId: stripeResult.paymentIntentId,
          };
          break;
        }

        case 'paypal': {
          const paypalResult = await this.paypalService.createOrder({
            orderId: transaction.id,
            amount: dto.amount,
            currency: dto.currency || 'USD',
            description: dto.orderInfo || `Payment for order ${dto.orderId}`,
            returnUrl: dto.returnUrl,
            cancelUrl: dto.cancelUrl,
          });
          paymentUrl = paypalResult.approvalUrl;
          additionalData = {
            paypalOrderId: paypalResult.orderId,
          };
          break;
        }

        default:
          throw new BadRequestException(`Unsupported gateway: ${dto.gateway}`);
      }

      // Update transaction with payment URL
      transaction.paymentUrl = paymentUrl;
      transaction.status = 'processing';
      transaction.gatewayResponse = additionalData;
      await this.paymentTransactionRepo.save(transaction);

      this.logger.log(`Payment created: ${transaction.id} via ${dto.gateway}`);

      return transaction;
    } catch (error) {
      // Update transaction with error
      transaction.status = 'failed';
      transaction.errorMessage = error.message;
      await this.paymentTransactionRepo.save(transaction);

      this.logger.error(`Payment creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify payment callback
   */
  async verifyPayment(
    user: User,
    dto: VerifyPaymentDto,
  ): Promise<{
    success: boolean;
    message: string;
    transaction?: PaymentTransaction;
  }> {
    // Find transaction
    const transaction = await this.paymentTransactionRepo.findOne({
      where: { id: dto.transactionId, tenantId: user.tenantId },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    let verificationResult: { success: boolean; message: string; transactionId?: string };

    // Verify based on gateway
    switch (dto.gateway) {
      case 'vnpay':
        verificationResult = this.vnpayService.verifyPaymentCallback(dto.params);
        break;

      case 'momo':
        verificationResult = this.momoService.verifyIPN(dto.params);
        break;

      case 'stripe':
        // Stripe verification is done via webhook
        verificationResult = { success: true, message: 'Verified via webhook' };
        break;

      default:
        throw new BadRequestException(`Unsupported gateway: ${dto.gateway}`);
    }

    // Update transaction status
    if (verificationResult.success) {
      transaction.status = 'success';
      transaction.transactionId = verificationResult.transactionId;
    } else {
      transaction.status = 'failed';
      transaction.errorMessage = verificationResult.message;
    }

    transaction.gatewayResponse = dto.params;
    await this.paymentTransactionRepo.save(transaction);

    this.logger.log(`Payment verified: ${transaction.id} - ${transaction.status}`);

    return {
      success: verificationResult.success,
      message: verificationResult.message,
      transaction,
    };
  }

  /**
   * Handle webhook
   */
  async handleWebhook(
    tenantId: string,
    gateway: string,
    payload: Record<string, unknown>,
    signature?: string,
  ): Promise<void> {
    // Save webhook
    const eventType = String(payload.type || payload.event_type || 'unknown');
    const webhook = this.paymentWebhookRepo.create({
      tenantId,
      gateway,
      eventType,
      payload,
      signature,
      processed: false,
    });

    await this.paymentWebhookRepo.save(webhook);

    try {
      // Process webhook based on gateway
      let result: { success: boolean; message: string; transactionId?: string };

      switch (gateway) {
        case 'vnpay':
          result = this.vnpayService.verifyPaymentCallback(payload);
          break;

        case 'momo':
          result = this.momoService.verifyIPN(payload);
          break;

        case 'stripe':
          if (
            signature &&
            !this.stripeService.verifyWebhookSignature(JSON.stringify(payload), signature)
          ) {
            throw new Error('Invalid webhook signature');
          }
          result = await this.stripeService.handleWebhookEvent(payload);
          break;

        default:
          throw new Error(`Unsupported gateway: ${gateway}`);
      }

      // Update transaction if found
      if (result.transactionId) {
        const transaction = await this.paymentTransactionRepo.findOne({
          where: { transactionId: result.transactionId },
        });

        if (transaction) {
          transaction.status = result.success ? 'success' : 'failed';
          transaction.errorMessage = result.message;
          await this.paymentTransactionRepo.save(transaction);
        }
      }

      // Mark webhook as processed
      webhook.processed = true;
      webhook.processedAt = new Date();
      await this.paymentWebhookRepo.save(webhook);

      this.logger.log(`Webhook processed: ${webhook.id}`);
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(user: User, dto: RefundPaymentDto): Promise<PaymentTransaction> {
    // Find transaction
    const transaction = await this.paymentTransactionRepo.findOne({
      where: { id: dto.transactionId, tenantId: user.tenantId },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status !== 'success') {
      throw new BadRequestException('Can only refund successful transactions');
    }

    try {
      // Refund based on gateway
      switch (transaction.gateway) {
        case 'vnpay':
          await this.vnpayService.refundTransaction(
            transaction.orderId,
            dto.amount || transaction.amount,
            transaction.createdAt.toISOString(),
            'system',
          );
          break;

        case 'momo':
          await this.momoService.refundTransaction(
            transaction.orderId,
            transaction.transactionId,
            dto.amount || transaction.amount,
            dto.reason || 'Customer refund request',
          );
          break;

        case 'stripe':
          await this.stripeService.refundPayment(transaction.transactionId, dto.amount, dto.reason);
          break;

        default:
          throw new BadRequestException(`Unsupported gateway: ${transaction.gateway}`);
      }

      // Update transaction status
      transaction.status = 'refunded';
      await this.paymentTransactionRepo.save(transaction);

      this.logger.log(`Payment refunded: ${transaction.id}`);

      return transaction;
    } catch (error) {
      this.logger.error(`Refund failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(user: User, transactionId: string): Promise<PaymentTransaction> {
    const transaction = await this.paymentTransactionRepo.findOne({
      where: { id: transactionId, tenantId: user.tenantId },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    return transaction;
  }

  /**
   * List transactions
   */
  async listTransactions(
    tenantId: string,
    filters?: {
      orderId?: string;
      gateway?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ transactions: PaymentTransaction[]; total: number }> {
    const query = this.paymentTransactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId });

    if (filters?.orderId) {
      query.andWhere('transaction.orderId = :orderId', { orderId: filters.orderId });
    }

    if (filters?.gateway) {
      query.andWhere('transaction.gateway = :gateway', { gateway: filters.gateway });
    }

    if (filters?.status) {
      query.andWhere('transaction.status = :status', { status: filters.status });
    }

    const total = await query.getCount();

    query
      .orderBy('transaction.createdAt', 'DESC')
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    const transactions = await query.getMany();

    return { transactions, total };
  }
}

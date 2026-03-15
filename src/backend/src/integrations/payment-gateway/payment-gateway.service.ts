// @ts-nocheck
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto, RefundPaymentDto, VerifyPaymentDto } from './dto/create-payment.dto';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentWebhook } from './entities/payment-webhook.entity';
import { MomoService } from './providers/momo/momo.service';
import { PayPalService } from './providers/paypal/paypal.service';
import { StripeService } from './providers/stripe/stripe.service';
import { VNPayService } from './providers/vnpay/vnpay.service';

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private secureTransactionRepo: SecureRepository<PaymentTransaction>;
  private secureWebhookRepo: SecureRepository<PaymentWebhook>;

  constructor(
    @InjectRepository(PaymentTransaction)
    private paymentTransactionRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentWebhook)
    private paymentWebhookRepo: Repository<PaymentWebhook>,
    private vnpayService: VNPayService,
    private momoService: MomoService,
    private stripeService: StripeService,
    private paypalService: PayPalService,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize SecureRepository for multi-tenant security
    this.secureTransactionRepo = new SecureRepository(
      paymentTransactionRepo,
      permissionService,
      'PaymentTransaction',
    );
    this.secureWebhookRepo = new SecureRepository(
      paymentWebhookRepo,
      permissionService,
      'PaymentWebhook',
    );
  }

  /**
   * Create payment transaction
   */
  async createPayment(user: User, dto: CreatePaymentDto): Promise<PaymentTransaction> {
    // Create transaction record with SecureRepository (auto tenant isolation)
    const transaction = {
      orderId: dto.orderId,
      gateway: dto.gateway,
      amount: dto.amount,
      currency: dto.currency || 'VND',
      status: 'pending',
      paymentMethod: dto.paymentMethod,
      customerInfo: dto.customerInfo,
    };

    const savedTransaction = await this.secureTransactionRepo.save(user, transaction);

    // Generate payment URL based on gateway
    let paymentUrl: string;
    let additionalData: Record<string, unknown> = {};

    try {
      switch (dto.gateway) {
        case 'vnpay':
          paymentUrl = this.vnpayService.createPaymentUrl({
            orderId: savedTransaction.id,
            amount: dto.amount,
            orderInfo: dto.orderInfo || `Payment for order ${dto.orderId}`,
            ipAddr: dto.ipAddress || '127.0.0.1',
          });
          break;

        case 'momo': {
          const momoResult = await this.momoService.createPayment({
            orderId: savedTransaction.id,
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
            orderId: savedTransaction.id,
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
            orderId: savedTransaction.id,
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

      // Update transaction with payment URL using SecureRepository
      savedTransaction.paymentUrl = paymentUrl;
      savedTransaction.status = 'processing';
      savedTransaction.gatewayResponse = additionalData;
      const updatedTransaction = await this.secureTransactionRepo.save(user, savedTransaction);

      this.logger.log(`Payment created: ${updatedTransaction.id} via ${dto.gateway}`);

      return updatedTransaction;
    } catch (error) {
      // Update transaction with error using SecureRepository
      savedTransaction.status = 'failed';
      savedTransaction.errorMessage = error.message;
      await this.secureTransactionRepo.save(user, savedTransaction);

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
    // Find transaction with SecureRepository (auto tenant isolation + permission check)
    const transaction = await this.secureTransactionRepo.findOne(user, {
      where: { id: dto.transactionId },
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
    await this.secureTransactionRepo.save(user, transaction);

    this.logger.log(`Payment verified: ${transaction.id} - ${transaction.status}`);

    return {
      success: verificationResult.success,
      message: verificationResult.message,
      transaction,
    };
  }

  /**
   * Handle webhook
   * Note: Webhooks come from external systems, so we need a system user for tenant context
   */
  async handleWebhook(
    user: User,
    gateway: string,
    payload: Record<string, unknown>,
    signature?: string,
  ): Promise<void> {
    // Save webhook with SecureRepository
    const eventType = String(payload.type || payload.event_type || 'unknown');
    const webhook = {
      gateway,
      eventType,
      payload,
      signature,
      processed: false,
    };

    const savedWebhook = await this.secureWebhookRepo.save(user, webhook);

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
        const transaction = await this.secureTransactionRepo.findOne(user, {
          where: { transactionId: result.transactionId },
        });

        if (transaction) {
          transaction.status = result.success ? 'success' : 'failed';
          transaction.errorMessage = result.message;
          await this.secureTransactionRepo.save(user, transaction);
        }
      }

      // Mark webhook as processed
      savedWebhook.processed = true;
      savedWebhook.processedAt = new Date();
      await this.secureWebhookRepo.save(user, savedWebhook);

      this.logger.log(`Webhook processed: ${savedWebhook.id}`);
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(user: User, dto: RefundPaymentDto): Promise<PaymentTransaction> {
    // Find transaction with SecureRepository (auto tenant isolation + permission check)
    const transaction = await this.secureTransactionRepo.findOne(user, {
      where: { id: dto.transactionId },
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
      await this.secureTransactionRepo.save(user, transaction);

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
    const transaction = await this.secureTransactionRepo.findOne(user, {
      where: { id: transactionId },
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
    user: User,
    filters?: {
      orderId?: string;
      gateway?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ transactions: PaymentTransaction[]; total: number }> {
    // Build where conditions
    const where: unknown = { tenantId: user.tenantId };

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters?.gateway) {
      where.gateway = filters.gateway;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // Use SecureRepository find with pagination
    const transactions = await this.secureTransactionRepo.find(user, {
      where,
      order: { createdAt: 'DESC' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    // Get total count using raw repository (SecureRepository doesn't have count method)
    const total = await this.paymentTransactionRepo.count({ where });

    return { transactions, total };
  }
}

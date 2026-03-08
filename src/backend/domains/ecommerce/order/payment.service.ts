import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from '../../../common/security/permission.service';
import { SecureRepository } from '../../../common/security/secure-repository';
import { User } from '../../../core/user/entities/user.entity';
import { ProcessPaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { RefundDto } from './dto/refund.dto';
import { Order, PaymentStatus } from './entities/order.entity';

/**
 * PaymentService handles payment gateway integration
 * Supports multiple gateways: stripe, paypal, vnpay, momo, cod
 */
@Injectable()
export class PaymentService {
  private readonly secureOrderRepo: SecureRepository<Order>;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureOrderRepo = new SecureRepository(orderRepository, permissionService, 'Order');
  }

  async processPayment(
    dto: ProcessPaymentDto,
    user: User,
  ): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    const order = await this.secureOrderRepo.findOne(user, {
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new BadRequestException(`Order with ID ${dto.orderId} not found`);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    if (dto.amount !== Number(order.total)) {
      throw new BadRequestException(
        `Payment amount ${dto.amount} does not match order total ${order.total}`,
      );
    }

    let result: { success: boolean; transactionId: string; message: string };

    switch (dto.paymentMethod.toLowerCase()) {
      case 'cod':
        result = await this.processCOD(order);
        break;
      case 'stripe':
        result = await this.processStripe(order, dto.paymentToken, dto.paymentDetails);
        break;
      case 'paypal':
        result = await this.processPayPal(order, dto.paymentToken, dto.paymentDetails);
        break;
      case 'vnpay':
        result = await this.processVNPay(order, dto.paymentDetails);
        break;
      case 'momo':
        result = await this.processMomo(order, dto.paymentDetails);
        break;
      default:
        throw new BadRequestException(`Unsupported payment method: ${dto.paymentMethod}`);
    }

    if (result.success) {
      order.paymentStatus = PaymentStatus.PAID;
      order.paymentMethod = dto.paymentMethod;
      order.paymentTransactionId = result.transactionId;
      order.paidAt = new Date();
      await this.secureOrderRepo.save(user, order);
    } else {
      order.paymentStatus = PaymentStatus.FAILED;
      await this.secureOrderRepo.save(user, order);
    }

    return result;
  }

  async verifyPayment(
    dto: VerifyPaymentDto,
    user: User,
  ): Promise<{
    verified: boolean;
    status: PaymentStatus;
    message: string;
  }> {
    const order = await this.secureOrderRepo.findOne(user, {
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new BadRequestException(`Order with ID ${dto.orderId} not found`);
    }

    let verified = false;
    let status = order.paymentStatus;

    switch (dto.paymentMethod.toLowerCase()) {
      case 'cod':
        verified = true;
        break;
      case 'stripe':
        verified = await this.verifyStripe(dto.transactionId);
        break;
      case 'paypal':
        verified = await this.verifyPayPal(dto.transactionId);
        break;
      case 'vnpay':
        verified = await this.verifyVNPay(dto.transactionId);
        break;
      case 'momo':
        verified = await this.verifyMomo(dto.transactionId);
        break;
      default:
        throw new BadRequestException(`Unsupported payment method: ${dto.paymentMethod}`);
    }

    if (verified && order.paymentStatus !== PaymentStatus.PAID) {
      order.paymentStatus = PaymentStatus.PAID;
      order.paymentTransactionId = dto.transactionId;
      order.paidAt = new Date();
      await this.secureOrderRepo.save(user, order);
      status = PaymentStatus.PAID;
    }

    return {
      verified,
      status,
      message: verified ? 'Payment verified successfully' : 'Payment verification failed',
    };
  }

  async refundPayment(
    dto: RefundDto,
    user: User,
  ): Promise<{
    success: boolean;
    refundId: string;
    message: string;
  }> {
    const order = await this.secureOrderRepo.findOne(user, {
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new BadRequestException(`Order with ID ${dto.orderId} not found`);
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order must be paid before refunding');
    }

    const refundAmount = dto.amount || Number(order.total);

    let result: { success: boolean; refundId: string; message: string };

    switch (order.paymentMethod?.toLowerCase()) {
      case 'cod':
        result = await this.refundCOD(order, refundAmount, dto.reason);
        break;
      case 'stripe':
        result = await this.refundStripe(order, refundAmount, dto.reason);
        break;
      case 'paypal':
        result = await this.refundPayPal(order, refundAmount, dto.reason);
        break;
      case 'vnpay':
        result = await this.refundVNPay(order, refundAmount, dto.reason);
        break;
      case 'momo':
        result = await this.refundMomo(order, refundAmount, dto.reason);
        break;
      default:
        throw new BadRequestException(`Unsupported payment method: ${order.paymentMethod}`);
    }

    if (result.success) {
      order.paymentStatus = PaymentStatus.REFUNDED;
      await this.secureOrderRepo.save(user, order);
    }

    return result;
  }

  // Gateway stubs - TODO: Implement actual integrations

  private async processCOD(order: Order): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    return {
      success: true,
      transactionId: `COD-${order.orderNumber}`,
      message: 'Cash on delivery order created',
    };
  }

  private async processStripe(
    order: Order,
    token?: string,
    details?: any,
  ): Promise<{ success: boolean; transactionId: string; message: string }> {
    // TODO: Implement Stripe integration
    return {
      success: true,
      transactionId: `STRIPE-${Date.now()}`,
      message: 'Stripe payment processed (stub)',
    };
  }

  private async processPayPal(
    order: Order,
    token?: string,
    details?: any,
  ): Promise<{ success: boolean; transactionId: string; message: string }> {
    // TODO: Implement PayPal integration
    return {
      success: true,
      transactionId: `PAYPAL-${Date.now()}`,
      message: 'PayPal payment processed (stub)',
    };
  }

  private async processVNPay(
    order: Order,
    details?: any,
  ): Promise<{ success: boolean; transactionId: string; message: string }> {
    // TODO: Implement VNPay integration
    return {
      success: true,
      transactionId: `VNPAY-${Date.now()}`,
      message: 'VNPay payment processed (stub)',
    };
  }

  private async processMomo(
    order: Order,
    details?: any,
  ): Promise<{ success: boolean; transactionId: string; message: string }> {
    // TODO: Implement Momo integration
    return {
      success: true,
      transactionId: `MOMO-${Date.now()}`,
      message: 'Momo payment processed (stub)',
    };
  }

  private async verifyStripe(transactionId: string): Promise<boolean> {
    // TODO: Implement Stripe verification
    return true;
  }

  private async verifyPayPal(transactionId: string): Promise<boolean> {
    // TODO: Implement PayPal verification
    return true;
  }

  private async verifyVNPay(transactionId: string): Promise<boolean> {
    // TODO: Implement VNPay verification
    return true;
  }

  private async verifyMomo(transactionId: string): Promise<boolean> {
    // TODO: Implement Momo verification
    return true;
  }

  private async refundCOD(
    order: Order,
    amount: number,
    reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    return {
      success: true,
      refundId: `COD-REFUND-${order.orderNumber}`,
      message: 'COD refund initiated (manual process)',
    };
  }

  private async refundStripe(
    order: Order,
    amount: number,
    reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    // TODO: Implement Stripe refund
    return {
      success: true,
      refundId: `STRIPE-REFUND-${Date.now()}`,
      message: 'Stripe refund processed (stub)',
    };
  }

  private async refundPayPal(
    order: Order,
    amount: number,
    reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    // TODO: Implement PayPal refund
    return {
      success: true,
      refundId: `PAYPAL-REFUND-${Date.now()}`,
      message: 'PayPal refund processed (stub)',
    };
  }

  private async refundVNPay(
    order: Order,
    amount: number,
    reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    // TODO: Implement VNPay refund
    return {
      success: true,
      refundId: `VNPAY-REFUND-${Date.now()}`,
      message: 'VNPay refund processed (stub)',
    };
  }

  private async refundMomo(
    order: Order,
    amount: number,
    reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    // TODO: Implement Momo refund
    return {
      success: true,
      refundId: `MOMO-REFUND-${Date.now()}`,
      message: 'Momo refund processed (stub)',
    };
  }
}

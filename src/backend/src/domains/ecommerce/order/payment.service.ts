import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, PermissionService } from '@common/security/permission.service';
import { SecureRepository } from '@common/security/secure-repository';
import { ProcessPaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { RefundDto } from './dto/refund.dto';
import { Order } from './entities/order.entity';
import { PaymentStatus } from '../enums/ecommerce.enum';
import { PaymentDetails } from './interfaces/payment-details.interface';

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
    const _order = await this.secureOrderRepo.findOne(user, {
      where: { id: dto.orderId },
    });

    if (!_order) {
      throw new BadRequestException(`Order with ID ${dto.orderId} not found`);
    }

    if (_order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    if (dto.amount !== Number(_order.total)) {
      throw new BadRequestException(
        `Payment amount ${dto.amount} does not match order total ${_order.total}`,
      );
    }

    let result: { success: boolean; transactionId: string; message: string };
    const paymentDetails =
      dto.paymentDetails && typeof dto.paymentDetails === 'object'
        ? (dto.paymentDetails as PaymentDetails)
        : undefined;

    switch (dto.paymentMethod.toLowerCase()) {
      case 'cod':
        result = await this.processCOD(_order);
        break;
      case 'stripe':
        result = await this.processStripe(_order, dto.paymentToken, paymentDetails);
        break;
      case 'paypal':
        result = await this.processPayPal(_order, dto.paymentToken, paymentDetails);
        break;
      case 'vnpay':
        result = await this.processVNPay(_order, paymentDetails);
        break;
      case 'momo':
        result = await this.processMomo(_order, paymentDetails);
        break;
      default:
        throw new BadRequestException(`Unsupported payment method: ${dto.paymentMethod}`);
    }

    if (result.success) {
      _order.paymentStatus = PaymentStatus.PAID;
      _order.paymentMethod = dto.paymentMethod;
      _order.paymentTransactionId = result.transactionId;
      _order.paidAt = new Date();
      await this.secureOrderRepo.save(user, _order);
    } else {
      _order.paymentStatus = PaymentStatus.FAILED;
      await this.secureOrderRepo.save(user, _order);
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
    const _order = await this.secureOrderRepo.findOne(user, {
      where: { id: dto.orderId },
    });

    if (!_order) {
      throw new BadRequestException(`Order with ID ${dto.orderId} not found`);
    }

    let verified = false;
    let status = _order.paymentStatus;

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

    if (verified && _order.paymentStatus !== PaymentStatus.PAID) {
      _order.paymentStatus = PaymentStatus.PAID;
      _order.paymentTransactionId = dto.transactionId;
      _order.paidAt = new Date();
      await this.secureOrderRepo.save(user, _order);
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
    const _order = await this.secureOrderRepo.findOne(user, {
      where: { id: dto.orderId },
    });

    if (!_order) {
      throw new BadRequestException(`Order with ID ${dto.orderId} not found`);
    }

    if (_order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order must be paid before refunding');
    }

    const refundAmount = dto.amount || Number(_order.total);

    let result: { success: boolean; refundId: string; message: string };

    switch (_order.paymentMethod?.toLowerCase()) {
      case 'cod':
        result = await this.refundCOD(_order, refundAmount, dto.reason);
        break;
      case 'stripe':
        result = await this.refundStripe(_order, refundAmount, dto.reason);
        break;
      case 'paypal':
        result = await this.refundPayPal(_order, refundAmount, dto.reason);
        break;
      case 'vnpay':
        result = await this.refundVNPay(_order, refundAmount, dto.reason);
        break;
      case 'momo':
        result = await this.refundMomo(_order, refundAmount, dto.reason);
        break;
      default:
        throw new BadRequestException(`Unsupported payment method: ${_order.paymentMethod}`);
    }

    if (result.success) {
      _order.paymentStatus = PaymentStatus.REFUNDED;
      await this.secureOrderRepo.save(user, _order);
    }

    return result;
  }

  // Gateway stubs - TODO: Implement actual integrations

  private async processCOD(_order: Order): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    return {
      success: true,
      transactionId: `COD-${_order.orderNumber}`,
      message: 'Cash on delivery order created',
    };
  }

  private async processStripe(
    _order: Order,
    _token?: string,
    _details?: PaymentDetails,
  ): Promise<{ success: boolean; transactionId: string; message: string }> {
    // TODO: Implement Stripe integration
    return {
      success: true,
      transactionId: `STRIPE-${Date.now()}`,
      message: 'Stripe payment processed (stub)',
    };
  }

  private async processPayPal(
    _order: Order,
    _token?: string,
    _details?: PaymentDetails,
  ): Promise<{ success: boolean; transactionId: string; message: string }> {
    // TODO: Implement PayPal integration
    return {
      success: true,
      transactionId: `PAYPAL-${Date.now()}`,
      message: 'PayPal payment processed (stub)',
    };
  }

  private async processVNPay(
    _order: Order,
    _details?: PaymentDetails,
  ): Promise<{ success: boolean; transactionId: string; message: string }> {
    // TODO: Implement VNPay integration
    return {
      success: true,
      transactionId: `VNPAY-${Date.now()}`,
      message: 'VNPay payment processed (stub)',
    };
  }

  private async processMomo(
    _order: Order,
    _details?: PaymentDetails,
  ): Promise<{ success: boolean; transactionId: string; message: string }> {
    // TODO: Implement Momo integration
    return {
      success: true,
      transactionId: `MOMO-${Date.now()}`,
      message: 'Momo payment processed (stub)',
    };
  }

  private async verifyStripe(_transactionId: string): Promise<boolean> {
    // TODO: Implement Stripe verification
    return true;
  }

  private async verifyPayPal(_transactionId: string): Promise<boolean> {
    // TODO: Implement PayPal verification
    return true;
  }

  private async verifyVNPay(_transactionId: string): Promise<boolean> {
    // TODO: Implement VNPay verification
    return true;
  }

  private async verifyMomo(_transactionId: string): Promise<boolean> {
    // TODO: Implement Momo verification
    return true;
  }

  private async refundCOD(
    _order: Order,
    _amount: number,
    _reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    return {
      success: true,
      refundId: `COD-REFUND-${_order.orderNumber}`,
      message: 'COD refund initiated (manual process)',
    };
  }

  private async refundStripe(
    _order: Order,
    _amount: number,
    _reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    // TODO: Implement Stripe refund
    return {
      success: true,
      refundId: `STRIPE-REFUND-${Date.now()}`,
      message: 'Stripe refund processed (stub)',
    };
  }

  private async refundPayPal(
    _order: Order,
    _amount: number,
    _reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    // TODO: Implement PayPal refund
    return {
      success: true,
      refundId: `PAYPAL-REFUND-${Date.now()}`,
      message: 'PayPal refund processed (stub)',
    };
  }

  private async refundVNPay(
    _order: Order,
    _amount: number,
    _reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    // TODO: Implement VNPay refund
    return {
      success: true,
      refundId: `VNPAY-REFUND-${Date.now()}`,
      message: 'VNPay refund processed (stub)',
    };
  }

  private async refundMomo(
    _order: Order,
    _amount: number,
    _reason: string,
  ): Promise<{ success: boolean; refundId: string; message: string }> {
    // TODO: Implement Momo refund
    return {
      success: true,
      refundId: `MOMO-REFUND-${Date.now()}`,
      message: 'Momo refund processed (stub)',
    };
  }
}

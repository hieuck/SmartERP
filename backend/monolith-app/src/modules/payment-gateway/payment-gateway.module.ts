import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentGatewayController } from './payment-gateway.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentWebhook } from './entities/payment-webhook.entity';
import { VNPayService } from './providers/vnpay/vnpay.service';
import { MomoService } from './providers/momo/momo.service';
import { StripeService } from './providers/stripe/stripe.service';
import { PayPalService } from './providers/paypal/paypal.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransaction, PaymentWebhook])],
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService, VNPayService, MomoService, StripeService, PayPalService],
  exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}

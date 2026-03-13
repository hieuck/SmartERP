import { SecurityModule } from '@/common/security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingCart } from '@/domains/ecommerce/shopping-cart/entities/shopping-cart.entity';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, ShoppingCart]), SecurityModule],
  controllers: [CheckoutController, OrderController],
  providers: [CheckoutService, OrderService, PaymentService],
  exports: [CheckoutService, OrderService, PaymentService],
})
export class OrderModule {}

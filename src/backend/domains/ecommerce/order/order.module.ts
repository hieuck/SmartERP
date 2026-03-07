import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ShoppingCart } from '../shopping-cart/entities/shopping-cart.entity';
import { CheckoutService } from './checkout.service';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { CheckoutController } from './checkout.controller';
import { OrderController } from './order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, ShoppingCart])],
  controllers: [CheckoutController, OrderController],
  providers: [CheckoutService, OrderService, PaymentService],
  exports: [CheckoutService, OrderService, PaymentService],
})
export class OrderModule {}

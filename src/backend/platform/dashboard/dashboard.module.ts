import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardMobileController } from './dashboard-mobile.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../order/entities/order.entity';
import { Product } from '../product/entities/product.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Payment } from '../payment/entities/payment.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, Customer, Inventory, Payment]),
    CacheModule,
    SecurityModule,
  ],
  controllers: [DashboardController, DashboardMobileController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

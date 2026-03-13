import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardMobileController } from './dashboard-mobile.controller';
import { DashboardService } from './dashboard.service';
// import { Order } from './entities/order.entity'; // TODO: Create Order entity or import from correct domain
import { Product } from '@/domains/inventory/product/entities/product.entity';
// import { Customer } from './entities/customer.entity'; // TODO: Create Customer entity or import from correct domain
import { Inventory } from '@/domains/inventory/stock/entities/inventory.entity';
import { Payment } from '@/domains/accounting/payment/entities/payment.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Inventory, Payment]),
    CacheModule,
    SecurityModule,
  ],
  controllers: [DashboardController, DashboardMobileController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Product } from '../../domains/inventory/product/entities/product.entity';
import { Customer } from '../../domains/sales/customer/entities/customer.entity';
import { Order } from '../../domains/sales/order/entities/order.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Customer, Order]), CacheModule, SecurityModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

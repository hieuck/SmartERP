import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Product } from '../product/entities/product.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Order } from '../order/entities/order.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Customer, Order]), CacheModule, SecurityModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

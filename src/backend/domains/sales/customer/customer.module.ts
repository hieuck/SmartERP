import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), CacheModule, SecurityModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}

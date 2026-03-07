import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), CacheModule, SecurityModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entities/shipment.entity';
import { GHNService } from './providers/ghn/ghn.service';
import { GHTKService } from './providers/ghtk/ghtk.service';
import { ViettelPostService } from './providers/viettelpost/viettelpost.service';
import { VNPostService } from './providers/vnpost/vnpost.service';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment]), CacheModule, SecurityModule],
  controllers: [ShippingController],
  providers: [ShippingService, GHNService, GHTKService, ViettelPostService, VNPostService],
  exports: [ShippingService],
})
export class ShippingModule {}

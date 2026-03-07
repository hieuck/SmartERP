import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { Shipment } from './entities/shipment.entity';
import { GHNService } from './providers/ghn/ghn.service';
import { GHTKService } from './providers/ghtk/ghtk.service';
import { ViettelPostService } from './providers/viettelpost/viettelpost.service';
import { VNPostService } from './providers/vnpost/vnpost.service';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment]), CacheModule],
  controllers: [ShippingController],
  providers: [ShippingService, GHNService, GHTKService, ViettelPostService, VNPostService],
  exports: [ShippingService],
})
export class ShippingModule {}

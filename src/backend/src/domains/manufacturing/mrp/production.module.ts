import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bom } from './entities/bom.entity';
import { Material } from './entities/material.entity';
import { Mold } from './entities/mold.entity';
import { QualityCheck } from './entities/quality-check.entity';
import { WorkOrder } from './entities/work-order.entity';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, Mold, Bom, WorkOrder, QualityCheck]),
    CacheModule,
    SecurityModule,
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}

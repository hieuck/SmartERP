import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { Material } from './entities/material.entity';
import { Mold } from './entities/mold.entity';
import { Bom } from './entities/bom.entity';
import { WorkOrder } from './entities/work-order.entity';
import { QualityCheck } from './entities/quality-check.entity';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Material, Mold, Bom, WorkOrder, QualityCheck]), CacheModule],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}

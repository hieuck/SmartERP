import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerialBatchController } from './serial-batch.controller';
import { SerialBatchService } from './serial-batch.service';
import { SerialNumber } from './entities/serial-number.entity';
import { Batch } from './entities/batch.entity';
import { BatchStock } from './entities/batch-stock.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SerialNumber, Batch, BatchStock, Product])],
  controllers: [SerialBatchController],
  providers: [SerialBatchService],
  exports: [SerialBatchService],
})
export class SerialBatchModule {}

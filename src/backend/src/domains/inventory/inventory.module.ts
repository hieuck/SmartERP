import { Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { StockModule } from './stock/stock.module';
import { SerialBatchModule } from './serial-batch/serial-batch.module';
import { ValuationModule } from './valuation/valuation.module';

@Module({
  imports: [CategoryModule, ProductModule, StockModule, SerialBatchModule, ValuationModule],
  exports: [CategoryModule, ProductModule, StockModule, SerialBatchModule, ValuationModule],
})
export class InventoryModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValuationController } from './valuation.controller';
import { ValuationService } from './valuation.service';
import { StockValuation } from './entities/stock-valuation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockValuation])],
  controllers: [ValuationController],
  providers: [ValuationService],
  exports: [ValuationService],
})
export class ValuationModule {}

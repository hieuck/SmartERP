import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BOM } from '../enums/manufacturing.enum';
import { BOMLine } from '../enums/manufacturing.enum';
import { BOMService } from './bom.service';
import { BOMController } from './bom.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BOM, BOMLine])],
  controllers: [BOMController],
  providers: [BOMService],
  exports: [BOMService],
})
export class BOMModule {}

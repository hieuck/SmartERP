import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BOM } from './entities/bom.entity';
import { BOMLine } from './entities/bom-line.entity';
import { BOMService } from './bom.service';
import { BOMController } from './bom.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BOM, BOMLine])],
  controllers: [BOMController],
  providers: [BOMService],
  exports: [BOMService],
})
export class BOMModule {}

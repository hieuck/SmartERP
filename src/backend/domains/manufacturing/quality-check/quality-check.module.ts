import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityCheck } from './entities/quality-check.entity';
import { QualityCheckService } from './quality-check.service';
import { CacheModule } from '../../../common/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([QualityCheck]), CacheModule],
  providers: [QualityCheckService],
  exports: [QualityCheckService],
})
export class QualityCheckModule {}

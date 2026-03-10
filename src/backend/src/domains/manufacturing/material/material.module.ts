import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { MaterialService } from './material.service';
import { CacheModule } from '../../../common/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Material]), CacheModule],
  providers: [MaterialService],
  exports: [MaterialService],
})
export class MaterialModule {}

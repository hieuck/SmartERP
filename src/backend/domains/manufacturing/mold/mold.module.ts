import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mold } from './entities/mold.entity';
import { MoldService } from './mold.service';
import { CacheModule } from '../../../common/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mold]), CacheModule],
  providers: [MoldService],
  exports: [MoldService],
})
export class MoldModule {}

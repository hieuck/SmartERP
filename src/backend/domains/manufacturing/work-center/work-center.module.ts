import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkCenter } from './entities/work-center.entity';
import { WorkCenterService } from './work-center.service';
import { WorkCenterController } from './work-center.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkCenter])],
  controllers: [WorkCenterController],
  providers: [WorkCenterService],
  exports: [WorkCenterService],
})
export class WorkCenterModule {}

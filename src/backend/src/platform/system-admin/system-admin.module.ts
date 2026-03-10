import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemAdminController } from './system-admin.controller';
import { SystemAdminService } from './system-admin.service';
import { SystemSetting } from './entities/system-setting.entity';
import { BackgroundJob } from './entities/background-job.entity';
import { ErrorLog } from './entities/error-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting, BackgroundJob, ErrorLog])],
  controllers: [SystemAdminController],
  providers: [SystemAdminService],
  exports: [SystemAdminService],
})
export class SystemAdminModule {}

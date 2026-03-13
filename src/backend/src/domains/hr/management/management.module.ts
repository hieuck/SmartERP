import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Leave } from '../leave/entities/leave.entity';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Attendance, Leave]), CacheModule, SecurityModule],
  controllers: [ManagementController],
  providers: [ManagementService],
  exports: [ManagementService],
})
export class ManagementModule {}

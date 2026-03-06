import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { Payslip } from './entities/payslip.entity';
import { PieceRateWork } from './entities/piece-rate-work.entity';
import { WorkOrder } from './entities/work-order.entity';
import { Employee } from '../hr/entities/employee.entity';
import { Attendance } from '../hr/entities/attendance.entity';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollPeriod,
      Payslip,
      PieceRateWork,
      WorkOrder,
      Employee,
      Attendance,
    ]),
    CacheModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}

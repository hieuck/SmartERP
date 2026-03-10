import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { SalaryStructure } from './entities/salary-structure.entity';
import { Payslip } from './entities/payslip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryStructure, Payslip])],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}

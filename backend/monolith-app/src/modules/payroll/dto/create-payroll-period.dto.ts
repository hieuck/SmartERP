import { IsString, IsDateString } from 'class-validator';

export class CreatePayrollPeriodDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

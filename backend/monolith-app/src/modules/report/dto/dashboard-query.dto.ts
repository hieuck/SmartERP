import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum DashboardPeriod {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export class DashboardQueryDto {
  @IsEnum(DashboardPeriod)
  @IsOptional()
  period?: DashboardPeriod;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  compareWith?: string;
}

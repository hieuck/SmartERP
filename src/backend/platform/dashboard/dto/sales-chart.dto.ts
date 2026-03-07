import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SalesChartQueryDto {
  @ApiProperty({ example: 30, required: false, minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

export class SalesChartDataDto {
  @ApiProperty({ example: '2026-03-07' })
  date: string;

  @ApiProperty({ example: 1500000 })
  revenue: number;

  @ApiProperty({ example: 15 })
  orders: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum ChartPeriod {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class MobileChartQueryDto {
  @ApiProperty({ enum: ChartPeriod, example: ChartPeriod.WEEK, required: false })
  @IsOptional()
  @IsEnum(ChartPeriod)
  period?: ChartPeriod = ChartPeriod.WEEK;
}

export class MobileChartDataDto {
  @ApiProperty({ example: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] })
  labels: string[];

  @ApiProperty({ example: [1500000, 2000000, 1800000, 2200000, 1900000, 2500000, 2100000] })
  values: number[];
}

export class RecentOrderDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'ORD-2026-0001' })
  code: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  customerName: string;

  @ApiProperty({ example: 1500000 })
  totalAmount: number;

  @ApiProperty({ example: 'confirmed' })
  status: string;

  @ApiProperty({ example: '2026-03-07T10:30:00Z' })
  orderDate: string;
}

export class LowStockProductDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  name: string;

  @ApiProperty({ example: 'IP15PM-256-BLK' })
  sku: string;

  @ApiProperty({ example: 5 })
  currentStock: number;

  @ApiProperty({ example: 10 })
  minStock: number;
}

export class MobileTopItemsQueryDto {
  @ApiProperty({ example: 5, required: false, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}

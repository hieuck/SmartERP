import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TopItemsQueryDto {
  @ApiProperty({ example: 10, required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class TopProductDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  name: string;

  @ApiProperty({ example: 5500000 })
  revenue: number;

  @ApiProperty({ example: 25 })
  quantity: number;
}

export class TopCustomerDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Công ty TNHH ABC' })
  name: string;

  @ApiProperty({ example: 15000000 })
  totalSpent: number;

  @ApiProperty({ example: 12 })
  orderCount: number;
}

export class RevenueByCategoryDto {
  @ApiProperty({ example: 'Điện thoại' })
  category: string;

  @ApiProperty({ example: 25000000 })
  revenue: number;

  @ApiProperty({ example: 35.5 })
  percentage: number;
}

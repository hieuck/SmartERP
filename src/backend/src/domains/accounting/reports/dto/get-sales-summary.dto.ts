import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetSalesSummaryDto {
  @ApiProperty({
    description: 'Start date for sales report',
    example: '2026-03-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for sales report',
    example: '2026-03-31',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Customer ID to filter sales (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

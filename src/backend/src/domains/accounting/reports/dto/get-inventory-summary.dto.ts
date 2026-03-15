import { _IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetInventorySummaryDto {
  @ApiProperty({
    description: 'Product ID to filter inventory (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    description: 'Category ID to filter inventory (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Include low stock items only (optional)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsOptional()
  lowStockOnly?: boolean;
}

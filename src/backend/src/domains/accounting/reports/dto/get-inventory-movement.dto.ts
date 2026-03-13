import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetInventoryMovementDto {
  @ApiProperty({
    description: 'Start date for inventory movement',
    example: '2026-03-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for inventory movement',
    example: '2026-03-31',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Product ID to filter inventory movement (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    description: 'Warehouse ID to filter inventory movement (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

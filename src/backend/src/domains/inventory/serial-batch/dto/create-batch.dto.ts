import { IsString, IsUUID, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ example: 'BATCH-2026-001', description: 'Unique batch number' })
  @IsString()
  number: string;

  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 100, description: 'Batch quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Manufacturing date' })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: Date;

  @ApiPropertyOptional({ example: '2027-01-01', description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: Date;
}

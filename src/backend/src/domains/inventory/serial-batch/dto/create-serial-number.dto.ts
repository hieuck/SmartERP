import { IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSerialNumberDto {
  @ApiProperty({ example: 'SN-2026-001', description: 'Unique serial number' })
  @IsString()
  number: string;

  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Warehouse ID' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Purchase date' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: Date;

  @ApiPropertyOptional({ example: '2027-01-01', description: 'Warranty expiry date' })
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: Date;
}

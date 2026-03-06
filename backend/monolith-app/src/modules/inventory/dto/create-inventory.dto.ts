import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'uuid', description: 'Warehouse ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ example: 100, description: 'Quantity' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Maximum quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxQuantity?: number;

  @ApiPropertyOptional({ example: 50.0, description: 'Unit cost' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ example: 'Aisle 3, Shelf B', description: 'Storage location' })
  @IsString()
  @IsOptional()
  location?: string;
}

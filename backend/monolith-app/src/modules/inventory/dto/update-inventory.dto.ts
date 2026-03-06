import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiPropertyOptional({ example: 150, description: 'Quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ example: 15, description: 'Minimum quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 1500, description: 'Maximum quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxQuantity?: number;

  @ApiPropertyOptional({ example: 20, description: 'Reorder point' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ example: 55.0, description: 'Unit cost' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ example: 'Aisle 4, Shelf C', description: 'Storage location' })
  @IsString()
  @IsOptional()
  location?: string;
}

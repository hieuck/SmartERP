import { IsString, IsEnum, IsNumber, IsOptional, IsUUID, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialType } from '../entities/material.entity';

export class CreateMaterialDto {
  @ApiProperty({ example: 'MAT-001', description: 'Material code' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Gypsum Powder', description: 'Material name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'High quality gypsum powder',
    description: 'Material description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MaterialType, example: MaterialType.RAW, description: 'Material type' })
  @IsEnum(MaterialType)
  type: MaterialType;

  @ApiProperty({ example: 'kg', description: 'Unit of measurement' })
  @IsString()
  @MaxLength(50)
  unit: string;

  @ApiProperty({ example: 25.5, description: 'Purchase price per unit' })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiPropertyOptional({ example: 'uuid', description: 'Supplier ID' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiProperty({ example: 1000, description: 'Current stock quantity' })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiPropertyOptional({ example: 100, description: 'Minimum stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Maximum stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQuantity?: number;

  @ApiPropertyOptional({ example: 200, description: 'Reorder point' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ example: 500, description: 'Reorder quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderQuantity?: number;

  @ApiPropertyOptional({ example: 'Warehouse A, Shelf 3', description: 'Storage location' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  storageLocation?: string;

  @ApiPropertyOptional({ example: 'Handle with care', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'active', description: 'Material status' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}

import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  IsDateString,
  IsBoolean,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BomStatus } from '../entities/bom.entity';

export class BomMaterialItemDto {
  @ApiProperty({ example: 'uuid', description: 'Material ID' })
  @IsUUID()
  materialId: string;

  @ApiProperty({ example: 'MAT-001', description: 'Material code' })
  @IsString()
  materialCode: string;

  @ApiProperty({ example: 'Gypsum Powder', description: 'Material name' })
  @IsString()
  materialName: string;

  @ApiProperty({ example: 5.5, description: 'Quantity required' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'kg', description: 'Unit of measurement' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: 25.5, description: 'Unit cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ example: 140.25, description: 'Total cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCost?: number;

  @ApiPropertyOptional({ example: 'Primary material', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BomOperationStepDto {
  @ApiProperty({ example: 1, description: 'Step number' })
  @IsNumber()
  @Min(1)
  stepNumber: number;

  @ApiProperty({ example: 'Mix materials', description: 'Step name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Mix gypsum with water', description: 'Step description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 30, description: 'Duration' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ example: 'minutes', description: 'Duration unit' })
  @IsOptional()
  @IsString()
  durationUnit?: string;

  @ApiPropertyOptional({ example: 'Workstation A', description: 'Workstation' })
  @IsOptional()
  @IsString()
  workstation?: string;

  @ApiPropertyOptional({ example: 'Use low speed mixer', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBomDto {
  @ApiProperty({ example: 'BOM-001', description: 'BOM code' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Ceiling Tile BOM', description: 'BOM name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Bill of materials for ceiling tile',
    description: 'BOM description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 'Ceiling Tile', description: 'Product name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productName?: string;

  @ApiPropertyOptional({ example: 1, description: 'BOM version' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  version?: number;

  @ApiPropertyOptional({ enum: BomStatus, example: BomStatus.DRAFT, description: 'BOM status' })
  @IsOptional()
  @IsEnum(BomStatus)
  status?: BomStatus;

  @ApiProperty({ example: 1, description: 'Quantity to produce' })
  @IsNumber()
  @Min(0.01)
  quantityToProduce: number;

  @ApiPropertyOptional({ example: 'pcs', description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiProperty({ type: [BomMaterialItemDto], description: 'Material items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomMaterialItemDto)
  materialItems: BomMaterialItemDto[];

  @ApiPropertyOptional({ type: [BomOperationStepDto], description: 'Operation steps' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomOperationStepDto)
  operationSteps?: BomOperationStepDto[];

  @ApiPropertyOptional({ example: 500.0, description: 'Total material cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalMaterialCost?: number;

  @ApiPropertyOptional({ example: 100.0, description: 'Labor cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @ApiPropertyOptional({ example: 50.0, description: 'Overhead cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overheadCost?: number;

  @ApiPropertyOptional({ example: 650.0, description: 'Total cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCost?: number;

  @ApiPropertyOptional({ example: 120, description: 'Estimated duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ example: 'Standard production BOM', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false, description: 'Is default BOM for product' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Effective date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  effectiveDate?: Date;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  expiryDate?: Date;
}

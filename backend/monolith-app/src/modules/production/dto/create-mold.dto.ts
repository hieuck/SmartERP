import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoldStatus, MoldCondition } from '../entities/mold.entity';

export class CreateMoldDto {
  @ApiProperty({ example: 'MOLD-001', description: 'Mold code' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Decorative Ceiling Mold', description: 'Mold name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Large decorative ceiling mold',
    description: 'Mold description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Ceiling', description: 'Mold category' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    example: { length: 100, width: 50, height: 10, unit: 'cm' },
    description: 'Mold dimensions',
  })
  @IsOptional()
  @IsObject()
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };

  @ApiPropertyOptional({ example: 'Silicone', description: 'Mold material' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  material?: string;

  @ApiPropertyOptional({ example: 1500.0, description: 'Purchase cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Purchase date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  purchaseDate?: Date;

  @ApiPropertyOptional({ example: 'uuid', description: 'Supplier ID' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ enum: MoldStatus, example: MoldStatus.ACTIVE, description: 'Mold status' })
  @IsOptional()
  @IsEnum(MoldStatus)
  status?: MoldStatus;

  @ApiPropertyOptional({
    enum: MoldCondition,
    example: MoldCondition.EXCELLENT,
    description: 'Mold condition',
  })
  @IsOptional()
  @IsEnum(MoldCondition)
  condition?: MoldCondition;

  @ApiPropertyOptional({ example: 0, description: 'Usage count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageCount?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Maximum usage count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsageCount?: number;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Last maintenance date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  lastMaintenanceDate?: Date;

  @ApiPropertyOptional({ example: '2024-07-15', description: 'Next maintenance date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  nextMaintenanceDate?: Date;

  @ApiPropertyOptional({ example: 180, description: 'Maintenance interval in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maintenanceIntervalDays?: number;

  @ApiPropertyOptional({ example: 'Workshop B, Rack 5', description: 'Storage location' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  storageLocation?: string;

  @ApiPropertyOptional({ example: 'Handle with care', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

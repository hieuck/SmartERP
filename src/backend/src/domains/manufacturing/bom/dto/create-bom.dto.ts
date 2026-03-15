import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum BOMType {
  MANUFACTURE = 'manufacture',
  KIT = 'kit',
}

export class BOMLineItemDto {
  @ApiProperty({ example: 'prod-uuid-456', description: 'Component product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 5, description: 'Quantity required' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ example: 10.5, description: 'Unit cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class CreateBOMDto {
  @ApiProperty({ example: 'prod-uuid-123', description: 'Product ID to manufacture' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 1, description: 'Product quantity to produce' })
  @IsNumber()
  @Min(0.01)
  productQty: number;

  @ApiProperty({ example: 'manufacture', enum: BOMType, description: 'BOM type' })
  @IsEnum(BOMType)
  type: BOMType;

  @ApiPropertyOptional({ example: 'v1.0', description: 'BOM version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: true, description: 'Is this the active BOM?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'routing-uuid-123', description: 'Routing ID for operations' })
  @IsOptional()
  @IsString()
  routingId?: string;

  @ApiPropertyOptional({ type: [BOMLineItemDto], description: 'BOM lines' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BOMLineItemDto)
  lines?: BOMLineItemDto[];
}

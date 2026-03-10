import { IsString, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReferenceType {
  PURCHASE = 'purchase',
  PRODUCTION = 'production',
  ADJUSTMENT = 'adjustment',
}

export class AddStockValuationDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  warehouseId: string;

  @ApiProperty({ description: 'Quantity received', example: 100 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'Unit cost', example: 10.5 })
  @IsNumber()
  @IsPositive()
  unitCost: number;

  @ApiProperty({ enum: ReferenceType, description: 'Reference type' })
  @IsEnum(ReferenceType)
  referenceType: ReferenceType;

  @ApiProperty({ description: 'Reference ID (e.g., PO-001)' })
  @IsString()
  referenceId: string;
}

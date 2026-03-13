import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InventoryTransactionType } from '../../enums/inventory.enum';

export class AdjustInventoryDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  adjustment: number;

  @ApiProperty({ enum: InventoryTransactionType, example: InventoryTransactionType.ADJUSTMENT })
  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @ApiProperty({ example: 'Stock adjustment due to physical count', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: 'REF-001', required: false })
  @IsString()
  @IsOptional()
  reference?: string;
}

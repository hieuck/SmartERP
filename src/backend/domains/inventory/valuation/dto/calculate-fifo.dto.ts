import { IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateFIFODto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  warehouseId: string;

  @ApiProperty({ description: 'Quantity to calculate cost for', example: 50 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

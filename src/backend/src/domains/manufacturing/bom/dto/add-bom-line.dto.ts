import { IsString, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BOMLineType {
  COMPONENT = 'component',
  CONSUMABLE = 'consumable',
}

export class AddBOMLineDto {
  @ApiProperty({ example: 'prod-uuid-456', description: 'Component product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 5, description: 'Quantity required' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ example: 'component', enum: BOMLineType, description: 'Line type' })
  @IsOptional()
  @IsEnum(BOMLineType)
  type?: BOMLineType;

  @ApiPropertyOptional({ example: 1, description: 'Sequence order' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sequence?: number;
}

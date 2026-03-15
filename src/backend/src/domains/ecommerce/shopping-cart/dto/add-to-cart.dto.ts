import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariant } from '../interfaces/product-variant.interface';

export class AddToCartDto {
  @ApiProperty({ example: 'prod-uuid-123' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: { size: 'M', color: 'Red' },
  })
  @IsOptional()
  @IsObject()
  selectedVariant?: ProductVariant;

  @ApiPropertyOptional({ example: 'Gift wrap please' })
  @IsOptional()
  @IsString()
  notes?: string;
}

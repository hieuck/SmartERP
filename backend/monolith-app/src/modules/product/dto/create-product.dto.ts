import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
}

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop Pro 15', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SKU-001', description: 'Product SKU' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ example: 'High-performance laptop', description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: ProductType,
    example: ProductType.PHYSICAL,
    description: 'Product type',
  })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiProperty({ example: 999.99, description: 'Product price' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 750.0, description: 'Product cost' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 50, description: 'Stock quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 10, description: 'Low stock threshold' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: 'pcs', description: 'Unit of measure' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: '1234567890123', description: 'Product barcode' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'Product image URL',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

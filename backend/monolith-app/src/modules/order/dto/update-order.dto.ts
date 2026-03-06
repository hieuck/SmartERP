import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Product ID' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ example: 10, description: 'Quantity' })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 89.99, description: 'Unit price' })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 5, description: 'Discount percentage' })
  @IsNumber()
  @IsOptional()
  discount?: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'ORD-002', description: 'Order number' })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ type: [OrderItemDto], description: 'Order items' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiPropertyOptional({ example: 1500.0, description: 'Total amount' })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Order notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '456 New St', description: 'Shipping address' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @ApiPropertyOptional({ example: 'PayPal', description: 'Payment method' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 20.0, description: 'Shipping cost' })
  @IsNumber()
  @IsOptional()
  shippingCost?: number;

  @ApiPropertyOptional({ example: 30.0, description: 'Tax amount' })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Discount amount' })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 'confirmed', description: 'Order status' })
  @IsString()
  @IsOptional()
  status?: string;
}

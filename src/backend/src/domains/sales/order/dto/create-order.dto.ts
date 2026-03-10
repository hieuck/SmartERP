import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 'uuid', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 5, description: 'Quantity' })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 99.99, description: 'Unit price' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ example: 10, description: 'Discount percentage' })
  @IsNumber()
  @IsOptional()
  discount?: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'ORD-001', description: 'Order number' })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiProperty({ example: 'uuid', description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ type: [OrderItemDto], description: 'Order items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 'draft', description: 'Order status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Urgent delivery', description: 'Order notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Shipping address' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @ApiPropertyOptional({ example: 'Credit Card', description: 'Payment method' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 15.0, description: 'Shipping cost' })
  @IsNumber()
  @IsOptional()
  shippingCost?: number;

  @ApiPropertyOptional({ example: 25.0, description: 'Tax amount' })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ example: 10.0, description: 'Discount amount' })
  @IsNumber()
  @IsOptional()
  discount?: number;
}

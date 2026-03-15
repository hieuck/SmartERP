import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'Product Name' })
  @IsString()
  productName: string;

  @ApiProperty({ example: 'SKU-001' })
  @IsString()
  productSku: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsString()
  @IsOptional()
  productImage?: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: { size: 'L', color: 'Red' }, required: false })
  @IsObject()
  @IsOptional()
  selectedVariant?: unknown;

  @ApiProperty({ example: 'Gift wrap please', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ example: '+84901234567', required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    example: {
      fullName: 'John Doe',
      phone: '+84901234567',
      addressLine1: '123 Main St',
      city: 'HCMC',
      postalCode: '700000',
      country: 'Vietnam',
    },
  })
  @IsObject()
  shippingAddress: unknown;

  @ApiProperty({
    example: {
      fullName: 'John Doe',
      phone: '+84901234567',
      addressLine1: '123 Main St',
      city: 'HCMC',
      postalCode: '700000',
      country: 'Vietnam',
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  billingAddress?: unknown;

  @ApiProperty({ example: 'standard', required: false })
  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @ApiProperty({ example: 'stripe', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: 'SUMMER2024', required: false })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({ example: 'Please deliver after 5pm', required: false })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}

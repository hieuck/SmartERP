import { IsString, IsEmail, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+84901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  addressLine1: string;

  @ApiProperty({ example: 'Apt 4B', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'District 1', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '700000' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'Vietnam' })
  @IsString()
  country: string;
}

export class CheckoutDto {
  @ApiProperty({ example: 'cart-uuid' })
  @IsString()
  cartId: string;

  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ example: '+84901234567', required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ type: AddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ApiProperty({ type: AddressDto, required: false })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @ApiProperty({ example: 'standard', required: false })
  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @ApiProperty({ example: 'stripe', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: 'Please deliver after 5pm', required: false })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}

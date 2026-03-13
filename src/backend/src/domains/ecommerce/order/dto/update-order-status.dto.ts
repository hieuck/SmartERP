import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../../enums/ecommerce.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED, required: false })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID, required: false })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiProperty({ enum: ShippingStatus, example: ShippingStatus.SHIPPED, required: false })
  @IsEnum(ShippingStatus)
  @IsOptional()
  shippingStatus?: ShippingStatus;

  @ApiProperty({ example: 'TRACK123456', required: false })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiProperty({ example: 'Internal notes', required: false })
  @IsString()
  @IsOptional()
  internalNotes?: string;
}

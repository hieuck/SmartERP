import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessPaymentDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'stripe', description: 'Payment gateway: stripe, paypal, vnpay, momo, cod' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ example: 199.99 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'tok_visa', required: false, description: 'Payment token from gateway' })
  @IsString()
  @IsOptional()
  paymentToken?: string;

  @ApiProperty({ example: { cardLast4: '4242' }, required: false })
  @IsOptional()
  paymentDetails?: any;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'txn_123456789' })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: 'stripe' })
  @IsString()
  paymentMethod: string;
}

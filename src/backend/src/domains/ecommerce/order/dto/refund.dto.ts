import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  orderId: string;

  @ApiProperty({
    example: 199.99,
    required: false,
    description: 'Refund amount (defaults to full order total)',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiProperty({ example: 'Product defective' })
  @IsString()
  reason: string;
}

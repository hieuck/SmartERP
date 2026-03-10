import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyCouponDto {
  @ApiProperty({ example: 'SUMMER2026' })
  @IsString()
  couponCode: string;
}

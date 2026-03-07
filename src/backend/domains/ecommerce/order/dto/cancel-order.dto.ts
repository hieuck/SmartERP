import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'Customer requested cancellation' })
  @IsString()
  reason: string;
}

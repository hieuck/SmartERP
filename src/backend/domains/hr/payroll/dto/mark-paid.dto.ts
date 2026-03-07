import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MarkPaidDto {
  @ApiProperty({ example: '2026-03-31', description: 'Payment date' })
  @Type(() => Date)
  @IsDate()
  paymentDate: Date;
}

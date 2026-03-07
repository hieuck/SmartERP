import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetTrialBalanceDto {
  @ApiProperty({
    description: 'As of date for trial balance',
    example: '2026-03-07',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}

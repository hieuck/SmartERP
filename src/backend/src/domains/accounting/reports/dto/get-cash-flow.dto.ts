import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCashFlowDto {
  @ApiProperty({
    description: 'Start date',
    example: '2026-03-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date',
    example: '2026-03-31',
  })
  @IsDateString()
  endDate: string;
}

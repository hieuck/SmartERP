import { IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetGeneralLedgerDto {
  @ApiProperty({
    description: 'Account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  accountId: string;

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

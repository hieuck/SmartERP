import { IsDateString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PullDto {
  @ApiProperty({
    description: 'Last sync timestamp (ISO 8601)',
    example: '2026-03-15T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiProperty({
    description: 'Entity types to sync',
    example: ['users', 'products', 'orders'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  entities?: string[];
}

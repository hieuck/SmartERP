import { IsString, IsOptional, IsDateString, IsNumber, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeEntryDto {
  @ApiProperty({ example: 'uuid-of-task' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ example: '2026-03-07' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 8, minimum: 0.1, maximum: 24 })
  @IsNumber()
  @Min(0.1)
  @Max(24)
  hours: number;

  @ApiPropertyOptional({ example: 'Implemented authentication module' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}

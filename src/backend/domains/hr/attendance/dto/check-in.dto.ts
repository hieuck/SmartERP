import { IsDateString, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Check-in time (HH:MM:SS)' })
  @IsString()
  checkInTime: string;

  @ApiProperty({ description: 'Optional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

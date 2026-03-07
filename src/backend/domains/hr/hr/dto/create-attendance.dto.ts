import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '../entities/attendance.entity';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'uuid', description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: '2024-02-28', description: 'Attendance date' })
  @IsDateString()
  @Type(() => Date)
  date: Date;

  @ApiPropertyOptional({ example: '09:00:00', description: 'Check-in time (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Check-in time must be in HH:mm:ss format',
  })
  checkIn?: string;

  @ApiPropertyOptional({ example: '18:00:00', description: 'Check-out time (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Check-out time must be in HH:mm:ss format',
  })
  checkOut?: string;

  @ApiPropertyOptional({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status',
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Late due to traffic', description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

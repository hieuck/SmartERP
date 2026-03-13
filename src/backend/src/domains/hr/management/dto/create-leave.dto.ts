import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType, LeaveStatus } from '../../enums/hr.enum';

export class CreateLeaveDto {
  @ApiProperty({ example: 'uuid', description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: LeaveType, example: LeaveType.ANNUAL, description: 'Leave type' })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ example: '2024-03-01', description: 'Start date' })
  @IsDateString()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2024-03-05', description: 'End date' })
  @IsDateString()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ example: 5, description: 'Number of days' })
  @IsNumber()
  @Min(1)
  days: number;

  @ApiPropertyOptional({
    enum: LeaveStatus,
    example: LeaveStatus.PENDING,
    description: 'Leave status',
  })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiPropertyOptional({ example: 'Family vacation', description: 'Reason for leave' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Approved by user ID' })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;
}

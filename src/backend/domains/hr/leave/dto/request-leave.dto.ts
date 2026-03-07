import { IsDateString, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '../entities/leave.entity';

export class RequestLeaveDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: LeaveType, description: 'Leave type' })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Reason for leave' })
  @IsString()
  reason: string;
}

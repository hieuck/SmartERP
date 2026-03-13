import { IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '../../enums/hr.enum';

export class AllocateLeaveDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: LeaveType, description: 'Leave type' })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ description: 'Year' })
  @IsNumber()
  @Min(2020)
  year: number;

  @ApiProperty({ description: 'Number of days to allocate' })
  @IsNumber()
  @Min(0)
  days: number;
}

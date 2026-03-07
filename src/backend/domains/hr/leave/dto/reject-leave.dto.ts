import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectLeaveDto {
  @ApiProperty({ description: 'Leave request ID' })
  @IsUUID()
  leaveId: string;

  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  rejectionReason: string;
}

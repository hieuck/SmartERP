import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveLeaveDto {
  @ApiProperty({ description: 'Leave request ID' })
  @IsUUID()
  leaveId: string;
}

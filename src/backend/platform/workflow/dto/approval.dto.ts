import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SubmitApprovalDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;
}

export class RejectApprovalDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

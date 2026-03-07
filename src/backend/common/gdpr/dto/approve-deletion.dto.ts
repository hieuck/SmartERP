import { IsBoolean, IsString, IsOptional, ValidateIf } from 'class-validator';

export class ApproveDeletionDto {
  @IsBoolean()
  approved: boolean;

  @ValidateIf((o) => !o.approved)
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

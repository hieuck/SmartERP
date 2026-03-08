import { IsOptional, IsString, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { IssuePriority } from '../../issue-tracking/entities/issue.entity';

export class UpdateSLADto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsInt()
  @Min(1)
  responseTimeHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  resolutionTimeHours?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

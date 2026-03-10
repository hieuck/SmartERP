import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { IssuePriority } from '../../issue-tracking/entities/issue.entity';

export class CreateSLADto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(IssuePriority)
  priority: IssuePriority;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  responseTimeHours: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  resolutionTimeHours: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
